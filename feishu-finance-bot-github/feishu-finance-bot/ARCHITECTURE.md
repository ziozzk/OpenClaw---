# 飞书财报 One Pager 机器人 - 项目架构

**项目时间:** 2026-03-24  
**状态:** 开发中  

---

## 📐 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户端 (飞书)                            │
│  @机器人 AAPL  →  @机器人 生成苹果财报 One Pager                  │
└────────────────────┬────────────────────────────────────────────┘
                     │ WebSocket 长连接
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OpenClaw Gateway 网关                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  飞书渠道插件  │  │  会话管理     │  │  路由分发     │          │
│  │  (feishu)    │  │  (sessions)  │  │  (routing)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                      配置：~/.openclaw/openclaw.json            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OpenClaw Agent (AI 智能体)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SOUL.md (人格 + 能力定义)                                │  │
│  │  - 财报 One Pager 能力说明                                 │  │
│  │  - 数据源优先级配置                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Memory 记忆系统                                          │  │
│  │  - financial-onepager.md (生成指南)                       │  │
│  │  - alpha-vantage-test-results.md (API 测试结果)           │  │
│  │  - mcp-servers-reference.md (MCP 服务器列表)              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐   ┌─────────────────────┐
│  数据获取层       │   │  Skill 技能系统      │
│                 │   │                     │
│  ┌───────────┐  │   │  ┌──────────────┐  │
│  │ Alpha     │  │   │  │ financial-   │  │
│  │ Vantage   │  │   │  │ onepager/    │  │
│  │ API       │  │   │  │ SKILL.md     │  │
│  │ (HTTP)    │  │   │  └──────────────┘  │
│  └───────────┘  │   │                     │
│                 │   └─────────────────────┘
│  ┌───────────┐  │
│  │ MCP       │  │
│  │ Server    │  │
│  │ (备用)    │  │
│  └───────────┘  │
└─────────────────┘   └─────────────────────┘
```

---

## 🗂️ 文件结构

```
~/.openclaw/workspace/
├── SOUL.md                          # AI 人格定义 + One Pager 能力说明
├── AGENTS.md                        # Agent 使用说明
├── USER.md                          # 用户信息
├── IDENTITY.md                      # AI 身份定义
├── TOOLS.md                         # 工具配置笔记
│
├── config/
│   └── mcporter.json                # MCP 服务器配置
│       └─> alpha-vantage (API Key: RK9S21IP5X28J7IC)
│
├── memory/                          # 长期记忆库
│   ├── financial-onepager.md        # One Pager 生成指南
│   ├── alpha-vantage-setup.md       # Alpha Vantage 配置教程
│   ├── alpha-vantage-test-results.md # API 测试结果
│   ├── mcp-servers-reference.md     # MCP 服务器资源列表
│   └── projects.md                  # 项目记录
│
├── skills/
│   └── financial-onepager/
│       └── SKILL.md                 # One Pager 技能文档（含模拟数据）
│
├── mcp-servers/                     # 自定义 MCP 服务器
│   └── financial-report/
│       ├── package.json             # 依赖配置
│       ├── package-lock.json
│       └── index.js                 # MCP 服务器代码
│           ├─> lookup_symbol()      # 查询股票代码
│           ├─> get_financial_data() # 获取财务数据
│           └─> generate_onepager()  # 生成 One Pager
│
└── feishu-finance-bot/              # (可选) 独立飞书机器人
    ├── README.md
    ├── SETUP.md
    ├── package.json
    └── src/
        ├── bot.js                   # 机器人主逻辑
        ├── bot-longpoll.js          # 长轮询模式
        ├── bot-webhook.js           # Webhook 模式
        └── mcp_server.js            # MCP 服务器
```

---

## 🔄 数据流

### 完整流程

```
1. 用户发送消息
   └─> 飞书机器人收到 @提及
   
2. 飞书 Gateway 接收
   └─> WebSocket 长连接
   └─> 消息解析 (im.message.receive_v1)
   
3. OpenClaw 路由
   └─> 会话键生成：agent:main:feishu:direct:ou_xxx
   └─> 会话加载/创建
   
4. AI 处理
   └─> 读取 SOUL.md (能力定义)
   └─> 读取 memory/*.md (上下文)
   └─> 识别意图：财报查询
   └─> 决策数据源：
       ├─> 优先：Alpha Vantage API
       └─> 备用：内置模拟数据
       
5. 数据获取
   ├─> 方案 A: AI 知道 API 端点，但需要外部工具执行
   ├─> 方案 B: 从 memory 读取预获取的数据
   └─> 方案 C: 调用 MCP 工具 (需修复参数传递)
   
6. 生成 One Pager
   └─> 业务概览
   └─> 财务摘要
   └─> 投资亮点
   └─> 风险提示
   
7. 回复飞书
   └─> 富文本/交互式卡片
   └─> 流式输出 (可选)
```

---

## 🔧 核心组件说明

### 1. OpenClaw Gateway

**作用:** 消息网关，连接飞书和 AI

**配置位置:** `~/.openclaw/openclaw.json`

**关键配置:**
```json
{
  "channels": {
    "feishu": {
      "appId": "cli_a93166220039dbd6",
      "appSecret": "z6Haipw4tbkN2ZQ17tsQ0ftxuzQ5MDzJ",
      "enabled": true,
      "connectionMode": "websocket",
      "groupPolicy": "open",
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "session": {
    "dmScope": "per-channel-peer"
  }
}
```

### 2. SOUL.md (AI 人格)

**作用:** 定义 AI 能力和行为准则

**One Pager 能力定义:**
```markdown
## 📊 财报 One Pager 能力

当用户在飞书中 `@机器人 + 公司名称/股票代码` 时，自动生成美股 One Pager：
- 数据源：Alpha Vantage HTTP API
- API Key: RK9S21IP5X28J7IC
- 输出格式：业务、财务、亮点、风险
```

### 3. Memory 系统

**作用:** 长期记忆存储，AI 可读取的上下文

**关键文件:**

| 文件 | 作用 |
|------|------|
| `financial-onepager.md` | One Pager 生成模板和指南 |
| `alpha-vantage-test-results.md` | API 测试结果和示例数据 |
| `mcp-servers-reference.md` | MCP 服务器资源列表 |

### 4. Alpha Vantage API

**作用:** 实时财务数据源

**API Key:** `RK9S21IP5X28J7IC` (每日 25 次配额)

**主要端点:**
```
GET https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=KEY
GET https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=AAPL&apikey=KEY
GET https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=AAPL&apikey=KEY
```

### 5. MCP 服务器 (备用方案)

**作用:** 标准化的工具调用接口

**位置:** `~/.openclaw/workspace/mcp-servers/financial-report/`

**工具:**
- `lookup_symbol` - 查询股票代码
- `get_financial_data` - 获取财务数据
- `generate_onepager` - 生成 One Pager

**状态:** ⚠️ 参数传递有问题，待修复

---

## 🎯 当前实现状态

| 模块 | 状态 | 完成度 |
|------|------|--------|
| OpenClaw Gateway 配置 | ✅ | 100% |
| 飞书渠道集成 | ✅ | 100% |
| SOUL.md 能力定义 | ✅ | 100% |
| Memory 文档 | ✅ | 100% |
| Alpha Vantage API | ✅ | 100% (HTTP 可用) |
| MCP 服务器 | ⚠️ | 70% (参数问题) |
| Skill 文档 | ✅ | 100% |
| 端到端测试 | ⏸️ | 待测试 |

---

## 🚧 待解决问题

### 1. 数据获取方式

**问题:** AI 无法直接执行 HTTP 请求

**方案:**
- A) 创建 Python/Node.js 工具脚本
- B) 使用 MCP 工具调用 (需修复)
- C) 预获取数据存入 memory

### 2. MCP 参数传递

**问题:** mcporter 调用工具时参数无法正确解析

**状态:** 已尝试多种调用方式，均未成功

### 3. 飞书卡片格式

**问题:** 未配置交互式卡片模板

**方案:** 使用富文本格式先测试，后续优化

---

## 📊 性能指标

| 指标 | 目标 | 当前 |
|------|------|------|
| 响应时间 | < 30 秒 | 待测试 |
| API 配额 | 25 次/日 | 25 次/日 |
| 支持股票 | 全部美股 | 5 个 (模拟数据) |
| 数据新鲜度 | 实时 (延迟 15 分钟) | 实时 |

---

## 🔐 安全配置

### API Key 存储

```
位置：memory/*.md (AI 可读)
风险：低 (仅用于 Alpha Vantage，免费配额)
建议：生产环境使用环境变量或加密存储
```

### 飞书凭证

```
位置：~/.openclaw/openclaw.json
权限：App Secret 已配置
建议：不要公开分享配置文件
```

---

## 📈 扩展方向

### 短期 (1-2 周)
- [ ] 修复 MCP 参数传递问题
- [ ] 创建 HTTP 调用工具脚本
- [ ] 完成端到端测试
- [ ] 优化 One Pager 输出格式

### 中期 (1 个月)
- [ ] 支持 A 股/港股数据源
- [ ] 添加股价图表生成
- [ ] 飞书交互式卡片
- [ ] 历史数据对比

### 长期 (3 个月+)
- [ ] 多股票对比分析
- [ ] 自动推送财报季提醒
- [ ] 投资组合跟踪
- [ ] 技术指标分析

---

## 📞 相关资源

- **OpenClaw 文档:** https://docs.openclaw.ai
- **Alpha Vantage:** https://www.alphavantage.co
- **MCP 协议:** https://modelcontextprotocol.io
- **飞书开放平台:** https://open.feishu.cn

---

*最后更新：2026-03-24 16:13*
