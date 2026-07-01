# AI Video Platform — Frontend

Vue 3 + TypeScript + Vite 前端工程骨架，对齐 V1 产品信息架构（Models / Playground / API Keys / Billing 等）。

## 技术栈

- Vue 3 + TypeScript + Vite
- Naive UI — 组件库
- UnoCSS — 响应式原子化样式
- Vue Router — 路由
- Pinia — 状态管理
- vue-i18n — 多语言（默认 en-US，支持 zh-CN）
- Axios — HTTP 请求
- vite-plugin-mock + mockjs — 本地 Mock API

## 快速开始

```bash
# 安装依赖
npm install

# 复制环境变量模板并按需修改
cp .env.example .env.development

# 启动开发服务器
npm run dev

# 构建
npm run build

# 测试环境构建（使用 .env.staging）
npm run build:staging
```

## 环境变量

`.env.development`、`.env.staging`、`.env.production` 等真实配置文件**不会**提交到 Git（见 `.gitignore`）。请从模板创建：

```bash
cp .env.example .env.development   # 本地开发：npm run dev
cp .env.example .env.staging       # 测试构建：npm run build:staging
cp .env.example .env.production    # 生产构建：npm run build
```

各变量说明见 [`.env.example`](./.env.example)。常用配置摘要：

| 变量 | 说明 | 典型值 |
|---|---|---|
| `VITE_USE_MOCK` | 开发时是否启用 `mock/` 本地 Mock | `true` / `false` |
| `VITE_API_BASE_URL` | API 基础路径（可与 `VITE_BASE` 组合） | `/api` 或完整 URL |
| `VITE_BASE` | 部署子路径（Vite `base`） | `/` 或 `/staging.github.io/` |
| `VITE_DEV_API_PROXY_TARGET` | **仅 dev**：将 `/api` 代理到真实后端 | `https://staging.api.varo.cloud` |
| `VITE_DEV_AUTH_TOKEN` | **仅 dev**：本地免登录 access token | 留空或 staging 登录后填入 |
| `VITE_DEV_REFRESH_TOKEN` | **仅 dev**：配合 access token 自动续期 | 留空或 staging 登录后填入 |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile 人机验证 | 测试 key 见 `.env.example` |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 ID，留空则关闭 | `G-XXXXXXXXXX` |

**本地对接 staging 后端示例**（`.env.development`）：

```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=/api
VITE_DEV_API_PROXY_TARGET=https://staging.api.varo.cloud
VITE_DEV_AUTH_TOKEN=<staging 登录后的 access_token>
VITE_DEV_REFRESH_TOKEN=<staging 登录后的 refresh_token>
```

修改 `.env.*` 后需**重启** dev server 才会生效。

### GitHub Actions 部署

`.env.staging` / `.env.production` 不会进入 Git 仓库，CI 构建时在 workflow 中注入环境变量（见 [`.github/workflows/`](./.github/workflows/)）。

请在 GitHub 仓库中配置：

| 名称 | 类型 | 用途 |
|---|---|---|
| `VITE_TURNSTILE_SITE_KEY` | Secret | Turnstile site key（staging / production 共用，或按环境拆分） |
| `VITE_GA_MEASUREMENT_ID` | Variable | GA4 测量 ID，留空则关闭统计 |

**Staging / Production 固定值**（已写在 `deploy-staging.yml`、`deploy-production.yml`）：

- `VITE_USE_MOCK=false`
- `VITE_API_BASE_URL=https://staging.api.varo.cloud/api`
- `VITE_BASE=/staging.github.io/`

## 路由清单

| 路径 | 页面 | 需登录 |
|---|---|---|
| `/` | Models 首页 | 否 |
| `/models/:id` | 模型详情 + Playground 占位 | 否 |
| `/api-keys` | API Keys 管理 | 是 |
| `/billing` | Billing 账单 | 是 |
| `/docs` | 文档占位 | 否 |
| `/auth` | 登录 / 注册 Tab | 否 |
| `/terms` | Terms of Service | 否 |
| `/privacy` | Privacy Policy | 否 |

未登录访问 `/api-keys`、`/billing` 会跳转 `/auth?redirect=...`。

## Mock API

开发环境下 `mock/` 目录提供以下接口：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/models` | 模型列表 |
| GET | `/api/models/:id` | 模型详情 |
| GET | `/api/user/profile` | 用户信息 + 余额 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/register` | 注册 |
| GET | `/api/api-keys` | API Key 列表 |
| POST | `/api/api-keys` | 创建 API Key |
| DELETE | `/api/api-keys/:id` | 删除 API Key |
| GET | `/api/billing/balance` | 余额 |
| GET | `/api/billing/transactions` | 流水 |

Mock 登录后 Header 会显示余额（需先调用 profile 接口，登录态 token 存于 localStorage）。

## 目录结构

```
src/
├── api/          # HTTP 请求封装
├── components/   # 公共组件与 Layout
├── i18n/         # 多语言
├── router/       # 路由与守卫
├── stores/       # Pinia 状态
├── styles/       # 全局样式
├── types/        # TypeScript 类型
└── views/        # 页面（当前为占位）
mock/             # 本地 Mock 数据
```

## 响应式

- 桌面（≥768px）：顶部横向导航
- 移动端（<768px）：汉堡菜单 + 侧边 Drawer 导航

## 多语言

Header 右上角可切换 English / 中文，选择会写入 `localStorage` 的 `locale` 键。
