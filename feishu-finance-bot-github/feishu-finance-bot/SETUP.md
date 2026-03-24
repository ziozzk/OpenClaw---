# 飞书财报机器人 - 快速启动指南

---

## ✅ 代码已完成

所有代码已生成在 `/home/nio/.openclaw/workspace/feishu-finance-bot/`

---

## 📋 你需要做的

### 1. 填写飞书凭证

```bash
cd /home/nio/.openclaw/workspace/feishu-finance-bot
cp config/config.example.json config/config.json
```

编辑 `config/config.json`：
```json
{
  "feishu": {
    "appId": "cli_xxxxxxxxxxxxx",
    "appSecret": "xxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

**获取方式**：
- 飞书开放平台 → 应用管理 → 凭证与基础信息
- 复制 `App ID` 和 `App Secret`

### 2. 启动机器人

```bash
npm start
```

看到以下输出表示成功：
```
✅ MCP Server 已启动
✅ 获取 Access Token 成功
🔌 连接 WebSocket...
✅ WebSocket 已连接，监听消息中...
📝 用法：在群里 @机器人 + 股票代码/公司名
```

### 3. 测试

在飞书群里发送：
```
@机器人 600519
@机器人 贵州茅台
```

---

## 🔧 故障排查

### 问题：获取 Token 失败
- 检查 App ID 和 App Secret 是否正确
- 确认应用已发布

### 问题：WebSocket 连接失败
- 检查事件订阅是否已验证
- 确认应用有 `im:message:readonly` 权限

### 问题：@机器人 没反应
- 确认机器人已添加到群聊
- 检查是否有 `im:message:readonly` 权限

---

## 📁 项目结构

```
feishu-finance-bot/
├── src/
│   ├── bot.js          # 飞书机器人主程序
│   └── mcp_server.js   # 财务数据 MCP Server
├── config/
│   └── config.json     # 配置文件（需创建）
├── package.json
└── README.md
```

---

## 🚀 下一步

启动后如有问题，告诉我错误信息，我来帮你解决。
