#!/usr/bin/env node
/**
 * 财务数据 MCP Server (Node.js 版)
 * 使用新浪财经/东方财富 API 获取 A 股/港股/美股财务数据
 */

const https = require('https');
const http = require('http');

// 工具函数：HTTP 请求
function fetch(url) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        lib.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(res.statusCode === 200 ? JSON.parse(data) : { error: `HTTP ${res.statusCode}` });
                } catch (e) {
                    resolve(data); // 返回原始文本
                }
            });
        }).on('error', reject);
    });
}

// 获取股票基本信息（新浪财经）
async function getStockInfo(stockCode) {
    try {
        // 处理 A 股代码
        let symbol = stockCode;
        if (/^[0-9]{6}$/.test(stockCode)) {
            symbol = stockCode.startsWith('6') ? `sh${stockCode}` : `sz${stockCode}`;
        }
        
        const url = `https://hq.sinajs.cn/rn=${Date.now()}/list=${symbol}`;
        const response = await fetch(url);
        
        // 解析新浪返回格式：var hq_str_sh000001="名称，开盘，..."
        const match = response.match(/="([^"]+)"/);
        if (match && match[1]) {
            const parts = match[1].split(',');
            return {
                name: parts[0] || stockCode,
                code: stockCode,
                market: stockCode.startsWith('6') ? '沪市' : '深市',
                price: parseFloat(parts[3]) || 0,
                open: parseFloat(parts[1]) || 0,
                high: parseFloat(parts[4]) || 0,
                low: parseFloat(parts[5]) || 0,
                close: parseFloat(parts[2]) || 0,
                change: parts[2] && parts[3] ? (((parseFloat(parts[3]) - parseFloat(parts[2])) / parseFloat(parts[2]) * 100).toFixed(2)) : 0
            };
        }
        
        return { name: stockCode, code: stockCode, market: '未知' };
    } catch (e) {
        return { error: e.message, code: stockCode };
    }
}

// 获取财务指标（东方财富 API）
async function getFinancialSummary(stockCode) {
    try {
        // 处理代码格式
        let symbol = stockCode;
        if (/^[0-9]{6}$/.test(stockCode)) {
            symbol = stockCode.startsWith('6') ? `SH${stockCode}` : `SZ${stockCode}`;
        }
        
        // 东方财富财务指标 API
        const url = `https://push2.eastmoney.com/api/qt/stock/finance/get?secid=${symbol}&type=1&reportType=1`;
        const data = await fetch(url);
        
        if (data && data.data) {
            const finance = data.data;
            return {
                roe: finance.finance_roe ? (finance.finance_roe * 100).toFixed(2) : 'N/A',
                grossMargin: finance.gross_margin ? (finance.gross_margin * 100).toFixed(2) : 'N/A',
                netMargin: finance.net_margin ? (finance.net_margin * 100).toFixed(2) : 'N/A',
                debtRatio: finance.debt_ratio ? (finance.debt_ratio * 100).toFixed(2) : 'N/A',
                revenueGrowth: finance.revenue_growth ? (finance.revenue_growth * 100).toFixed(2) : 'N/A',
                profitGrowth: finance.profit_growth ? (finance.profit_growth * 100).toFixed(2) : 'N/A',
                eps: finance.eps || 'N/A',
                pe: finance.pe || 'N/A',
                pb: finance.pb || 'N/A'
            };
        }
        
        // 备用：返回基础数据
        return { note: '详细财务数据获取中' };
    } catch (e) {
        return { note: '财务数据暂不可用', error: e.message };
    }
}

// 获取主要业务（简化的 mock，实际可调用更多 API）
async function getBusinessOverview(stockCode) {
    try {
        // 这里可以扩展调用更多 API 获取行业、主营业务等
        return {
            industry: '待获取',
            mainBusiness: '待获取',
            employees: '待获取',
            founded: '待获取'
        };
    } catch (e) {
        return { error: e.message };
    }
}

// 分析风险因素
function analyzeRisks(financials) {
    const risks = [];
    
    if (financials.debtRatio !== 'N/A' && parseFloat(financials.debtRatio) > 70) {
        risks.push('⚠️ 资产负债率较高 (>70%)，存在偿债风险');
    }
    if (financials.revenueGrowth !== 'N/A' && parseFloat(financials.revenueGrowth) < 0) {
        risks.push('⚠️ 营业收入负增长，业务可能萎缩');
    }
    if (financials.profitGrowth !== 'N/A' && parseFloat(financials.profitGrowth) < 0) {
        risks.push('⚠️ 净利润负增长，盈利能力下降');
    }
    if (financials.roe !== 'N/A' && parseFloat(financials.roe) < 5) {
        risks.push('⚠️ ROE 较低 (<5%)，股东回报率不高');
    }
    
    if (risks.length === 0) {
        risks.push('✅ 暂无显著财务风险信号');
    }
    
    return risks;
}

// 生成 One Pager
async function generateOnePager(stockCode) {
    const [stockInfo, financials, business] = await Promise.all([
        getStockInfo(stockCode),
        getFinancialSummary(stockCode),
        getBusinessOverview(stockCode)
    ]);
    
    const risks = analyzeRisks(financials);
    
    const now = new Date().toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
    
    const report = `📊 **${stockInfo.name} (${stockInfo.code})**

🏢 **公司概况**
- 市场：${stockInfo.market}
- 现价：¥${stockInfo.price || 'N/A'} (${stockInfo.change || 0}%)
- 行业：${business.industry}

💰 **核心财务指标**
- ROE: ${financials.roe}%
- 毛利率：${financials.grossMargin}%
- 净利率：${financials.netMargin}%
- 资产负债率：${financials.debtRatio}%
- 营收增长率：${financials.revenueGrowth}%
- 净利润增长率：${financials.profitGrowth}%
- 每股收益：${financials.eps}
- 市盈率：${financials.pe}
- 市净率：${financials.pb}

✨ **亮点**
- ${stockInfo.price > 0 ? `当前股价 ¥${stockInfo.price}` : '数据获取中'}
- 待补充更多分析

⚠️ **风险**
${risks.map(r => `- ${r}`).join('\n')}

_数据更新时间：${now}_
_数据来源：新浪财经、东方财富_`;

    return report;
}

// MCP 协议处理
function handleRequest(request) {
    const method = request.method || '';
    const params = request.params || {};
    
    if (method === 'tools/list') {
        return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
                tools: [
                    {
                        name: 'get_stock_info',
                        description: '获取股票基本信息（名称、价格、市场）',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                stock_code: { type: 'string', description: '股票代码（如 600519、AAPL）' }
                            },
                            required: ['stock_code']
                        }
                    },
                    {
                        name: 'get_financial_summary',
                        description: '获取财务摘要（ROE、毛利率、增长率等）',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                stock_code: { type: 'string', description: '股票代码' }
                            },
                            required: ['stock_code']
                        }
                    },
                    {
                        name: 'generate_one_pager',
                        description: '生成完整的财报 One Pager 报告',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                stock_code: { type: 'string', description: '股票代码或公司名称' }
                            },
                            required: ['stock_code']
                        }
                    }
                ]
            }
        };
    }
    
    if (method === 'tools/call') {
        const toolName = params.name || '';
        const args = params.arguments || {};
        
        const handlers = {
            get_stock_info: () => getStockInfo(args.stock_code),
            get_financial_summary: () => getFinancialSummary(args.stock_code),
            generate_one_pager: () => generateOnePager(args.stock_code)
        };
        
        const handler = handlers[toolName];
        if (handler) {
            return handler().then(result => ({
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
                }
            })).catch(err => ({
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }]
                }
            }));
        }
        
        return Promise.resolve({
            jsonrpc: '2.0',
            id: request.id,
            result: {
                content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${toolName}` }) }]
            }
        });
    }
    
    if (method === 'initialize') {
        return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
                protocolVersion: '2024-11-05',
                capabilities: { tools: {} },
                serverInfo: { name: 'finance-mcp-node', version: '1.0.0' }
            }
        };
    }
    
    return {
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32601, message: `Method not found: ${method}` }
    };
}

// 主循环
async function main() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.on('line', async (line) => {
        try {
            const request = JSON.parse(line);
            const response = await handleRequest(request);
            console.log(JSON.stringify(response));
        } catch (e) {
            console.log(JSON.stringify({
                jsonrpc: '2.0',
                id: null,
                error: { code: -32603, message: e.message }
            }));
        }
    });
    
    console.error('✅ Finance MCP Server (Node.js) started');
}

main();
