# 管理后台 — 后端 API 专章

> **版本：** v1.1  
> **日期：** 2026-06-25  
> **受众：** 后端团队  
> **姊妹文档：** [前端页面专章](./admin-frontend-pages.md) · [总览索引](./admin-platform-requirements.md)

---

## 1. 概述

本文档定义 **Varo Admin Console** 所需的全部后端接口：路由、鉴权、请求/响应结构、业务规则与数据模型。Admin API 挂载于 genflow-api，路由前缀统一为 `/api/admin/*`。

**管理后台需接管的能力（替代 SQL 直改）：**

1. 模型与定价 — `model_rates`、展示字段、Input Schema
2. 运营管理 — 用户、充值订单、生成任务查询与干预
3. 系统配置 — 套餐、注册体验金、限流等

---

## 2. 鉴权与权限

### 2.1 角色

| 角色 | JWT claim | 可访问范围 |
|---|---|---|
| `user` | `role: user` | 用户端 `/api/*`（非 admin 路径） |
| `admin` | `role: admin` | 全部 `/api/admin/*` |

JWT claims 含 `sub`（用户 ID）与 `role`，详见 [auth-zh.md](../api-doc/auth-zh.md)。

### 2.2 认证流程

- Admin 与用户端共用邮箱 OTP 登录（`POST /api/auth/request-otp`、`verify-otp`）
- 管理员账号须预先在 `users` 表标记 `role = admin`
- 所有 Admin 接口：`Authorization: Bearer <access_token>`，中间件校验 `role === admin`
- 非 admin 访问任意 `/api/admin/*` → **403 Forbidden**

### 2.3 操作审计（P1）

所有写操作写入 `admin_audit_logs`：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | uuid | |
| `admin_user_id` | uuid | 操作人 |
| `action` | string | 如 `balance_adjustment`、`model_update`、`generation_refund` |
| `target_type` | string | `user` / `model` / `generation` / `api_key` 等 |
| `target_id` | string | |
| `before_snapshot` | jsonb | 变更前（可选） |
| `after_snapshot` | jsonb | 变更后（可选） |
| `reason` | string | 人工操作时必填 |
| `created_at` | bigint | 13 位毫秒 |

---

## 3. 通用约定

与用户端 API 保持一致，详见 [backend-global-adjustments.md](../doc-diff/backend-global-adjustments.md)。

| 项目 | 规范 |
|---|---|
| 响应包装 | `{ code: number, message: string, data: T }` |
| 字段命名 | snake_case |
| 时间戳 | 13 位 Unix 毫秒（JSON number） |
| 金额 | 后缀 `_usd`，JSON number，保留 2 位小数 |
| 分页 | 查询参数 `offset`（默认 0）、`limit`（默认 20，最大 100）；响应含 `total` |
| 错误码 | 400 参数错误 · 401 未登录 · 403 非 admin · 404 资源不存在 · 409 冲突（如重复退款） |
| Admin 响应 message | **固定英文**（`en-US`），不解析 `X-Locale`；Admin 为内部工具，错误提示无需本地化 |
| 用户端内容 | 见 §3.3；Admin 读写完整翻译，公开 API 按 `X-Locale` 返回单语言 |

### 3.1 分页响应结构

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [],
    "total": 100,
    "offset": 0,
    "limit": 20
  }
}
```

### 3.2 Credits 与 USD

- 数据库内部可继续用 credits 记账
- **Admin API 响应层统一输出 USD**（`_usd` 字段）
- 换算比例来自 `config.credits_per_usd`（如 100 表示 $1 = 100 credits）
- 写操作（调账）接受 `amount_usd`，服务端换算为 credits 后入账

### 3.3 用户端内容多语言

用户端 [frontend-web](../../README.md) 支持 `en-US`（默认）与 `zh-CN` 两种语言。通过 Admin 配置、并在用户端展示的**运营文案**须存多语言；Admin Console 界面本身不做 i18n。

#### 3.3.1 范围划分

| 范围 | 是否多语言 | 说明 |
|---|---|---|
| Admin API 错误 `message` | 否 | 固定 `en-US` |
| Admin 配置的展示文案 | **是** | 模型名、描述、README、FAQ、定价名称等 |
| 技术 / 数值字段 | 否 | `id`、`api_model_id`、`price_unit`、价格、排序、开关等 |

`price_unit` 为枚举，展示单位（`/秒`、`/M` 等）由用户端前端 i18n 处理，Admin 与公开 API 均只存枚举 key。

#### 3.3.2 LocalizedString 类型

Admin 接口对可翻译字段使用 **locale → string** 对象，键为 `en-US` 或 `zh-CN`：

```json
{
  "en-US": "Seedance 2.0",
  "zh-CN": "Seedance 2.0"
}
```

FAQ 条目内 `question`、`answer` 同样为 `LocalizedString`。

#### 3.3.3 需多语言的字段

| 资源 | 字段 | 优先级 |
|---|---|---|
| `models` | `name`、`display_name`、`description` | P0 |
| `model_docs` | `readme_md`、`faq[].question`、`faq[].answer` | P1 |
| `pricing_items` | `name` | P1 |

#### 3.3.4 Admin API 与公开 API 的差异

| 场景 | 行为 |
|---|---|
| `GET/PUT /api/admin/models/{id}` 等 Admin 读写 | 始终返回 / 接收完整 `LocalizedString`（两种 locale 均含） |
| `GET /api/models`、`GET /api/pricing` 等用户端公开读 | 按请求头 `X-Locale` / `Accept-Language` 解析 locale，**每个可翻译字段只返回对应语言的 string** |
| 缺少某 locale 文案 | fallback 为 `en-US`；Admin 保存时 `en-US` 为必填 |

公开 API 的 locale 解析与用户端全局规范一致，见 [backend-global-adjustments.md](../doc-diff/backend-global-adjustments.md) §二。

**Admin 请求示例（无需 `X-Locale`）：**

```http
PUT /api/admin/models/seedance-t2v HTTP/1.1
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**用户端公开 API 响应示例（`X-Locale: zh-CN`）：**

```json
{
  "id": "seedance-t2v",
  "display_name": "Seedance 2.0",
  "description": "文本生成视频模型..."
}
```

---

## 4. API 清单

| 优先级 | 方法 | 路径 | 说明 |
|---|---|---|---|
| P0 | GET | `/api/admin/dashboard/summary` | 仪表盘汇总 |
| P0 | GET | `/api/admin/users` | 用户列表 |
| P0 | GET | `/api/admin/users/{user_id}` | 用户详情 |
| P0 | POST | `/api/admin/users/{user_id}/balance-adjustment` | 余额调整 |
| P0 | GET | `/api/admin/models` | 模型列表 |
| P0 | POST | `/api/admin/models` | 创建模型 |
| P0 | GET | `/api/admin/models/{model_id}` | 模型详情 |
| P0 | PUT | `/api/admin/models/{model_id}` | 更新模型 |
| P0 | PATCH | `/api/admin/models/{model_id}/status` | 上下架 |
| P0 | GET | `/api/admin/generations` | 生成任务列表 |
| P0 | GET | `/api/admin/generations/{task_id}` | 任务详情 |
| P0 | POST | `/api/admin/generations/{task_id}/refund` | 手动退款 |
| P0 | GET | `/api/admin/billing/transactions` | 充值订单列表 |
| P0 | POST | `/api/admin/credits/topup` | **已有**，建议迁移至 balance-adjustment |
| P1 | PATCH | `/api/admin/users/{user_id}` | 禁用/启用用户 |
| P1 | GET | `/api/admin/config` | 读取系统配置 |
| P1 | PUT | `/api/admin/config` | 更新系统配置 |
| P1 | GET | `/api/admin/pricing` | 定价目录列表 |
| P1 | POST | `/api/admin/pricing` | 创建定价条目 |
| P1 | PUT | `/api/admin/pricing/{id}` | 更新定价条目 |
| P1 | DELETE | `/api/admin/pricing/{id}` | 删除定价条目 |
| P1 | GET | `/api/admin/api-keys` | 跨用户 Key 列表 |
| P1 | DELETE | `/api/admin/api-keys/{key_id}` | 撤销 Key |
| P1 | POST | `/api/admin/billing/transactions/{id}/complete` | 手动标记充值完成 |
| P1 | POST | `/api/admin/billing/transactions/{id}/fail` | 手动标记充值失败 |
| P1 | GET | `/api/admin/audit-logs` | 审计日志查询 |
| P2 | POST | `/api/admin/promo-codes` | 创建兑换码 |
| P2 | GET | `/api/admin/promo-codes` | 兑换码列表 |
| P2 | POST | `/api/admin/users/batch-bonus` | 批量赠送体验金 |

---

## 5. 接口详述

### 5.1 仪表盘

#### `GET /api/admin/dashboard/summary`

**查询参数**

| 参数 | 默认 | 说明 |
|---|---|---|
| `range` | `7d` | `24h` \| `7d` \| `30d` |

**响应 200 — `data`**

```json
{
  "users_total": 1280,
  "users_new_today": 12,
  "users_new_this_week": 85,
  "users_active_7d": 320,
  "generations_today": {
    "total": 450,
    "queued": 5,
    "processing": 12,
    "completed": 420,
    "failed": 13
  },
  "generations_today_by_channel": {
    "web": 180,
    "api": 270
  },
  "revenue_today_usd": 1250.00,
  "spend_today_usd": 890.50,
  "failure_rate_24h": 0.029,
  "pending_topups_count": 3,
  "trend": [
    {
      "date": "2026-06-19",
      "generations": 380,
      "revenue_usd": 980.00,
      "spend_usd": 720.00,
      "new_users": 10
    }
  ]
}
```

---

### 5.2 用户管理

#### `GET /api/admin/users`

**查询参数**

| 参数 | 说明 |
|---|---|
| `offset` / `limit` | 分页 |
| `q` | 模糊搜索 email 或 user_id |
| `role` | `user` \| `admin` |
| `status` | `active` \| `suspended`（P1） |
| `balance_min_usd` / `balance_max_usd` | 余额区间 |
| `created_from` / `created_to` | 注册时间（13 位毫秒） |
| `sort` | `created_at` \| `balance_usd` \| `last_active_at`（前缀 `-` 倒序） |

**响应 `items[]` 元素**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user",
  "status": "active",
  "balance_usd": 17.50,
  "api_keys_count": 2,
  "created_at": 1748736000000,
  "last_active_at": 1749899520000
}
```

#### `GET /api/admin/users/{user_id}`

**响应 200 — `data`**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user",
  "status": "active",
  "balance_usd": 17.50,
  "balance_credits": 1750,
  "spent_this_month_usd": 96.28,
  "created_at": 1748736000000,
  "api_keys": [
    {
      "id": "uuid",
      "name": "production",
      "prefix": "sk_live_1f78",
      "is_active": true,
      "total_calls": 120,
      "total_spend_usd": 45.00,
      "last_used_at": 1749899520000,
      "created_at": 1749633401000
    }
  ],
  "auto_top_up": {
    "enabled": false,
    "threshold_usd": 5.00,
    "package_id": "starter"
  },
  "model_preferences": {
    "favourites": ["seedance-t2v"],
    "recent": [{ "id": "seedance-t2v", "visited_at": 1749899520000 }]
  }
}
```

> `api_keys`、`auto_top_up`、`model_preferences` 可内嵌或拆为子资源；内嵌减少 Admin 前端请求数。

**子资源分页接口（可选，详情 Tab 懒加载时使用）**

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/users/{user_id}/billing/transactions` | 充值记录 |
| GET | `/api/admin/users/{user_id}/billing/records` | 账单流水 |
| GET | `/api/admin/users/{user_id}/generations` | 生成记录 |

参数与用户端 `GET /api/billing/records`、`GET /api/usage` 对齐，但无需 JWT 用户上下文，由 path 指定 `user_id`。

#### `POST /api/admin/users/{user_id}/balance-adjustment`

**请求体**

```json
{
  "amount_usd": 3.00,
  "type": "bonus",
  "reason": "注册体验金补发",
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440000"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `amount_usd` | number | ✅ | 正数增加、负数扣减；扣减时校验余额充足 |
| `type` | string | ✅ | `manual_topup` \| `bonus` \| `refund` \| `correction` |
| `reason` | string | ✅ | 写入 audit log；用户流水备注 |
| `idempotency_key` | string | | 幂等键，重复请求返回同一结果 |

**响应 200**

```json
{
  "user_id": "uuid",
  "previous_balance_usd": 17.50,
  "new_balance_usd": 20.50,
  "adjustment_usd": 3.00,
  "billing_record_id": "uuid"
}
```

**业务规则**

- 原子：更新 `users.balance`（credits）+ 插入 `billing_records`（`style=bonus` 或 `admin_adjustment`）
- `type=bonus` 对应用户端账单 `style: bonus`
- 同一 `idempotency_key` 24h 内幂等

#### `PATCH /api/admin/users/{user_id}`（P1）

```json
{ "status": "suspended" }
```

- `suspended`：撤销全部 refresh token；拒绝新 OTP 登录（或登录后 403）；拒绝新任务提交
- 进行中任务允许跑完

---

### 5.3 模型管理

字段定义与用户端公开接口对齐，见 [models-backend-gaps.md](../doc-diff/models-backend-gaps.md)、[model-docs-backend-gaps.md](../doc-diff/model-docs-backend-gaps.md)、[playground-backend-gaps.md](../doc-diff/playground-backend-gaps.md)。

#### `GET /api/admin/models`

**查询参数：** `offset`、`limit`、`q`（搜索 name/id/provider）、`active`（true/false）

**响应 `items[]`**

```json
{
  "id": "seedance-t2v",
  "name": { "en-US": "Seedance 2.0 Text-to-Video", "zh-CN": "Seedance 2.0 文生视频" },
  "display_name": { "en-US": "Seedance 2.0", "zh-CN": "Seedance 2.0" },
  "provider": "ByteDance",
  "capabilities": ["text-to-video"],
  "active": true,
  "is_hot": true,
  "starting_price_usd": 0.072,
  "price_unit": "per_second",
  "sort_order": 10,
  "updated_at": 1749899520000
}
```

> 列表 `name` / `display_name` 为 `LocalizedString`；Admin 前端表格默认展示 `en-US` 值（见 [前端专章 §2.5](./admin-frontend-pages.md#25-多语言策略)）。

#### `GET /api/admin/models/{model_id}`

返回完整模型对象，含 `input_schema`、`readme_md`、`faq`；可翻译字段均为 `LocalizedString`（§3.3）：

```json
{
  "id": "seedance-t2v",
  "name": { "en-US": "Seedance 2.0 Text-to-Video", "zh-CN": "Seedance 2.0 文生视频" },
  "display_name": { "en-US": "Seedance 2.0", "zh-CN": "Seedance 2.0" },
  "provider": "ByteDance",
  "capabilities": ["text-to-video"],
  "description": {
    "en-US": "Text-to-video generation model.",
    "zh-CN": "文本生成视频模型。"
  },
  "thumbnail_url": "https://cdn.example.com/thumb.jpg",
  "icon_url": "https://cdn.example.com/icons/seedance.svg",
  "model_path": "bytedance/seedance-2.0/text-to-video",
  "api_model_id": "dreamina-seedance-2-0-260128",
  "active": false,
  "is_hot": false,
  "sort_order": 10,
  "starting_price_usd": 0.072,
  "standard_price_usd": 0.09,
  "price_unit": "per_second",
  "price_detail": "480p",
  "discount_percent": 20,
  "per_run_price_usd": 0.36,
  "runs_per_ten_usd": 27,
  "input_schema": { "type": "object", "properties": {} },
  "readme_md": {
    "en-US": "## Seedance 2.0\n...",
    "zh-CN": "## Seedance 2.0\n..."
  },
  "faq": [
    {
      "question": {
        "en-US": "How much does each run cost?",
        "zh-CN": "每次运行多少钱？"
      },
      "answer": {
        "en-US": "Pricing scales with resolution and duration.",
        "zh-CN": "价格随分辨率与时长变化。"
      }
    }
  ],
  "created_at": 1748736000000,
  "updated_at": 1749899520000
}
```

#### `POST /api/admin/models`

- 请求体同详情结构；`id` 必填且唯一；默认 `active: false`
- 校验 `input_schema` 为合法 JSON Schema
- 校验 `price_unit` 枚举
- 校验可翻译字段：`en-US` 必填；`zh-CN` 可选，缺省时公开 API fallback 至 `en-US`
- 创建后写入 audit log

#### `PUT /api/admin/models/{model_id}`

- 全量或部分更新（建议 PATCH 语义的部分更新亦可）
- **`id` 不可修改**
- 更新 `input_schema` 后立即生效于公开接口 `GET /api/models/{id}/input-schema`
- 更新定价字段后同步影响 Quote / Run 计价

#### `PATCH /api/admin/models/{model_id}/status`

```json
{ "active": true }
```

| `active` | 行为 |
|---|---|
| `true` | 出现在用户端 Models 列表、`GET /v1/models` |
| `false` | 用户端不可见；新 Playground/API 提交返回 404；进行中任务继续 |

---

### 5.4 定价目录（P1）

配置用户端 `GET /api/pricing`，见 [pricing-backend-gaps.md](../doc-diff/pricing-backend-gaps.md)。

#### `GET /api/admin/pricing`

**响应 `data`：** 定价条目数组

```json
{
  "id": "veo-31-lite-i2v",
  "model_id": "seedance-i2v",
  "name": {
    "en-US": "Seedance 2.0 Image-to-Video",
    "zh-CN": "Seedance 2.0 图生视频"
  },
  "standard_price_usd": 0.1,
  "starting_price_usd": 0.084,
  "price_unit": "per_second",
  "discount_percent": 15,
  "category": "image-video",
  "media_type": "video",
  "sort_order": 20
}
```

> `name` 为 `LocalizedString`；公开 `GET /api/pricing` 按 `X-Locale` 返回单语言 string。

#### `POST /api/admin/pricing` · `PUT /api/admin/pricing/{id}` · `DELETE /api/admin/pricing/{id}`

标准 CRUD；删除为硬删除或软删除由后端决定，需在文档注明。

---

### 5.5 生成任务

#### `GET /api/admin/generations`

**查询参数**

| 参数 | 说明 |
|---|---|
| `offset` / `limit` | 分页 |
| `status` | `queued` \| `processing` \| `completed` \| `failed` |
| `model_id` | 控制台模型 ID |
| `api_model_id` | 外部 model 字段 |
| `user_id` | |
| `email` | 模糊匹配 |
| `invocation_channel` | `web` \| `api` |
| `api_key_id` | |
| `refunded` | `true` \| `false` |
| `created_from` / `created_to` | 13 位毫秒 |

**响应 `items[]`**

```json
{
  "task_id": "cgt-20260611195952-9l74f",
  "user_id": "uuid",
  "user_email": "user@example.com",
  "model_id": "seedance-t2v",
  "api_model_id": "dreamina-seedance-2-0-260128",
  "status": "failed",
  "cost_usd": 2.00,
  "duration": 5,
  "invocation_channel": "web",
  "api_key_prefix": null,
  "refunded": false,
  "created_at": 1749633592000,
  "completed_at": 1749633652000
}
```

#### `GET /api/admin/generations/{task_id}`

```json
{
  "task_id": "cgt-20260611195952-9l74f",
  "user_id": "uuid",
  "user_email": "user@example.com",
  "model_id": "seedance-t2v",
  "api_model_id": "dreamina-seedance-2-0-260128",
  "status": "failed",
  "invocation_channel": "api",
  "api_key_id": "uuid",
  "api_key_prefix": "sk_live_1f78",
  "input": { "prompt": "...", "duration": 5, "resolution": "720p" },
  "output": { "type": "video", "url": "https://..." },
  "cost_usd": 2.00,
  "refunded": false,
  "billing_record_id": "uuid",
  "upstream_task_id": "cgt-upstream-xxx",
  "upstream_error": "Upstream timeout",
  "timeline": [
    { "status": "queued", "at": 1749633592000 },
    { "status": "processing", "at": 1749633595000 },
    { "status": "failed", "at": 1749633652000 }
  ],
  "created_at": 1749633592000,
  "completed_at": 1749633652000
}
```

#### `POST /api/admin/generations/{task_id}/refund`

**请求体**

```json
{ "reason": "上游超时，人工退款" }
```

**响应 200**

```json
{
  "task_id": "cgt-20260611195952-9l74f",
  "refunded_usd": 2.00,
  "new_user_balance_usd": 19.50,
  "billing_record_id": "uuid"
}
```

**业务规则**

- 幂等：已退款 → 409 Conflict
- 原子：用户余额增加 + `billing_records` 写入正数流水 + 任务标记 `refunded=true`
- 写 audit log
- 可选：将 stuck `processing` 任务先标记为 `failed` 再退款

---

### 5.6 充值订单

#### `GET /api/admin/billing/transactions`

**查询参数：** `offset`、`limit`、`status`、`user_id`、`email`、`package_id`、`created_from`、`created_to`

**响应 `items[]`**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "user_email": "user@example.com",
  "amount_usd": 10.00,
  "package_id": "starter",
  "status": "completed",
  "payment_method": "stripe",
  "payment_detail": "Visa ••4242",
  "stripe_session_id": "cs_test_...",
  "receipt_url": "https://pay.stripe.com/receipts/...",
  "created_at": 1749976800000,
  "completed_at": 1749976860000
}
```

#### `POST /api/admin/billing/transactions/{id}/complete`（P1）

Webhook 丢失时人工补入账。需二次确认 Stripe 侧已支付。

```json
{ "reason": "Stripe webhook missed, verified in dashboard" }
```

#### `POST /api/admin/billing/transactions/{id}/fail`（P1）

关闭长期 pending 订单。

```json
{ "reason": "User abandoned checkout" }
```

---

### 5.7 系统配置（P1）

#### `GET /api/admin/config`

```json
{
  "credits_per_usd": 100,
  "credit_packages": [
    { "id": "starter", "price_usd": 10, "credits": 1000, "stripe_price_id": "price_..." },
    { "id": "pro", "price_usd": 25, "credits": 3000, "stripe_price_id": "price_..." },
    { "id": "business", "price_usd": 50, "credits": 7000, "stripe_price_id": "price_..." }
  ],
  "signup_bonus_usd": 3.00,
  "initial_balance_usd": 0,
  "default_rate_limit_rpm": 60,
  "upload_max_size_mb": 50,
  "secrets": {
    "ark_api_key": { "configured": true },
    "turnstile_secret_key": { "configured": true }
  }
}
```

> 敏感密钥**不回显明文**；`PUT` 时若字段非空则覆盖，空字符串表示不修改。

#### `PUT /api/admin/config`

部分更新，仅提交需修改的键：

```json
{
  "signup_bonus_usd": 3.00,
  "default_rate_limit_rpm": 120
}
```

---

### 5.8 API Key 管理（P1）

#### `GET /api/admin/api-keys`

**查询参数：** `offset`、`limit`、`q`（email/prefix/name）、`is_active`

**响应 `items[]`**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "user_email": "user@example.com",
  "name": "production",
  "prefix": "sk_live_1f78",
  "is_active": true,
  "total_calls": 120,
  "total_spend_usd": 45.00,
  "last_used_at": 1749899520000,
  "created_at": 1749633401000
}
```

#### `DELETE /api/admin/api-keys/{key_id}`

等同用户端 `DELETE /api/api-keys/{key_id}`，响应 `{ "revoked": true }`，写 audit log。

---

### 5.9 已有接口：手动充值 credits

#### `POST /api/admin/credits/topup`（遗留，建议废弃）

```json
{
  "user_id": "uuid",
  "amount": 1000
}
```

| 状态 | 说明 |
|---|---|
| 现状 | 文档已定义于 [rest-api-zh.md](../api-doc/rest-api-zh.md) |
| 问题 | 使用 credits 整数，与 Admin USD 规范不一致 |
| 迁移 | 新实现统一走 `balance-adjustment`；保留此接口作兼容，内部转发 |

---

### 5.10 运营工具（P2）

#### `POST /api/admin/promo-codes`

```json
{
  "code": "WELCOME10",
  "bonus_usd": 10.00,
  "max_redemptions": 100,
  "expires_at": 1752537600000
}
```

#### `POST /api/admin/users/batch-bonus`

```json
{
  "emails": ["a@example.com", "b@example.com"],
  "amount_usd": 3.00,
  "reason": "活动补偿"
}
```

响应：`{ "succeeded": 2, "failed": 0, "results": [...] }`

---

## 6. 数据模型

| 表 | 用途 | 关键字段 |
|---|---|---|
| `users` | 用户 | `email`、`role`、`status`、`balance`（credits）、`created_at` |
| `api_keys` | API Key | `user_id`、`name`、`prefix`、`is_active`、用量聚合 |
| `models` | 模型目录 | 展示字段（`name` 等为 jsonb `LocalizedString`）、`api_model_id`、`active`、`is_hot`、`sort_order` |
| `model_input_schemas` | Playground Schema | `model_id`、`schema`（jsonb） |
| `model_docs` | 文档 | `readme_md`、`faq`（jsonb，均为多语言） |
| `pricing_items` | 定价页条目 | `name`（多语言）、价格字段、`model_id`、`sort_order` |
| `billing_transactions` | Stripe 充值 | `status`、`stripe_session_id`、`amount_usd` |
| `billing_records` | 用户流水 | `style`、`amount_usd`、`user_id` |
| `generations` | 生成任务 | `status`、`cost`、`invocation_channel`、`refunded` |
| `admin_audit_logs` | 审计 | §2.3 |
| `config` | 系统 KV | `credits_per_usd`、`credit_packages` 等 |
| `promo_codes` | 兑换码（P2） | `code`、`bonus_usd`、`redemptions` |

**建议：** 将现有 `config.model_rates` 迁移为独立 `models` 表，Admin CRUD 直接操作该表，公开 `GET /api/models` 读同一数据源。

---

## 7. 与用户端公开 API 的关系

| Admin 写操作 | 影响的公开接口 |
|---|---|
| 模型 CRUD / 上下架 | `GET /api/models`、`GET /api/models/{id}`、`GET /api/models/{id}/input-schema`、`GET /v1/models`（公开读按 `X-Locale` 解析 `LocalizedString`） |
| 定价目录 | `GET /api/pricing`（同上） |
| 系统配置 packages | `GET /api/billing/packages` |
| balance-adjustment | `GET /api/user/profile`、`GET /api/billing/balance`、`GET /api/billing/records` |
| generation refund | 用户余额 + 账单流水 |
| config signup_bonus | `POST /api/auth/verify-otp` 首次注册逻辑 |

---

## 8. 实施里程碑（后端）

### Phase 1 — P0（约 1～1.5 周）

- [ ] Admin 鉴权中间件（`/api/admin/*` + `role=admin`）
- [ ] dashboard / users / models / generations / billing/transactions
- [ ] balance-adjustment（替代 topup）
- [ ] generation refund + audit log 基础
- [ ] 模型 `name` / `display_name` / `description` 多语言存储；公开 `GET /api/models` 按 `X-Locale` 返回单语言

**验收：** Swagger 覆盖全部 P0 接口；Postman 集合可完成「调账 → 上架模型 → 退款」闭环。

### Phase 2 — P1（约 1 周）

- [ ] config / pricing CRUD / api-keys / user suspend
- [ ] billing 异常手动 complete/fail
- [ ] audit-logs 查询
- [ ] `readme_md` / `faq` / 定价 `name` 多语言；公开 API locale 解析与 fallback

### Phase 3 — P2

- [ ] promo-codes / batch-bonus

---

## 9. 关联文档

| 文档 | 路径 |
|---|---|
| 前端页面专章 | [admin-frontend-pages.md](./admin-frontend-pages.md) |
| REST API（含 legacy topup） | [rest-api-zh.md](../api-doc/rest-api-zh.md) |
| 认证 API | [auth-zh.md](../api-doc/auth-zh.md) |
| 全局规范 | [backend-global-adjustments.md](../doc-diff/backend-global-adjustments.md) |
| 模型 / Playground / 计费缺口 | [models-backend-gaps.md](../doc-diff/models-backend-gaps.md) 等 |

---

## 10. 开放问题

| # | 问题 | 建议 |
|---|---|---|
| 1 | 用户详情内嵌 vs 子资源分页 | V1 内嵌 + 流水/任务 Tab 懒加载分页 |
| 2 | `PUT /api/admin/models` 全量还是 PATCH | 支持部分字段更新，前端只提交变更 Tab |
| 3 | 定价目录 V1 是否独立表 | 模型 ≤4 时与 models 合并，pricing API 读 models |
| 4 | legacy topup 废弃时间表 | Phase 2 标记 deprecated |
| 5 | Admin 界面 i18n | **不做**；用户端内容用 `LocalizedString`（§3.3） |
