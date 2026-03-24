# 飞书财报 MCP Server

实时获取 A 股/港股/美股财务数据，生成结构化 One Pager。

## 启动

```bash
cd /home/nio/.openclaw/workspace/feishu-finance-bot
python3 mcp_server.py
```

## 测试

```bash
# 测试股票信息
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_stock_info","arguments":{"stock_code":"600519"}}}' | python3 mcp_server.py

# 测试 One Pager
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"generate_one_pager","arguments":{"stock_code":"600519"}}}' | python3 mcp_server.py
```

## 数据源

| 数据 | 来源 | 状态 |
|------|------|------|
| 股票名称/价格 | 腾讯财经 | ✅ |
| 财务指标 | 东方财富 | ⚠️ (部分受限) |

## OpenClaw 集成

在 OpenClaw 配置中添加 MCP：

```json
{
  "mcp": {
    "servers": {
      "finance": {
        "command": "python3",
        "args": ["/home/nio/.openclaw/workspace/feishu-finance-bot/mcp_server.py"]
      }
    }
  }
}
```
