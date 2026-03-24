# Alpha Vantage API 测试结果

**API Key:** `RK9S21IP5X28J7IC`
**测试时间:** 2026-03-24

## ✅ 成功的 API 调用

### 1. GLOBAL_QUOTE - 实时股价

```bash
curl -sL "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=RK9S21IP5X28J7IC"
```

**返回数据:**
```json
{
  "Global Quote": {
    "01. symbol": "AAPL",
    "02. open": "253.97",
    "03. high": "254.60",
    "04. low": "250.28",
    "05. price": "251.49",
    "06. volume": "40546109",
    "07. latest trading day": "2026-03-23",
    "08. previous close": "247.99",
    "09. change": "3.50",
    "10. change percent": "1.41%"
  }
}
```

### 2. INCOME_STATEMENT - 利润表

```bash
curl -sL "https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=AAPL&apikey=RK9S21IP5X28J7IC"
```

**关键字段:**
- `totalRevenue`: 总收入
- `grossProfit`: 毛利润
- `operatingIncome`: 营业利润
- `netIncome`: 净利润
- `researchAndDevelopment`: 研发费用

### 3. 其他可用函数

- `TIME_SERIES_DAILY` - 每日历史数据
- `TIME_SERIES_WEEKLY` - 每周历史数据
- `TIME_SERIES_MONTHLY` - 每月历史数据
- `INCOME_STATEMENT` - 利润表
- `BALANCE_SHEET` - 资产负债表
- `CASH_FLOW` - 现金流量表
- `EARNINGS` - 盈利数据

## ⚠️ 注意事项

1. **COMPANY_OVERVIEW 不存在** - 该函数在免费版不可用
2. **速率限制** - 每日 25 次请求
3. **数据延迟** - 股价数据有 15 分钟延迟

## 🔧 推荐的数据获取策略

### One Pager 数据组合

| 数据项 | API 函数 | 字段映射 |
|--------|---------|---------|
| 当前股价 | `GLOBAL_QUOTE` | `05. price` |
| 市值 | 需要计算 | `price` × `shares_outstanding` |
| 营收 | `INCOME_STATEMENT` | `totalRevenue` |
| 净利润 | `INCOME_STATEMENT` | `netIncome` |
| 毛利率 | 计算 | `grossProfit / totalRevenue` |
| 净利率 | 计算 | `netIncome / totalRevenue` |
| 研发费用 | `INCOME_STATEMENT` | `researchAndDevelopment` |

### 备选方案

由于 MCP 调用格式问题，建议直接使用 HTTP API：

```python
import requests

def get_stock_data(symbol):
    api_key = "RK9S21IP5X28J7IC"
    
    # 获取股价
    quote_url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={api_key}"
    quote_data = requests.get(quote_url).json()
    
    # 获取利润表
    income_url = f"https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol={symbol}&apikey={api_key}"
    income_data = requests.get(income_url).json()
    
    return {
        'quote': quote_data.get('Global Quote', {}),
        'income': income_data
    }
```

---

*测试完成时间：2026-03-24 15:15*
