# 管理后台 — 前端页面专章

> **版本：** v1.1  
> **日期：** 2026-06-25  
> **受众：** 管理后台前端团队  
> **姊妹文档：** [后端 API 专章](./admin-backend-api.md) · [总览索引](./admin-platform-requirements.md)

---

## 1. 概述

本文档定义 **Varo Admin Console** 的前端工程方案、路由结构、页面功能、组件与交互规范。Admin 为**内部运营控制台**，V1 无需定制视觉，使用组件库快速搭建即可。

**定位：** 不面向终端用户；与用户端 [frontend-web](../../README.md) **独立部署**，不共享 Layout / Header。

---

## 2. 工程方案

### 2.1 推荐方案

| 项目 | 选择 |
|---|---|
| 仓库 | 独立仓库 `admin-web`（V1 推荐） |
| 框架 | Vue 3 + TypeScript + Vite |
| 组件库 | Naive UI 或 Ant Design Vue |
| HTTP | Axios，模式对齐用户端 `src/api/http.ts` |
| 状态 | Pinia（登录态、当前 admin profile） |
| 路由 | Vue Router + 全局 beforeEach 权限守卫 |

### 2.2 不推荐方案

| 方案 | 原因 |
|---|---|
| 嵌入 `frontend-web` 的 `/admin` 路由 | 与用户端耦合，SEO / 部署 / 权限边界模糊 |
| 纯后端 Admin 模板 | 定制 Schema 编辑、任务排查体验差 |

### 2.3 环境变量

| 变量 | 说明 |
|---|---|
| `VITE_API_BASE_URL` | genflow-api 根路径，如 `https://api.varo.cloud` |
| `VITE_AUTH_API_BASE_URL` | 认证 API（若与用户端拆分） |
| `VITE_TURNSTILE_SITE_KEY` | 登录页人机验证（与用户端相同） |

### 2.4 可复用用户端代码

| 模块 | 路径 | 说明 |
|---|---|---|
| 类型定义 | `src/types/index.ts` | Model、Transaction 等，按需 copy 或抽 shared 包 |
| 时间格式化 | 用户端 `formatTimestamp` 逻辑 | 13 位毫秒 → 展示字符串 |
| 金额格式化 | 用户端 `formatUsd` / `currency.ts` | `$17.50` |
| HTTP 拦截器 | `src/api/http.ts` | Token 注入、401 刷新；**Admin 不发送 `X-Locale`**（界面不做 i18n） |

### 2.5 多语言策略

**Admin Console 界面本身不做 i18n**，固定单一界面语言（建议中文），不引入 `vue-i18n`。

通过 Admin 编辑、在用户端展示的**运营文案**须支持 `en-US` 与 `zh-CN`，与 [后端专章 §3.3](./admin-backend-api.md#33-用户端内容多语言) 对齐：

| 范围 | Admin 前端行为 |
|---|---|
| 菜单、按钮、表格列、错误 Toast | 硬编码单一语言，无需 i18n |
| 模型 / 定价 / 文档等可编辑文案 | 编辑页内 **语言子 Tab**（`English` · `简体中文`），分别录入 |
| 列表页展示名称 | 默认显示 `en-US` 值；无则 fallback 至 `zh-CN` |

**不引入 `vue-i18n` 的原因：** Admin 为内部工具，界面文案量小且受众固定；仅内容编辑区需要 locale 切换，用 Tab + 表单字段映射即可，无需整站国际化框架。

**HTTP：** Admin API 请求不附加 `X-Locale`；后端 Admin 接口也不依赖 locale 解析。

---

## 3. 认证与权限

### 3.1 登录流程

与用户端相同：邮箱 OTP + Cloudflare Turnstile。

```
/login
  → 输入 email → Turnstile → 发送验证码
  → 输入验证码 → Turnstile → verify-otp
  → 存 access_token + refresh_token
  → GET /api/user/profile
  → role === 'admin' ? 进入 /dashboard : 提示无权限并登出
```

### 3.2 路由守卫

```typescript
// 伪代码
router.beforeEach(async (to) => {
  if (to.meta.public) return true
  if (!hasToken()) return '/login'
  const profile = await fetchProfile()
  if (profile.role !== 'admin') {
    clearAuth()
    return '/login?error=forbidden'
  }
  return true
})
```

### 3.3 Layout 结构

```
┌─────────────────────────────────────────────────┐
│  Varo Admin          [admin@varo.cloud] [退出]  │
├──────────┬──────────────────────────────────────┤
│ 侧边导航  │  主内容区                             │
│ Dashboard│                                      │
│ 用户     │                                      │
│ 模型     │                                      │
│ 任务     │                                      │
│ 充值订单  │                                      │
│ API Keys │  (P1)                                │
│ 定价     │  (P1)                                │
│ 系统配置  │  (P1)                                │
└──────────┴──────────────────────────────────────┘
```

- 桌面：固定左侧 Sidebar + 顶栏
- 移动端：可折叠 Sidebar 或顶部汉堡菜单（内部工具优先级低，简单即可）

---

## 4. 路由清单

| 路径 | 页面 | 优先级 | 对应 API |
|---|---|---|---|
| `/login` | 登录 | P0 | auth OTP |
| `/dashboard` | 仪表盘 | P0 | `GET /api/admin/dashboard/summary` |
| `/users` | 用户列表 | P0 | `GET /api/admin/users` |
| `/users/:id` | 用户详情 | P0 | `GET /api/admin/users/{id}` + 子 Tab 接口 |
| `/models` | 模型列表 | P0 | `GET /api/admin/models` |
| `/models/new` | 创建模型 | P0 | `POST /api/admin/models` |
| `/models/:id/edit` | 编辑模型 | P0 | `GET/PUT /api/admin/models/{id}` |
| `/generations` | 任务列表 | P0 | `GET /api/admin/generations` |
| `/generations/:id` | 任务详情 | P0 | `GET /api/admin/generations/{id}` |
| `/billing/transactions` | 充值订单 | P0 | `GET /api/admin/billing/transactions` |
| `/api-keys` | API Key 管理 | P1 | `GET/DELETE /api/admin/api-keys` |
| `/pricing` | 定价目录 | P1 | pricing CRUD |
| `/settings` | 系统配置 | P1 | `GET/PUT /api/admin/config` |
| `/audit-logs` | 审计日志 | P1 | `GET /api/admin/audit-logs` |

---

## 5. 页面详述

### 5.1 登录页 `/login`

| 元素 | 说明 |
|---|---|
| Email 输入 | |
| Turnstile | 复用 `TurnstileWidget` 模式 |
| OTP 输入 | 6 位 |
| 错误提示 | 展示后端 `message`；`forbidden` 时提示「非管理员账号」 |
| 品牌 | 简单 Logo + 「Varo Admin」标题即可 |

**状态：** 发送验证码中 · 等待 OTP · 验证中 · 无权限

---

### 5.2 仪表盘 `/dashboard`

**目标：** 运营一眼掌握平台健康度。

#### 布局

```
┌────────────┬────────────┬────────────┬────────────┐
│ 总用户数    │ 今日新增    │ 7日活跃     │ 待处理充值  │
│ 1,280      │ 12         │ 320        │ 3 ⚠️       │
└────────────┴────────────┴────────────┴────────────┘

┌─────────────────────────────┬──────────────────────┐
│  今日任务 (450)              │  今日充值 / 消费      │
│  ■ completed 420            │  $1,250 / $890       │
│  ■ failed 13                │                      │
└─────────────────────────────┴──────────────────────┘

┌──────────────────────────────────────────────────┐
│  7 日趋势折线图（任务数 / 充值 / 新用户）            │
└──────────────────────────────────────────────────┘
```

#### 组件

| 组件 | 说明 |
|---|---|
| `StatCard` | 数字 + 标题 + 可选趋势箭头 |
| `GenerationStatusBar` | 按 status 分色条 |
| `TrendChart` | 简单折线（ECharts / Chart.js） |
| `RangeSelect` | `24h` / `7d` / `30d` |

#### 交互

- 待处理充值 > 0 时卡片可点击跳转 `/billing/transactions?status=pending`
- 失败率超阈值（如 >5%）显示警告色

---

### 5.3 用户列表 `/users`

#### 筛选栏

| 控件 | 绑定参数 |
|---|---|
| 搜索框 | `q`（email / user_id） |
| 角色 | `role`：全部 / user / admin |
| 状态 | `status`：全部 / active / suspended（P1） |
| 注册时间 | `created_from` / `created_to` |
| 排序 | `sort` 下拉 |

#### 表格列

| 列 | 字段 | 格式 |
|---|---|---|
| Email | `email` | 可点击进详情 |
| User ID | `id` | 截断 + 复制 |
| 角色 | `role` | Tag |
| 余额 | `balance_usd` | `$17.50` |
| API Keys | `api_keys_count` | 数字 |
| 注册时间 | `created_at` | 本地时间 |
| 最近活跃 | `last_active_at` | 相对时间「3 小时前」 |
| 操作 | — | 「查看」 |

#### 空状态 / 加载 / 错误

与用户端表格模式一致：Skeleton → 空列表文案 → Toast 错误。

---

### 5.4 用户详情 `/users/:id`

#### 页头

```
user@example.com                    [调整余额] [禁用账号 P1]
余额: $17.50   本月消费: $96.28   注册: 2026/6/1
```

#### Tab 结构

| Tab | 内容 | 数据来源 |
|---|---|---|
| 概览 | 基本信息卡片 | 详情接口内嵌 |
| API Keys | 表格：name、prefix、status、calls、spend、last used | 内嵌或懒加载 |
| 充值记录 | 同 Billing 充值 Tab 列 | `.../billing/transactions` |
| 账单流水 | style、detail、amount、time | `.../billing/records` |
| 生成记录 | task_id、model、status、cost、time | `.../generations` |
| 自动充值 | enabled、threshold、package | 内嵌 `auto_top_up` |
| 模型偏好 | favourites、recent | 内嵌，低优先级 |

#### 余额调整弹窗

```
┌─ 调整余额 ─────────────────────────────┐
│ 用户: user@example.com                  │
│ 当前余额: $17.50                        │
│                                         │
│ 调整类型  [赠送 ▼]                       │
│           · 赠送 (bonus)                │
│           · 手动充值 (manual_topup)      │
│           · 退款 (refund)               │
│           · 纠错 (correction)           │
│ 金额 USD  [  3.00  ]                    │
│ 原因 *    [ 注册体验金补发            ]  │
│                                         │
│              [取消]  [确认调整]          │
└─────────────────────────────────────────┘
```

**交互规则**

- 金额必须 > 0（扣减类 type 若支持负数，单独 UX 说明）
- 原因必填，少于 5 字禁用提交
- 提交前 `NModal` 二次确认：「确认为 user@example.com 赠送 $3.00？」
- 成功：Toast + 刷新详情 + 关闭弹窗

**API：** `POST /api/admin/users/{id}/balance-adjustment`

#### 禁用账号（P1）

- 按钮仅在 `status=active` 时显示
- 确认文案说明后果（无法登录、无法提交任务）
- `PATCH /api/admin/users/{id}` `{ status: "suspended" }`

---

### 5.5 模型列表 `/models`

#### 表格列

| 列 | 说明 |
|---|---|
| ID | `seedance-t2v`，可复制 |
| 名称 | `display_name["en-US"]` 或 `name["en-US"]`（列表固定展示英文，§2.5） |
| 提供商 | `provider` |
| 能力 | capabilities Tags |
| 状态 | `active` → 绿色「已上架」/ 灰色「草稿」 |
| 热门 | `is_hot` 图标 |
| 起价 | `$0.072/秒`（`starting_price_usd` + `price_unit` i18n） |
| 排序 | `sort_order` |
| 更新时间 | `updated_at` |
| 操作 | 编辑 · 上架/下架 |

#### 顶栏操作

- 「创建模型」→ `/models/new`
- 筛选：`active` 全部 / 已上架 / 草稿
- 搜索：`q`

#### 快捷上下架

- 列表行内 Switch 或按钮 → `PATCH .../status`
- 下架前确认：「下架后用户端不可见，进行中任务不受影响」

---

### 5.6 模型编辑 `/models/new` · `/models/:id/edit`

#### Tab 布局

```
[ 基本信息 ] [ 定价 ] [ Input Schema ] [ 文档 FAQ ]
                                    [保存] [取消]
```

#### Tab：基本信息

可翻译字段（完整名称、展示名称、描述）在 Tab 内嵌 **语言子 Tab**：`English (en-US)` · `简体中文 (zh-CN)`。`en-US` 必填；`zh-CN` 可选。

| 字段 | 控件 | 必填 |
|---|---|---|
| ID | Input（创建时可编辑，编辑时 disabled） | ✅ |
| 完整名称 | Input（按当前语言子 Tab） | ✅（en-US） |
| 展示名称 | Input（按当前语言子 Tab） | |
| 提供商 | Select 或 Input | ✅ |
| 能力 | 多选 Tags：`text-to-video`、`image-to-video` | ✅ |
| 描述 | Textarea（按当前语言子 Tab） | ✅（en-US） |
| 缩略图 URL | Input + 预览 | |
| model_path | Input | ✅ |
| api_model_id | Input | ✅ |
| 热门 | Switch | |
| 新品 | Switch | |
| 排序 | InputNumber | |
| 上架 | Switch（或仅在列表操作） | |

#### Tab：定价

| 字段 | 控件 |
|---|---|
| 起价 USD | InputNumber step 0.001 |
| 标准价 USD | InputNumber |
| 计价单位 | Select：`per_second` / `per_image` / `per_million_tokens` / `per_hour` |
| 价格详情 | Input（如 `720p`） |
| 折扣 % | InputNumber 0–100 |
| 单次运行价 | InputNumber |
| runs/10 USD | InputNumber |

#### Tab：Input Schema

| 元素 | 说明 |
|---|---|
| JSON Editor | Monaco Editor 或 CodeMirror，语法高亮 |
| 格式化 | 「Format JSON」按钮 |
| 校验 | 保存前客户端 JSON.parse；后端返回 schema 错误时展示行号 |
| 参考链接 | 文档指向 [playground-backend-gaps.md](../doc-diff/playground-backend-gaps.md) |

#### Tab：文档 FAQ

顶部 **语言子 Tab**（同基本信息）；`readme_md` 与 FAQ 的 question / answer 按当前语言分别编辑。

| 元素 | 说明 |
|---|---|
| readme_md | Markdown textarea + 预览分栏（P1）；P2 换富文本 |
| FAQ 列表 | 动态表单：question + answer（当前语言），增删行，拖拽排序（P2） |

保存时将两种 locale 合并为 `LocalizedString` 提交后端（见 [API §3.3](./admin-backend-api.md#33-用户端内容多语言)）。

#### 保存行为

- 「保存」仅提交**当前 Tab** 或全量 PUT（与后端约定一致，建议 PATCH 式部分更新）
- 新建模型默认 `active: false`，保存成功后提示「请完成配置后上架」
- 离开页面前未保存提醒（`onBeforeRouteLeave`）

---

### 5.7 任务列表 `/generations`

#### 筛选

| 控件 | 参数 |
|---|---|
| 状态 | `status` 多选 |
| 渠道 | `web` / `api` |
| 模型 | Select（从 models 列表拉取） |
| 用户 | email 搜索 |
| 是否已退款 | `refunded` |
| 时间范围 | DateRangePicker → 13 位毫秒 |

#### 表格列

| 列 | 字段 |
|---|---|
| Task ID | `task_id`，可复制 |
| 用户 | `user_email` → 链接 `/users/:id` |
| 模型 | `model_id` |
| 状态 | Tag 色：queued 灰 / processing 蓝 / completed 绿 / failed 红 |
| 费用 | `cost_usd` |
| 时长 | `duration` + `s` |
| 渠道 | `web` / `api` |
| 已退款 | ✓ / — |
| 创建时间 | `created_at` |
| 操作 | 查看 |

---

### 5.8 任务详情 `/generations/:id`

#### 布局

```
Task: cgt-20260611195952-9l74f          [退还费用]
状态: failed    费用: $2.00    已退款: 否
用户: user@example.com    渠道: web    模型: seedance-t2v
─────────────────────────────────────────────────────
[ 概览 ] [ 输入 JSON ] [ 输出 ] [ 时间线 ] [ 上游错误 ]
```

#### 退还费用按钮

- 显示条件：`refunded === false` 且 `cost_usd > 0`
- 点击 → 弹窗填写 reason → 二次确认
- 成功刷新详情；409 提示「已退款」

#### 输入 JSON Tab

- 只读 JSON 树或格式化代码块
- 支持复制

#### 输出 Tab

- `completed`：视频 URL 链接 + 新窗口预览
- 其他状态：空状态

#### 时间线 Tab

- 垂直 Steps：`queued` → `processing` → `completed/failed`
- 每步显示时间戳

---

### 5.9 充值订单 `/billing/transactions`

#### 表格列

| 列 | 字段 |
|---|---|
| 交易 ID | `id` |
| 用户 | `user_email` |
| 金额 | `amount_usd` |
| 套餐 | `package_id` |
| 状态 | pending 黄 / completed 绿 / failed 红 / expired 灰 |
| 支付方式 | `payment_detail` |
| 创建时间 | `created_at` |
| 完成时间 | `completed_at` |
| 操作 | 详情 · Stripe 链接 · 手动完成(P1) |

#### 详情 Drawer

- 完整字段 + `receipt_url` 外链
- `stripe_session_id` 可复制
- P1：pending 超过 24h 显示「手动标记完成/失败」

---

### 5.10 API Key 管理 `/api-keys`（P1）

| 列 | 说明 |
|---|---|
| 用户 | email → 用户详情 |
| 名称 | `name` |
| Key | `prefix` + `******` |
| 状态 | Active / Revoked |
| 调用 / 消耗 | `total_calls` / `total_spend_usd` |
| 最后使用 | `last_used_at` |
| 操作 | 撤销（二次确认） |

---

### 5.11 定价目录 `/pricing`（P1）

- 标准 CRUD 表格 + 编辑 Drawer
- V1 若与模型合并，此路由可隐藏，仅在模型编辑页勾选「同步到定价页」
- 编辑 Drawer 内 **名称** 字段使用语言子 Tab（`en-US` / `zh-CN`），规则同模型基本信息

| 列 | 字段 |
|---|---|
| 名称 | `name["en-US"]`（列表固定展示英文） |
| 关联模型 | `model_id` |
| 标准价 / 起价 | USD + unit |
| 折扣 | `discount_percent` |
| 排序 | `sort_order` |
| 操作 | 编辑 / 删除 |

---

### 5.12 系统配置 `/settings`（P1）

分区表单：

| 分区 | 字段 | 控件 |
|---|---|---|
| 计费 | credits_per_usd | InputNumber |
| 计费 | 注册体验金 USD | InputNumber |
| 套餐 | credit_packages 表格 | 行内编辑 price_usd / credits / stripe_price_id |
| 限流 | default_rate_limit_rpm | InputNumber |
| 上传 | upload_max_size_mb | InputNumber |
| 密钥 | ark_api_key 等 | 「已配置/未配置」+ 新值输入（不回显） |

- 保存：`PUT /api/admin/config` 部分更新
- 敏感项修改需二次确认

---

### 5.13 审计日志 `/audit-logs`（P1）

| 列 | 说明 |
|---|---|
| 时间 | `created_at` |
| 操作人 | admin email |
| 动作 | `action` |
| 目标 | `target_type` + `target_id` |
| 原因 | `reason` |
| 详情 | 展开 JSON diff |

---

## 6. 通用组件规范

### 6.1 金额展示

- 统一 `$X.XX`（2 位小数）
- **不展示 credits**（用户详情可选折叠「内部 credits: 1750」供研发调试）

### 6.2 时间展示

- 列表：本地时间 `2026/6/13 16:51`
- 可选相对时间：「3 小时前」
- 数据源：13 位毫秒 number

### 6.3 表格

| 模式 | 说明 |
|---|---|
| 分页 | 后端 `offset/limit/total`，前端 Pagination |
| 加载 | 首屏 Skeleton，翻页 Spinner |
| 空状态 | 居中插画 + 文案 |
| 错误 | Toast + 重试按钮 |

### 6.4 敏感操作确认

以下操作必须二次确认 + 必填 reason：

- 余额调整
- 任务退款
- 模型下架
- 撤销 API Key
- 禁用用户
- 手动标记充值完成

### 6.5 状态 Tag 色板（建议）

| 状态 | 颜色 |
|---|---|
| active / completed | green |
| pending / processing | blue |
| suspended / expired | gray |
| failed / revoked | red |
| draft（模型未上架） | default |

---

## 7. API 层结构（前端）

```
admin-web/src/
├── api/
│   ├── http.ts           # Axios 实例 + admin token
│   ├── auth.ts           # OTP 登录（复用用户端）
│   ├── dashboard.ts
│   ├── users.ts
│   ├── models.ts
│   ├── generations.ts
│   ├── billing.ts
│   ├── api-keys.ts       # P1
│   ├── pricing.ts        # P1
│   └── config.ts         # P1
├── types/
│   └── admin.ts          # Admin 专用类型
├── views/
│   ├── login/
│   ├── dashboard/
│   ├── users/
│   ├── models/
│   ├── generations/
│   ├── billing/
│   └── settings/
└── components/
    ├── layout/AdminLayout.vue
    ├── StatCard.vue
    ├── ConfirmReasonModal.vue
    ├── JsonEditor.vue
    └── DataTable.vue
```

### 7.1 类型映射

后端 snake_case → 前端 camelCase（API 层映射，与用户端一致）：

| 后端 | 前端 |
|---|---|
| `balance_usd` | `balanceUsd` |
| `created_at` | `createdAt` |
| `task_id` | `taskId` |

---

## 8. 与用户端页面对照

| 用户端页面 | Admin 对应能力 |
|---|---|
| Models 首页 | 模型列表 + 编辑：展示字段、上下架、排序 |
| Model Detail / Playground | 模型编辑：Schema、定价 |
| Model API Tab | 模型编辑：api_model_id、readme、faq |
| Pricing | 定价目录 或 模型定价 Tab |
| API Keys | 用户详情 Tab + 全站 API Keys 页 |
| Billing | 用户详情 Tab + 充值订单页 |
| Auth | 同款 OTP 登录 + admin 角色校验 |

---

## 9. 实施里程碑（前端）

### Phase 1 — P0（约 1～1.5 周）

- [ ] 工程初始化 + AdminLayout + 登录 + 路由守卫
- [ ] Dashboard / Users（列表+详情+调账）/ Models（列表+编辑含语言子 Tab）/ Generations（列表+详情+退款）/ Billing transactions
- [ ] 通用 ConfirmReasonModal、JsonEditor、表格分页

**验收：** 运营可通过 UI 完成「调账 → 编辑并上架模型 → 失败任务退款」，无需 SQL。

### Phase 2 — P1（约 1 周）

- [ ] Settings / API Keys / Pricing（或合并到模型页，含定价名称多语言）
- [ ] 用户禁用、充值异常处理、审计日志页
- [ ] 模型文档 FAQ 多语言编辑（readme + FAQ 语言子 Tab）

### Phase 3 — P2

- [ ] FAQ 拖拽、Markdown 富文本、Promo Code、批量赠送 UI

---

## 10. 关联文档

| 文档 | 路径 |
|---|---|
| 后端 API 专章 | [admin-backend-api.md](./admin-backend-api.md) |
| 用户端类型 | [src/types/index.ts](../../src/types/index.ts) |
| 用户端 HTTP | [src/api/http.ts](../../src/api/http.ts) |
| 产品 V1 范围 | [Wavespeed & Atlascloud 功能调研.md](../Wavespeed%20&%20Atlascloud%20功能调研.md) |

---

## 11. 开放问题

| # | 问题 | 前端建议 |
|---|---|---|
| 1 | 独立域名 vs 子路径 | `admin.varo.cloud`，与用户端 cookie 隔离 |
| 2 | 定价页独立路由 | 模型 ≤4 时隐藏 `/pricing`，模型页勾选同步 |
| 3 | Schema 可视化构建器 | V1 JSON Editor；P2 再评估 |
| 4 | Admin 界面语言 | **固定中文**（或英文二选一），不做 i18n；用户端内容用编辑页语言子 Tab |
| 5 | credits 调试信息 | 仅 user 详情折叠展示，默认隐藏 |
