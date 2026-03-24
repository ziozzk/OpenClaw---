# Alpha Vantage MCP 配置指南

## 📋 概述

Alpha Vantage 官方 MCP 服务器提供实时和历史股票市场数据。

**官方资源：**
- GitHub: https://github.com/alphavantage/alpha_vantage_mcp
- MCP 端点：`https://mcp.alphavantage.co/mcp?apikey=YOUR_API_KEY`

---

## 🔑 步骤 1：获取 API Key

1. 访问：https://www.alphavantage.co/support/#api-key
2. 填写表单：
   - **Which of the following best describes you?**: 选择 `Investor` 或 `Software Developer`
   - **Organization**: 可以填个人名称
   - **Email**: 使用真实邮箱（用于接收 API Key）
3. 提交后，API Key 会显示在页面上并发送到邮箱

**免费额度：**
- 每日 25 次请求
- 每分钟 5 次请求

---

## ⚙️ 步骤 2：配置到 mcporter

编辑 `config/mcporter.json`：

```json
{
  "mcpServers": {
    "alpha-vantage": {
      "url": "https://mcp.alphavantage.co/mcp?apikey=YOUR_API_KEY"
    }
  },
  "imports": []
}
```

**将 `YOUR_API_KEY` 替换为你获取的真实 API Key。**

---

## 🧪 步骤 3：验证连接

```bash
# 列出服务器
mcporter list

# 查看可用工具
mcporter list alpha-vantage --schema

# 测试调用（示例）
mcporter call alpha-vantage.TOOL_CALL --args '{"tool_name": "GLOBAL_QUOTE", "arguments": {"symbol": "AAPL"}}'
```

---

## 🛠️ 可用工具（Tools）

Alpha Vantage MCP 提供 100+ 个工具，主要包括：

### 股票行情
- `GLOBAL_QUOTE` - 实时股票报价
- `TIME_SERIES_DAILY` - 每日历史数据
- `TIME_SERIES_WEEKLY` - 每周历史数据
- `TIME_SERIES_MONTHLY` - 每月历史数据

### 公司信息
- `INCOME_STATEMENT` - 利润表
- `BALANCE_SHEET` - 资产负债表
- `CASH_FLOW` - 现金流量表
- `EARNINGS` - 盈利数据

### 其他
- `SYMBOL_SEARCH` - 股票代码搜索
- `MARKET_STATUS` - 市场状态
- `NEWS_SENTIMENT` - 新闻情绪

---

## 📝 示例调用

### 获取股票实时报价
```bash
mcporter call alpha-vantage.TOOL_CALL --args '{"tool_name": "GLOBAL_QUOTE", "arguments": {"symbol": "AAPL"}}'
```

### 获取利润表
```bash
mcporter call alpha-vantage.TOOL_CALL --args '{"tool_name": "INCOME_STATEMENT", "arguments": {"symbol": "MSFT"}}'
```

### 获取每日历史数据
```bash
mcporter call alpha-vantage.TOOL_CALL --args '{"tool_name": "TIME_SERIES_DAILY", "arguments": {"symbol": "GOOGL"}}'
```

---

## ⚠️ 注意事项

1. **API Key 安全**：不要将包含真实 API Key 的配置文件提交到 Git
2. **速率限制**：免费账户每日 25 次请求，注意合理分配
3. **数据延迟**：实时数据可能有 15 分钟延迟
4. **错误处理**：API 返回错误时检查配额是否用完

---

## 🔗 相关资源

- [API 完整文档](https://www.alphavantage.co/documentation/)
- [Trading Agents 示例](https://trading-agents.ai/)
- [设置教程视频](https://www.youtube.com/watch?v=W69x2qJcYmI)

---

*最后更新：2026-03-24*
