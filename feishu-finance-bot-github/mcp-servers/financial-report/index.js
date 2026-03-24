#!/usr/bin/env node
/**
 * Financial Report MCP Server
 * 提供美股财务数据查询功能
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// 常用公司股票代码映射
const STOCK_SYMBOLS = {
  'AAPL': 'AAPL', 'APPLE': 'AAPL', '苹果': 'AAPL',
  'MSFT': 'MSFT', 'MICROSOFT': 'MSFT', '微软': 'MSFT',
  'GOOGL': 'GOOGL', 'GOOG': 'GOOGL', 'GOOGLE': 'GOOGL', '谷歌': 'GOOGL',
  'AMZN': 'AMZN', 'AMAZON': 'AMZN', '亚马逊': 'AMZN',
  'TSLA': 'TSLA', 'TESLA': 'TSLA', '特斯拉': 'TSLA',
  'NVDA': 'NVDA', 'NVIDIA': 'NVDA', '英伟达': 'NVDA',
  'META': 'META', 'FACEBOOK': 'META', '脸书': 'META',
  'NFLX': 'NFLX', 'NETFLIX': 'NFLX', '奈飞': 'NFLX',
  'AMD': 'AMD',
  'INTC': 'INTC', 'INTEL': 'INTC', '英特尔': 'INTC',
  'BRK.B': 'BRK.B', 'BRK.A': 'BRK.A', '伯克希尔': 'BRK.B',
  'JPM': 'JPM', '摩根大通': 'JPM',
  'GS': 'GS', '高盛': 'GS',
  'MA': 'MA', '万事达': 'MA',
  'V': 'V', 'VISA': 'V',
  'KO': 'KO', '可口可乐': 'KO',
  'PEP': 'PEP', '百事': 'PEP',
  'MCD': 'MCD', '麦当劳': 'MCD',
  'SBUX': 'SBUX', '星巴克': 'SBUX',
  'NKE': 'NKE', 'NIKE': 'NKE', '耐克': 'NKE',
  'PG': 'PG', '宝洁': 'PG',
  'WMT': 'WMT', 'WALMART': 'WMT', '沃尔玛': 'WMT',
  'DIS': 'DIS', 'DISNEY': 'DIS', '迪士尼': 'DIS',
  'BA': 'BA', 'BOEING': 'BA', '波音': 'BA',
  'JNJ': 'JNJ', '强生': 'JNJ',
};

// 模拟财务数据
function getMockFinancialData(symbol) {
  const mockData = {
    'AAPL': {
      name: 'Apple Inc.',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      description: '设计、制造和销售智能手机、个人电脑、平板电脑、可穿戴设备和配件',
      marketCap: '2.85T',
      peRatio: 28.5,
      psRatio: 7.2,
      profitMargin: 25.3,
      grossMargin: 44.1,
      revenue: '383.29B',
      netIncome: '96.99B',
      eps: 6.13,
      dividendYield: 0.5,
      beta: 1.29,
      week52High: 199.62,
      week52Low: 164.08,
      currentPrice: 178.72,
    },
    'MSFT': {
      name: 'Microsoft Corporation',
      sector: 'Technology',
      industry: 'Software - Infrastructure',
      description: '开发、许可和支持软件、服务、设备和解决方案',
      marketCap: '3.12T',
      peRatio: 36.2,
      psRatio: 12.8,
      profitMargin: 36.7,
      grossMargin: 69.8,
      revenue: '245.12B',
      netIncome: '88.14B',
      eps: 11.86,
      dividendYield: 0.7,
      beta: 0.90,
      week52High: 468.35,
      week52Low: 362.90,
      currentPrice: 420.45,
    },
    'GOOGL': {
      name: 'Alphabet Inc.',
      sector: 'Communication Services',
      industry: 'Internet Content & Information',
      description: '提供在线广告、搜索引擎、云计算、软件和硬件产品',
      marketCap: '2.15T',
      peRatio: 25.8,
      psRatio: 6.5,
      profitMargin: 26.2,
      grossMargin: 57.1,
      revenue: '307.39B',
      netIncome: '73.80B',
      eps: 5.80,
      dividendYield: 0.4,
      beta: 1.06,
      week52High: 193.31,
      week52Low: 129.40,
      currentPrice: 175.35,
    },
    'TSLA': {
      name: 'Tesla, Inc.',
      sector: 'Consumer Cyclical',
      industry: 'Auto Manufacturers',
      description: '设计、开发、制造、租赁和销售电动汽车和能源存储系统',
      marketCap: '1.08T',
      peRatio: 95.2,
      psRatio: 10.5,
      profitMargin: 15.5,
      grossMargin: 18.2,
      revenue: '96.77B',
      netIncome: '14.97B',
      eps: 4.30,
      dividendYield: 0.0,
      beta: 2.31,
      week52High: 488.54,
      week52Low: 138.80,
      currentPrice: 345.16,
    },
    'NVDA': {
      name: 'NVIDIA Corporation',
      sector: 'Technology',
      industry: 'Semiconductors',
      description: '设计和制造图形处理器 (GPU)、移动处理器和相关多媒体软件',
      marketCap: '3.45T',
      peRatio: 65.8,
      psRatio: 42.5,
      profitMargin: 55.0,
      grossMargin: 75.0,
      revenue: '79.77B',
      netIncome: '42.60B',
      eps: 1.92,
      dividendYield: 0.03,
      beta: 1.68,
      week52High: 152.89,
      week52Low: 49.50,
      currentPrice: 139.91,
    },
  };
  
  return mockData[symbol] || null;
}

function generateHighlights(symbol) {
  const highlights = {
    'AAPL': ['全球最有价值品牌之一，生态系统壁垒极高', '服务业务持续增长，提供稳定现金流', '强大的定价能力和品牌忠诚度'],
    'MSFT': ['Azure 云业务持续增长，市场份额提升', 'AI 投资领先，Copilot 产品商业化顺利', '多元化收入来源，抗风险能力强'],
    'GOOGL': ['搜索业务垄断地位稳固', 'YouTube 广告收入增长强劲', '云业务扭亏为盈，估值有提升空间'],
    'TSLA': ['电动车市场领导者，规模优势明显', 'FSD 自动驾驶技术潜力巨大', '能源业务快速增长'],
    'NVDA': ['AI 芯片绝对龙头，市场需求爆发', '数据中心业务高速增长', '技术壁垒高，竞争格局有利'],
  };
  return highlights[symbol] || ['数据有限，请查阅更多来源'];
}

function generateRisks(symbol) {
  const risks = {
    'AAPL': ['对 iPhone 销售依赖度较高', '中国市场销售存在不确定性', '监管压力增加（反垄断、App Store 政策）'],
    'MSFT': ['云市场竞争加剧（AWS、Google Cloud）', 'AI 投资回报存在不确定性', '监管审查风险'],
    'GOOGL': ['反垄断诉讼风险', 'AI 搜索竞争加剧', '广告收入受经济周期影响'],
    'TSLA': ['估值较高，波动性大', '竞争加剧（传统车企 + 新势力）', '执行风险（Cybertruck、FSD 进展）'],
    'NVDA': ['估值极高，预期已打满', '客户自研芯片风险', '地缘政治风险（中国销售限制）'],
  };
  return risks[symbol] || ['数据有限，请查阅更多来源'];
}

// 创建 MCP 服务器
const server = new McpServer({
  name: 'financial-report',
  version: '1.0.0',
});

// 工具 1：查询公司股票代码
server.tool(
  'lookup_symbol',
  '根据公司名称或股票代码查询美股代码',
  { query: { type: 'string', description: '公司名称或股票代码' } },
  async (args) => {
    const query = args?.query;
    if (!query) {
      return { content: [{ type: 'text', text: '请提供公司名称或股票代码' }], isError: true };
    }
    
    const upperQuery = query.toString().toUpperCase();
    const symbol = STOCK_SYMBOLS[query] || STOCK_SYMBOLS[upperQuery];
    
    if (symbol) {
      return { content: [{ type: 'text', text: `找到股票代码：${symbol}` }] };
    }
    
    const found = Object.entries(STOCK_SYMBOLS).find(([key]) => 
      key.toLowerCase().includes(query.toLowerCase())
    );
    
    if (found) {
      return { content: [{ type: 'text', text: `找到匹配：${found[0]} → ${found[1]}` }] };
    }
    
    return { content: [{ type: 'text', text: `未找到 "${query}" 的股票代码。支持：AAPL, MSFT, GOOGL, TSLA, NVDA, AMZN, META, NFLX 等` }], isError: true };
  }
);

// 工具 2：获取公司财务数据
server.tool(
  'get_financial_data',
  '获取美股公司的财务数据和基本信息',
  { symbol: { type: 'string', description: '股票代码 (如 AAPL, MSFT)' } },
  async (args) => {
    const symbol = args?.symbol?.toString().toUpperCase();
    if (!symbol) {
      return { content: [{ type: 'text', text: '请提供股票代码' }], isError: true };
    }
    
    const data = getMockFinancialData(symbol);
    if (!data) {
      return { content: [{ type: 'text', text: `未找到 "${symbol}" 的数据。目前支持：AAPL, MSFT, GOOGL, TSLA, NVDA` }], isError: true };
    }
    
    return {
      content: [{ 
        type: 'text', 
        text: JSON.stringify({ success: true, data: { ...data, highlights: generateHighlights(symbol), risks: generateRisks(symbol) } }, null, 2)
      }],
    };
  }
);

// 工具 3：生成 One Pager
server.tool(
  'generate_onepager',
  '生成公司股票的结构化 One Pager 报告',
  { symbol: { type: 'string', description: '股票代码' } },
  async (args) => {
    const symbol = args?.symbol?.toString().toUpperCase();
    if (!symbol) {
      return { content: [{ type: 'text', text: '请提供股票代码' }], isError: true };
    }
    
    const data = getMockFinancialData(symbol);
    if (!data) {
      return { content: [{ type: 'text', text: `未找到 "${symbol}" 的数据` }], isError: true };
    }
    
    const highlights = generateHighlights(symbol).map(h => `• ${h}`).join('\n');
    const risks = generateRisks(symbol).map(r => `• ${r}`).join('\n');
    
    const onepager = `## 📊 ${data.name} (${symbol})

### 🏢 业务概览
- **行业**: ${data.sector} / ${data.industry}
- **主营业务**: ${data.description}
- **市场地位**: 行业领先企业

### 💰 财务摘要 (TTM)
| 指标 | 数值 |
|------|------|
| 市值 | ${data.marketCap} |
| 营收 | ${data.revenue} |
| 净利润 | ${data.netIncome} |
| 毛利率 | ${data.grossMargin}% |
| 净利率 | ${data.profitMargin}% |
| PE (TTM) | ${data.peRatio} |
| PS (TTM) | ${data.psRatio} |
| 股息率 | ${data.dividendYield}% |

### 📈 股价表现
- **当前股价**: $${data.currentPrice}
- **52 周范围**: $${data.week52Low} - $${data.week52High}
- **Beta**: ${data.beta}

### ✨ 投资亮点
${highlights}

### ⚠️ 风险提示
${risks}

---
*数据为演示用途 | 更新时间：${new Date().toISOString().split('T')[0]}*`;

    return { content: [{ type: 'text', text: onepager }] };
  }
);

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Financial Report MCP Server running on stdio');
}

main().catch(console.error);
