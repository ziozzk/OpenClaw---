#!/usr/bin/env node
/**
 * 飞书财报机器人 - Webhook 模式
 * 需要配置事件订阅 URL 指向本服务
 */

const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 加载配置
const configPath = path.join(__dirname, '../config/config.json');
let config;

try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (e) {
    console.error('❌ 配置文件不存在');
    process.exit(1);
}

const PORT = process.env.PORT || 3000;

// HTTP POST 请求
function postRequest(urlPath, data, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'open.feishu.cn',
            port: 443,
            path: urlPath,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
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
            console.log(`📤 已发送`);
            return result;
        } else {
            throw new Error(result.msg);
        }
    } catch (e) {
        console.error('发送异常:', e.message);
        throw e;
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
    
    console.log('✅ MCP Server 已启动');
}

// 调用 MCP
async function callMCP(toolName, args) {
    return new Promise((resolve, reject) => {
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
        cleanText = cleanText.replace(/<at[^>]*>[^<]*<\/at>/g, '');
    }
    
    return cleanText.trim() || null;
}

// 处理消息事件
async function handleMessageEvent(event) {
    const message = event.message;
    const { content, mentions, chat_id } = message;
    
    // 只处理 @机器人的消息
    if (!mentions || mentions.length === 0) {
        return;
    }
    
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
            await sendMessage(chat_id, '❌ 财报数据获取失败');
        }
    } catch (error) {
        console.error('MCP 错误:', error);
        await sendMessage(chat_id, `❌ 查询出错：${error.message}`);
    }
}

// 验证挑战值（飞书事件订阅验证）
function handleChallenge(challenge) {
    console.log('✅ 挑战验证成功');
    return challenge;
}

// HTTP 服务器
const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                
                // 处理挑战验证
                if (data.type === 'url_verification') {
                    const response = { challenge: handleChallenge(data.challenge) };
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(response));
                    return;
                }
                
                // 处理消息事件
                if (data.type === 'im.message.receive_v1' && data.event) {
                    console.log('📨 收到消息事件');
                    await handleMessageEvent(data.event);
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch (e) {
                console.error('处理请求错误:', e);
                res.writeHead(500);
                res.end('Error');
            }
        });
    } else if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// 主函数
async function main() {
    console.log('🚀 飞书财报助手启动中...');
    
    startMCPServer();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await getAccessToken();
    
    server.listen(PORT, () => {
        console.log(`✅ Webhook 服务器已启动，监听端口 ${PORT}`);
        console.log('📝 Webhook URL: http://your-server:' + PORT + '/webhook');
        console.log('💡 在飞书开放平台 → 事件订阅 → 填写此 URL');
        console.log('📝 用法：在群里 @机器人 + 股票代码/公司名');
    });
}

main().catch(console.error);
