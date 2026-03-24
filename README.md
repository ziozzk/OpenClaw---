# 飞书财报 One Pager 机器人 📊

> 在飞书中 @机器人 + 股票代码，自动生成美股财报 One Pager 报告

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Alpha Vantage](https://img.shields.io/badge/Data-Alpha_Vantage-blue)](https://www.alphavantage.co/)
[![MCP](https://img.shields.io/badge/Protocol-MCP-green)](https://modelcontextprotocol.io/)

---

## ✨ 功能特性

- 📈 **实时股价** - 15 分钟延迟的美股实时报价
- 💰 **财务摘要** - 营收、利润、毛利率等关键指标
- ✨ **投资亮点** - AI 生成的投资亮点分析
- ⚠️ **风险提示** - 全面的投资风险识别
- 🤖 **自动触发** - 飞书群聊 @机器人 即可生成

---

## 🚀 快速开始

### 前置条件

1. **OpenClaw Gateway** - AI 助手网关
   ```bash
   npm install -g openclaw@latest
   ```

2. **飞书开放平台应用** - 创建企业自建应用
   - 访问：https://open.feishu.cn/app
   - 参考：[飞书配置指南](./feishu-finance-bot/SETUP.md)

3. **Alpha Vantage API Key** - 免费获取
   - 访问：https://www.alphavantage.co/support/#api-key
   - 每日 25 次免费请求

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/YOUR_USERNAME/feishu-finance-bot.git
cd feishu-finance-bot
```

#### 2. 安装 MCP 服务器依赖

```bash
cd mcp-servers/financial-report
npm install
```

#### 3. 配置 MCP

复制示例配置并修改：

```bash
cp config/mcporter.example.json config/mcporter.json
```

编辑 `config/mcporter.json`：

```json
{
  "mcpServers": {
    "alpha-vantage": {
      "url": "https://mcp.alphavantage.co/mcp?apikey=YOUR_API_KEY"
    },
    "financial-report": {
      "command": "node",
      "args": ["./mcp-servers/financial-report/index.js"]
    }
  }
}
```

#### 4. 配置 OpenClaw

编辑 `~/.openclaw/openclaw.json`，添加飞书渠道配置：

```json
{
  "channels": {
    "feishu": {
      "appId": "cli_xxx",
      "appSecret": "xxx",
      "enabled": true,
      "connectionMode": "websocket",
      "groupPolicy": "open",
      "groups": {
        "*": { "requireMention": true }
      }
    }
  }
}
```

#### 5. 启动网关

```bash
openclaw gateway
```

---

## 📱 使用方法

在飞书群聊中发送：

```
@机器人 AAPL
@机器人 生成苹果财报 One Pager
@机器人 特斯拉
@机器人 MSFT
```

### 输出示例

```markdown
## 📊 Apple Inc. (AAPL)

### 🏢 业务概览
- **行业**: Technology / Consumer Electronics
- **主营业务**: 设计、制造和销售智能手机、个人电脑、平板电脑...
- **市场地位**: 行业领先企业

### 💰 财务摘要 (TTM)
| 指标 | 数值 |
|------|------|
| 市值 | 2.85T |
| 营收 | 383.29B |
| 净利润 | 96.99B |
| 毛利率 | 44.1% |
| PE (TTM) | 28.5 |

### ✨ 投资亮点
• 全球最有价值品牌之一，生态系统壁垒极高
• 服务业务持续增长，提供稳定现金流
• 强大的定价能力和品牌忠诚度

### ⚠️ 风险提示
• 对 iPhone 销售依赖度较高
• 中国市场销售存在不确定性
• 监管压力增加（反垄断、App Store 政策）
```

---

## 🏗️ 架构说明

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   飞书用户   │ ───► │ OpenClaw     │ ───► │ AI Agent    │
│  @机器人     │      │ Gateway      │      │ (Qwen3.5)   │
└─────────────┘      └──────────────┘      └──────┬──────┘
                                                   │
                    ┌──────────────────────────────┼──────────────┐
                    │                              │              │
                    ▼                              ▼              ▼
           ┌─────────────────┐           ┌─────────────┐  ┌─────────────┐
           │ Alpha Vantage   │           │ MCP Server  │  │ Memory      │
           │ HTTP API        │           │ (备用)      │  │ Documents   │
           │ (实时数据)      │           │             │  │             │
           └─────────────────┘           └─────────────┘  └─────────────┘
```

详见：[ARCHITECTURE.md](./feishu-finance-bot/ARCHITECTURE.md)

---

## 📁 项目结构

```
feishu-finance-bot/
├── mcp-servers/
│   └── financial-report/       # 自定义 MCP 服务器
│       ├── index.js
│       └── package.json
├── skills/
│   └── financial-onepager/     # One Pager 技能文档
│       └── SKILL.md
├── memory/
│   ├── financial-onepager.md   # 生成指南
│   ├── alpha-vantage-setup.md  # API 配置
│   └── mcp-servers-reference.md # MCP 资源
├── config/
│   └── mcporter.example.json   # MCP 配置示例
├── feishu-finance-bot/
│   ├── README.md
│   ├── ARCHITECTURE.md         # 架构文档
│   ├── SETUP.md                # 安装指南
│   └── QUICKSTART.md           # 快速开始
├── .gitignore
├── LICENSE
└── README.md                   # 本文件
```

---

## 🔧 配置说明

### 支持的股票

目前支持所有美股，常用股票：

| 公司 | 代码 | 公司 | 代码 |
|------|------|------|------|
| 苹果 | AAPL | 微软 | MSFT |
| 谷歌 | GOOGL | 亚马逊 | AMZN |
| 特斯拉 | TSLA | 英伟达 | NVDA |
| Meta | META | 奈飞 | NFLX |

### API 配额

| 计划 | 每日请求 | 每分钟请求 |
|------|---------|-----------|
| 免费 | 25 次 | 5 次 |
| Premium | 无限制 | 无限制 |

升级：https://www.alphavantage.co/premium/

---

## 🛠️ 开发

### MCP 服务器开发

```bash
cd mcp-servers/financial-report
npm install
node index.js
```

### 测试 API 调用

```bash
# 直接调用 Alpha Vantage API
curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=YOUR_API_KEY"

# 通过 MCP 调用
mcporter call alpha-vantage.TOOL_CALL --args '{"tool_name": "GLOBAL_QUOTE", "arguments": {"symbol": "AAPL"}}'
```

<img width="1525" height="1322" alt="image" src="https://github.com/user-attachments/assets/f6ee9859-a919-46bc-a539-c05f94f3d225" />

---


## 📚 文档

- [架构说明](./feishu-finance-bot/ARCHITECTURE.md)
- [安装指南](./feishu-finance-bot/SETUP.md)
- [快速开始](./feishu-finance-bot/QUICKSTART.md)
- [Alpha Vantage 配置](./memory/alpha-vantage-setup.example.md)
- [MCP 服务器列表](./memory/mcp-servers-reference.md)

---


## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](./LICENSE) 文件

---

## 🔗 相关资源

- [OpenClaw 文档](https://docs.openclaw.ai)
- [Alpha Vantage API](https://www.alphavantage.co)
- [MCP 协议](https://modelcontextprotocol.io)
- [飞书开放平台](https://open.feishu.cn)

---

