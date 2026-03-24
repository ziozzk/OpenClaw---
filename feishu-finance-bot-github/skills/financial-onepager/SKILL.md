---
name: financial-onepager
description: Generate US stock One Pager reports (business, financials, highlights, risks)
metadata:
  {
    "openclaw":
      {
        "emoji": "📊",
        "requires": { "bins": [] },
        "install": [],
      },
  }
---

# Financial One Pager Skill

## Usage

When user mentions a US stock company name or ticker in Feishu (with @mention), generate a structured One Pager report.

## Supported Stocks

| Company | Ticker |
|---------|--------|
| Apple | AAPL |
| Microsoft | MSFT |
| Google/Alphabet | GOOGL |
| Amazon | AMZN |
| Tesla | TSLA |
| NVIDIA | NVDA |
| Meta | META |
| Netflix | NFLX |
| AMD | AMD |
| Intel | INTC |
| Berkshire Hathaway | BRK.B |
| JPMorgan | JPM |
| Goldman Sachs | GS |
| Visa | V |
| Mastercard | MA |
| Coca-Cola | KO |
| Pepsi | PEP |
| McDonald's | MCD |
| Starbucks | SBUX |
| Nike | NKE |
| Walmart | WMT |
| Disney | DIS |
| Boeing | BA |
| Johnson & Johnson | JNJ |

## One Pager Template

```markdown
## 📊 {Company Name} ({TICKER})

### 🏢 业务概览
- **行业**: {Sector} / {Industry}
- **主营业务**: {Description}
- **市场地位**: 行业领先企业

### 💰 财务摘要 (TTM)
| 指标 | 数值 |
|------|------|
| 市值 | {MarketCap} |
| 营收 | {Revenue} |
| 净利润 | {NetIncome} |
| 毛利率 | {GrossMargin}% |
| 净利率 | {ProfitMargin}% |
| PE (TTM) | {PERatio} |
| PS (TTM) | {PSRatio} |
| 股息率 | {DividendYield}% |

### 📈 股价表现
- **当前股价**: ${CurrentPrice}
- **52 周范围**: ${Week52Low} - ${Week52High}
- **Beta**: {Beta}

### ✨ 投资亮点
- {Highlight1}
- {Highlight2}
- {Highlight3}

### ⚠️ 风险提示
- {Risk1}
- {Risk2}
- {Risk3}

---
*数据为演示用途 | 更新时间：{Date}*
```

## Financial Data (Mock)

```javascript
const DATA = {
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
    highlights: ['全球最有价值品牌之一，生态系统壁垒极高', '服务业务持续增长，提供稳定现金流', '强大的定价能力和品牌忠诚度'],
    risks: ['对 iPhone 销售依赖度较高', '中国市场销售存在不确定性', '监管压力增加（反垄断、App Store 政策）'],
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
    highlights: ['Azure 云业务持续增长，市场份额提升', 'AI 投资领先，Copilot 产品商业化顺利', '多元化收入来源，抗风险能力强'],
    risks: ['云市场竞争加剧（AWS、Google Cloud）', 'AI 投资回报存在不确定性', '监管审查风险'],
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
    highlights: ['搜索业务垄断地位稳固', 'YouTube 广告收入增长强劲', '云业务扭亏为盈，估值有提升空间'],
    risks: ['反垄断诉讼风险', 'AI 搜索竞争加剧', '广告收入受经济周期影响'],
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
    highlights: ['电动车市场领导者，规模优势明显', 'FSD 自动驾驶技术潜力巨大', '能源业务快速增长'],
    risks: ['估值较高，波动性大', '竞争加剧（传统车企 + 新势力）', '执行风险（Cybertruck、FSD 进展）'],
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
    highlights: ['AI 芯片绝对龙头，市场需求爆发', '数据中心业务高速增长', '技术壁垒高，竞争格局有利'],
    risks: ['估值极高，预期已打满', '客户自研芯片风险', '地缘政治风险（中国销售限制）'],
  },
};
```

## Trigger Patterns

When user sends messages like:
- `@机器人 AAPL`
- `@机器人 苹果`
- `@机器人 财报 AAPL`
- `@机器人 生成苹果 One Pager`
- `@机器人 Tesla 财报`

→ Generate One Pager report using the template above.

## Notes

- Data is mock/demo for now
- Real implementation would use Alpha Vantage, Yahoo Finance, or SEC EDGAR APIs
- Output should be formatted for Feishu rich text or interactive cards
