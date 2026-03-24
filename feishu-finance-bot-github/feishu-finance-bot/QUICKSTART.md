# 飞书财报机器人 - 快速启动

---

## ✅ 已完成

- 代码已生成
- 配置文件已创建（含你的 App 凭证）
- 依赖已安装

---

## 📋 配置飞书开放平台

### 1. 启用事件订阅

在飞书开放平台 → 事件订阅：

1. **订阅地址** 填写（二选一）：

   **方案 A：本地测试（推荐先用这个）**
   ```
   使用 ngrok 暴露本地服务
   ```

   **方案 B：服务器部署**
   ```
   http://你的服务器 IP:3000/webhook
   ```

2. **订阅事件**：勾选 `im.message.receive_v1`

3. 点击"保存"，飞书会发送验证请求

---

### 2. 本地启动（推荐测试用）

```bash
# 安装 ngrok（如没有）
npm install -g ngrok

# 启动机器人
cd /home/nio/.openclaw/workspace/feishu-finance-bot
node src/bot-webhook.js
```

看到以下输出表示成功：
```
✅ MCP Server 已启动
✅ Access Token 已刷新
✅ Webhook 服务器已启动，监听端口 3000
```

### 3. 暴露到公网

新开一个终端：
```bash
ngrok http 3000
```

ngrok 会给你一个公网 URL，如：`https://xxx.ngrok.io`

### 4. 填写订阅地址

在飞书开放平台 → 事件订阅：
```
订阅地址：https://xxx.ngrok.io/webhook
```

点击"保存"，看到"已验证"表示成功！

---

## 🧪 测试

1. 在飞书群里添加机器人
2. 发送：`@机器人 600519`
3. 等待回复财报 One Pager

---

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `src/bot-webhook.js` | Webhook 模式机器人（推荐） |
| `src/mcp_server.js` | 财务数据 MCP Server |
| `config/config.json` | 配置文件（已填好你的凭证） |

---

## 💡 下一步

启动后告诉我，我帮你在飞书开放平台配置事件订阅 URL。
