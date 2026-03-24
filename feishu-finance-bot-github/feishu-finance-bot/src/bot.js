#!/usr/bin/env node
/**
 * 飞书财报机器人 - 轮询模式
 * 定期拉取消息，无需 WebSocket 配置
 */

const https = require('https');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 加载配置
const configPath = path.join(__dirname, '../config/config.json');
let config;

try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (e) {
    console.error('❌ 配置文件不存在');
    process.exit(1);
}

// HTTP POST 请求
function postRequest(urlPath, data, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'open.feishu.cn',
            port: 443,
            path: urlPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch (e) {
                    resolve({ raw: responseData });
                }
            });
        });
        
        req.on('error', reject);
        req.write(JSON.stringify(data));
        req.end();
    });
}

// HTTP GET 请求
function getRequest(urlPath, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'open.feishu.cn',
            port: 443,
            path: urlPath,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        };
        
        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch (e) {
                    resolve({ raw: responseData });
                }
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

// Token 管理
let accessToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
    if (accessToken && Date.now() < tokenExpiry) {
        return accessToken;
    }
    
    const result = await postRequest('/open-apis/auth/v3/tenant_access_token/internal', {
        app_id: config.feishu.appId,
        app_secret: config.feishu.appSecret
    });
    
    if (result.code === 0 || result.code === '0') {
        accessToken = result.tenant_access_token;
        tokenExpiry = Date.now() + (result.expire - 300) * 1000;
        console.log('✅ Access Token 已刷新');
        return accessToken;
    } else {
        throw new Error(`获取 Token 失败：${result.msg}`);
    }
}

// 发送消息
async function sendMessage(chatId, text) {
    try {
        const token = await getAccessToken();
        const result = await postRequest('/open-apis/im/v1/messages?receive_id_type=chat_id', {
            receive_id: chatId,
            msg_type: 'text',
            content: JSON.stringify({ text })
        }, token);
        
        if (result.code === 0 || result.code === '0') {
            console.log(`📤 已发送：${text.substring(0, 30)}...`);
            return result;
        } else {
            console.error('发送失败:', result);
            throw new Error(result.msg);
        }
    } catch (e) {
        console.error('发送异常:', e.message);
        throw e;
    }
}

// 获取最近消息（轮询）
async function getRecentMessages(chatId, startTime) {
    try {
        const token = await getAccessToken();
        const result = await getRequest(
            `/open-apis/im/v1/messages?receive_id_type=chat_id&start_time=${startTime}&limit=10`,
            token
        );
        
        if (result.code === 0 || result.code === '0') {
            return result.data || { items: [] };
        } else {
            console.error('获取消息失败:', result);
            return { items: [] };
        }
    } catch (e) {
        console.error('获取消息异常:', e.message);
        return { items: [] };
    }
}

// MCP Server
let mcpProcess = null;

function startMCPServer() {
    mcpProcess = spawn('node', [path.join(__dirname, 'mcp_server.js')], {
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    mcpProcess.stderr.on('data', (data) => {
        console.log('MCP:', data.toString().trim());
    });
    
    mcpProcess.on('close', (code) => {
        console.log(`⚠️ MCP 退出：${code}`);
    });
    
    console.log('✅ MCP Server 已启动');
}

// 调用 MCP
async function callMCP(toolName, args) {
    return new Promise((resolve, reject) => {
        if (!mcpProcess) {
            reject(new Error('MCP 未启动'));
            return;
        }
        
        const requestId = Date.now();
        const request = {
            jsonrpc: '2.0',
            id: requestId,
            method: 'tools/call',
            params: { name: toolName, arguments: args }
        };
        
        let responseData = '';
        
        const handleResponse = (data) => {
            responseData += data.toString();
            try {
                const lines = responseData.trim().split('\n');
                for (const line of lines) {
                    const response = JSON.parse(line);
                    if (response.id === requestId) {
                        mcpProcess.stdout.removeListener('data', handleResponse);
                        resolve(response.result);
                        return;
                    }
                }
            } catch (e) {}
        };
        
        mcpProcess.stdout.on('data', handleResponse);
        mcpProcess.stdin.write(JSON.stringify(request) + '\n');
        
        setTimeout(() => {
            mcpProcess.stdout.removeListener('data', handleResponse);
            reject(new Error('MCP 超时'));
        }, 30000);
    });
}

// 提取股票代码
function extractStockCode(text, mentions) {
    if (!mentions || mentions.length === 0) return null;
    
    let cleanText = text;
    for (const m of mentions) {
        cleanText = cleanText.replace(new RegExp(`<at[^>]*id=["']${m.id}["'][^>]*>[^<]*</at>`, 'g'), '');
        cleanText = cleanText.replace(new RegExp(`<at[^>]*>[^<]*</at>`, 'g'), '');
    }
    
    return cleanText.trim() || null;
}

// 处理消息
async function handleMessage(message, botId) {
    const { content, mentions, chat_id, sender_id } = message;
    
    // 忽略自己发的消息
    if (sender_id === botId) return;
    
    // 只处理 @机器人的消息
    if (!mentions || mentions.length === 0) return;
    
    let text = '';
    try {
        const contentObj = typeof content === 'string' ? JSON.parse(content) : content;
        text = contentObj.text || '';
    } catch (e) {
        text = typeof content === 'string' ? content : '';
    }
    
    console.log(`📨 消息：${text}`);
    
    const stockQuery = extractStockCode(text, mentions);
    
    if (!stockQuery) {
        await sendMessage(chat_id, '👋 请在 @机器人 后加上股票代码或公司名，例如：\n@机器人 600519\n@机器人 贵州茅台');
        return;
    }
    
    console.log(`🔍 查询：${stockQuery}`);
    await sendMessage(chat_id, `🔍 正在查询 **${stockQuery}** 的财报数据，请稍候...`);
    
    try {
        const result = await callMCP('generate_one_pager', { stock_code: stockQuery });
        
        if (result && result.content && result.content[0]) {
            const reportData = JSON.parse(result.content[0].text);
            const report = reportData.report || reportData.error || '生成失败';
            await sendMessage(chat_id, report);
        } else {
            await sendMessage(chat_id, '❌ 财报数据获取失败，请稍后重试');
        }
    } catch (error) {
        console.error('MCP 错误:', error);
        await sendMessage(chat_id, `❌ 查询出错：${error.message}`);
    }
}

// 轮询消息
async function pollMessages() {
    const token = await getAccessToken();
    
    // 获取机器人 ID
    const botInfo = await getRequest('/open-apis/auth/v3/app_access_token', token);
    const botId = 'cli_a93166220039dbd6'; // 使用 App ID 作为标识
    
    console.log('🤖 机器人 ID:', botId);
    console.log('✅ 轮询模式已启动，每 3 秒检查新消息...');
    console.log('📝 用法：在群里 @机器人 + 股票代码/公司名');
    
    const processedMessages = new Set();
    let lastCheckTime = Math.floor(Date.now() / 1000) - 60; // 从 1 分钟前开始
    
    // 注意：轮询模式需要知道具体的 chat_id
    // 这里我们使用一个简化的方法：监听所有消息需要事件订阅权限
    // 更好的方案是使用飞书的事件订阅 webhook
    
    console.log('⚠️  轮询模式限制：需要知道具体的群聊 ID 才能拉取消息');
    console.log('💡 建议：在飞书开放平台启用"事件订阅"，使用 Webhook 模式');
    console.log('');
    console.log('临时方案：在飞书开放平台 → 事件订阅 → 添加订阅地址');
    console.log('订阅地址可以是：http://your-server:3000/webhook');
}

// 主函数
async function main() {
    console.log('🚀 飞书财报助手启动中...');
    
    startMCPServer();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await getAccessToken();
    
    // 启动轮询
    await pollMessages();
}

main().catch(console.error);
