# 美股财报 One Pager 生成指南

## 触发条件

当用户在飞书中 `@机器人 + 公司名称/股票代码` 时，生成该公司 One Pager。

## 数据获取方法

### 1. Alpha Vantage MCP（推荐，实时数据）

使用 MCP 工具调用：

```bash
# 获取公司概览
mcporter call alpha-vantage.get_company_overview --args '{"symbol": "AAPL"}'

# 获取股票实时报价
mcporter call alpha-vantage.get_stock_quote --args '{"symbol": "AAPL"}'

# 获取每日历史数据
mcporter call alpha-vantage.get_time_series_daily --args '{"symbol": "AAPL"}'

# 获取利润表
mcporter call alpha-vantage.get_company_income_statement --args '{"symbol": "AAPL"}'
```

**配置：** `~/.openclaw/workspace/config/mcporter.json`
```json
{
  "mcpServers": {
    "alpha-vantage": {
      "url": "https://mcp.alphavantage.co/mcp?apikey=YOUR_API_KEY"
    }
  }
}
```

详见：`memory/alpha-vantage-setup.md`

### 2. 内置模拟数据（备用）

当 API 不可用或配额用尽时，使用 `skills/financial-onepager/SKILL.md` 中的模拟数据。

支持的公司：AAPL, MSFT, GOOGL, TSLA, NVDA

## One Pager 输出结构

```markdown
## 📊 [公司全称] ([股票代码])

### 🏢 业务概览
- **行业**: [行业分类]
- **主营业务**: [1-2 句描述]
- **核心产品/服务**: [列举 2-3 个]
- **市场地位**: [行业地位描述]

### 💰 财务摘要 (TTM/最新季度)
| 指标 | 数值 |
|------|------|
| 营收 | $XX.XB |
| 净利润 | $XX.XB |
| 毛利率 | XX.X% |
| 净利率 | XX.X% |
| PE (TTM) | XX.X |
| PS (TTM) | XX.X |
| 股息率 | X.X% |

### 📈 股价表现
- **当前股价**: $XXX.XX
- **52 周范围**: $XX - $XX
- **市值**: $XXX.XB
- **年初至今**: +XX.X%

### ✨ 投资亮点
1. [亮点 1 - 增长/创新/市场份额等]
2. [亮点 2]
3. [亮点 3]

### ⚠️ 风险提示
1. [风险 1 - 竞争/监管/宏观等]
2. [风险 2]
3. [风险 3]

---
*数据来源于 Yahoo Finance / SEC EDGAR | 更新时间：[日期]*
```

## 公司名称 → 股票代码映射

常用美股代码（内置映射）：

| 公司名 | 代码 |
|--------|------|
| 苹果 | AAPL |
| 微软 | MSFT |
| 谷歌/Alphabet | GOOGL |
| 亚马逊 | AMZN |
| 特斯拉 | TSLA |
| 英伟达 | NVDA |
| Meta/脸书 | META |
| 伯克希尔 | BRK.B |
| 摩根大通 | JPM |
| 强生 | JNJ |
| 沃尔玛 | WMT |
| 迪士尼 | DIS |
| 奈飞 | NFLX |
| 英特尔 | INTC |
| AMD | AMD |
| 波音 | BA |
| 高盛 | GS |
| 万事达 | MA |
| Visa | V |
| 可口可乐 | KO |
| 百事可乐 | PEP |
| 麦当劳 | MCD |
| 星巴克 | SBUX |
| 耐克 | NKE |
| 宝洁 | PG |

## 错误处理

- **公司不存在**: "未找到该公司，请检查名称或提供股票代码"
- **数据获取失败**: "暂时无法获取数据，请稍后重试"
- **多个匹配**: "找到多个匹配，请指定：[选项列表]"

## 飞书卡片格式

使用飞书**交互式卡片**或**富文本**格式输出，确保：
- 关键数据用**粗体**突出
- 使用 emoji 增加可读性
- 表格对齐清晰
- 避免过长段落
