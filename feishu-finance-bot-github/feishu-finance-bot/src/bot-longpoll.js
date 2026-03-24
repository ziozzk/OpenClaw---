#!/usr/bin/env node
/**
 * 飞书财报机器人 - 长连接模式
 * 使用飞书官方长连接协议，无需公网 IP
 */

const https = require('https');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// 加载配置
const configPath = path.join(__dirname, '../config/config.json');
let config;

try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (e) {
    console.error('❌ 配置文件不存在');
    process.exit(1);
}

// HTTP 请求封装
function httpRequest(urlPath, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'open.feishu.cn',
            port: 443,
            path: urlPath,
            method: data ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
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
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

// Token 管理
let appAccessToken = null;
let appTokenExpiry = 0;
let tenantAccessToken = null;
let tenantTokenExpiry = 0;

async function getAppAccessToken() {
    if (appAccessToken && Date.now() < appTokenExpiry) {
        return appAccessToken;
    }
    
    const result = await httpRequest('/open-apis/auth/v3/app_access_token', {
        app_id: config.feishu.appId,
        app_secret: config.feishu.appSecret
    });
    
    if (result.code === 0) {
        appAccessToken = result.app_access_token;
        appTokenExpiry = Date.now() + (result.expire - 300) * 1000;
        console.log('✅ App Access Token 已刷新');
        return appAccessToken;
    } else {
        throw new Error(`获取 App Token 失败：${result.msg}`);
    }
}

async function getTenantAccessToken() {
    if (tenantAccessToken && Date.now() < tenantTokenExpiry) {
        return tenantAccessToken;
    }
    
    const result = await httpRequest('/open-apis/auth/v3/tenant_access_token/internal', {
        app_id: config.feishu.appId,
        app_secret: config.feishu.appSecret
    });
    
    if (result.code === 0) {
        tenantAccessToken = result.tenant_access_token;
        tenantTokenExpiry = Date.now() + (result.expire - 300) * 1000;
        console.log('✅ Tenant Access Token 已刷新');
        return tenantAccessToken;
    } else {
        throw new Error(`获取 Tenant Token 失败：${result.msg}`);
    }
}

// 发送消息
async function sendMessage(chatId, text) {
    try {
        const token = await getTenantAccessToken();
        const result = await httpRequest('/open-apis/im/v1/messages?receive_id_type=chat_id', {
            receive_id: chatId,
            msg_type: 'text',
            content: JSON.stringify({ text })
        }, token);
        
        if (result.code === 0) {
            console.log(`📤 消息已发送`);
            return result;
        } else {
            throw new Error(result.msg);
        }
    } catch (e) {
        console.error('发送异常:', e.message);
        throw e;
    }
}

// 获取长连接配置（关键！）
async function getWebSocketConfig() {
    const token = await getAppAccessToken();
    
    // 正确的 API 路径
    const result = await httpRequest('/open-apis/im/v1/websockets', {}, token);
    
    console.log('📡 WebSocket API 响应:', JSON.stringify(result).substring(0, 200));
    
    if (result.code === 0 && result.data && result.data.url) {
        return result.data;
    } else {
        throw new Error(`获取 WebSocket 配置失败：${result.msg || '无数据'}`);
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

// 处理消息
async function handleMessage(message) {
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

// 启动长连接
async function startLongConnection() {
    console.log('🔌 正在获取长连接配置...');
    
    const wsConfig = await getWebSocketConfig();
    const wsUrl = wsConfig.url;
    
    console.log('🔌 WebSocket URL:', wsUrl.substring(0, 60) + '...');
    console.log('🔌 连接 ID:', wsConfig.id || 'N/A');
    
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
        console.log('✅ 长连接已建立，监听消息中...');
        console.log('📝 用法：在群里 @机器人 + 股票代码/公司名');
    });
    
    ws.on('message', async (data) => {
        try {
            const event = JSON.parse(data.toString());
            console.log('📨 收到事件:', event.type || 'unknown');
            
            // 处理消息事件
            if (event.type === 'im.message.receive_v1' && event.event) {
                const message = event.event.message;
                await handleMessage(message);
            }
            
            // 发送确认（飞书要求）
            if (event.id) {
                ws.send(JSON.stringify({ id: event.id, type: 'ack' }));
            }
        } catch (e) {
            console.error('处理事件异常:', e);
        }
    });
    
    ws.on('error', (e) => {
        console.error('❌ 长连接错误:', e.message);
    });
    
    ws.on('close', (code, reason) => {
        console.log(`⚠️  长连接断开 (code=${code})，10 秒后重连...`);
        setTimeout(startLongConnection, 10000);
    });
    
    // 心跳
    setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        }
    }, 30000);
}

// 主函数
async function main() {
    console.log('🚀 飞书财报助手启动中...（长连接模式）');
    
    startMCPServer();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await getTenantAccessToken();
    
    // 启动长连接
    await startLongConnection();
}

main().catch(console.error);
