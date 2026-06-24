# 充值 / 计费 — 后端接口缺失与调整清单

> 供后端开发参考  
> 前端页面：`src/views/billing/BillingView.vue`、`src/components/layout/AppHeader.vue`（余额）  
> 对比文档：[`billing-api-comparison.md`](./billing-api-comparison.md)  
> 自动充值草案：[`auto-top-up-api-draft.md`](./auto-top-up-api-draft.md)（需同步改为 USD 语义）  
> 全局规范：[`backend-global-adjustments.md`](./backend-global-adjustments.md)（时间戳 13 位毫秒）

---

## 设计原则：控制台 API 只暴露 USD，Credits 为后端内部概念

### 背景

后端内部以 **credits** 计费（扣费、入账、套餐换算均在 credits 层完成），但 **Web 控制台前端不向用户展示 credits**。用户只看到美元（USD）：

- 余额：「$17.50」
- 套餐：「$10 / $25 / $50」
- 本月消费、账单流水、充值记录：均以 USD 金额展示
- 模型定价、Playground 预估费用：USD

**credits 与 USD 的换算由后端维护**（如 `config.credit_packages` 中 `$10 → 1000 credits` 的比例）。前端不接收、不存储、不计算 credits。

### 金额字段规范

| 项目 | 规范 |
|---|---|
| 字段命名 | 后缀 `_usd`，如 `balance_usd`、`amount_usd`、`cost_usd` |
| 类型 | JSON `number`，单位美元，保留 2 位小数（如 `17.50`） |
| 禁止暴露 | `credits`、`credits_granted`、`credits_consumed`、`credits_per_second`、`amount_credits`、`spent_this_month_credits`、`threshold_credits` 等 |

### 后端改造方式（建议）

在 API 序列化层将内部 credits 转为 USD 后输出，数据库与 Webhook 逻辑可继续用 credits：

```python
CREDITS_PER_USD = 100  # 来自 config，示例：$10 = 1000 credits

def credits_to_usd(credits: int) -> float:
    return round(credits / CREDITS_PER_USD, 2)
```

---

## P0 — 已有接口字段调整（阻塞联调）

以下接口**后端文档已存在**，但返回了 credits 语义字段，需调整后前端才能正确展示。

### 1. 账户余额 `GET /api/billing/balance`

**现状（`rest-api-zh.md`）：**

```json
{ "balance": 1750 }
```

`balance` 为 credits 整数，前端会误当作美元或 credits 展示。

**应改为：**

```json
{ "balance_usd": 17.50 }
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `balance_usd` | number | 当前账户可用余额（美元） |

> 废弃或不再文档化无后缀的 `balance`（credits），避免歧义。

---

### 2. 用户资料 `GET /api/user/profile`

**现状：**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user",
  "balance": 1750,
  "created_at": "2026-06-01T00:00:00Z"
}
```

Header 钱包余额、Playground 余额校验均读取 `profile.balance`。

**应改为：**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user",
  "balance_usd": 17.50,
  "created_at": 1748736000000
}
```

| 调整项 | 说明 |
|---|---|
| `balance` → `balance_usd` | 美元余额，与 `GET /api/billing/balance` 一致 |
| `created_at` | 13 位毫秒，见全局调整文档 |

---

### 3. 充值套餐 `GET /api/billing/packages`

**现状（`stripe-zh.md`）：**

```json
[
  { "id": "starter",  "price_usd": 10, "credits": 1000 },
  { "id": "pro",      "price_usd": 25, "credits": 3000 },
  { "id": "business", "price_usd": 50, "credits": 7000 }
]
```

前端套餐列表只展示 **套餐名 + 价格（USD）**，不需要 `credits`。

**应改为：**

```json
[
  { "id": "starter",  "price_usd": 10 },
  { "id": "pro",      "price_usd": 25 },
  { "id": "business", "price_usd": 50 }
]
```

`credits` 保留在服务端 `config` 表，**不通过 API 返回**。

---

### 4. 充值历史 `GET /api/billing/transactions`

**现状：**

```json
[
  {
    "id": "uuid",
    "amount_usd": 10,
    "credits_granted": 1000,
    "status": "completed",
    "created_at": "2026-06-15T10:00:00Z"
  }
]
```

**应改为：**

```json
[
  {
    "id": "uuid",
    "amount_usd": 10,
    "status": "completed",
    "created_at": 1749976800000,
    "payment_method": "stripe",
    "payment_detail": "Visa ••4242",
    "package_id": "starter",
    "completed_at": 1749976860000,
    "receipt_url": "https://pay.stripe.com/receipts/..."
  }
]
```

| 调整项 | 说明 |
|---|---|
| 移除 `credits_granted` | 前端充值详情弹窗只展示 `amount_usd` |
| 补充详情字段 | 见下表 |
| 时间字段 | 13 位毫秒 |

**详情字段（前端「View」弹窗需要）：**

| 字段 | 类型 | 说明 |
|---|---|---|
| `payment_method` | string | 固定 `"stripe"` 即可 |
| `payment_detail` | string \| null | 如 `Visa ••4242`，来自 Stripe PaymentIntent |
| `package_id` | string \| null | `starter` / `pro` / `business` |
| `completed_at` | number \| null | Webhook 完成时间（13 位毫秒） |
| `receipt_url` | string \| null | Stripe receipt 链接 |

**建议：** 在 `checkout.session.completed` Webhook 处理时从 Stripe Session 写入上述字段。

---

### 5. Checkout 回调 URL `POST /api/billing/checkout`

**现状：** 请求体仅 `{ "package": "starter" }`。

**前端需要：** 创建 Session 时传入本地化回调地址：

```json
{
  "package": "starter",
  "success_url": "https://varo.cloud/en-US/billing?checkout=success",
  "cancel_url": "https://varo.cloud/en-US/billing?checkout=cancelled"
}
```

**原因：** 站点支持 `/:locale` 多语言路由，回调 URL 需由前端按当前 locale 动态生成。

**建议：** 接受 `success_url` / `cancel_url` 为必填或可选参数；校验域名白名单防止开放重定向。

响应 `{ "checkout_url": "..." }` 无需改动。

---

### 6. 模型目录 `GET /api/models`（控制台 / 首页）

> **完整规范见 [`models-backend-gaps.md`](./models-backend-gaps.md)**。以下为金额字段要点摘要。

**现状（`rest-api-zh.md`）：**

```json
[
  { "id": "seedance-1-5-pro-251215", "credits_per_second": 40, "active": true }
]
```

**应改为（列表项示例）：**

```json
{
  "id": "seedance-i2v",
  "starting_price_usd": 0.084,
  "standard_price_usd": 0.1,
  "price_unit": "per_second",
  "per_run_price_usd": 0.42
}
```

| 调整项 | 说明 |
|---|---|
| `credits_per_second` → `starting_price_usd` + `price_unit` | 单价以 USD + 枚举单位返回；`price_unit` 同定价页 |
| 新增 `per_run_price_usd` | Playground 默认配置单次运行总价 |
| 禁止返回 credits | 前端只感知 USD |

计费公式（后端内部）：`per_run_price_usd ≈ starting_price_usd × duration`（视频按秒）。

---

### 7. 用量记录 `GET /api/usage`

**现状：**

```json
{
  "task_id": "cgt-...",
  "model": "seedance-1-5-pro-251215",
  "duration": 5,
  "credits_consumed": 200,
  "status": "queued",
  "created_at": "2026-06-11T11:59:52Z"
}
```

**应改为：**

```json
{
  "task_id": "cgt-...",
  "model": "seedance-1-5-pro-251215",
  "duration": 5,
  "cost_usd": 2.00,
  "status": "queued",
  "created_at": 1749633592000
}
```

| 调整项 | 说明 |
|---|---|
| `credits_consumed` → `cost_usd` | 该次任务消耗金额（美元） |
| `created_at` | 13 位毫秒 |

> 视频代理 API（`/v1`、`/v2`）面向 API Key 调用方，可继续使用 credits 或 HTTP 402；**控制台相关接口**统一 USD。

---

## P1 — 充值页完整体验（接口缺失）

### 8. 账单摘要 `GET /api/billing/summary`

充值页顶部三张卡片需要聚合数据，建议新增：

```json
{
  "balance_usd": 17.50,
  "spent_this_month_usd": 96.28,
  "spent_change_percent": -12,
  "auto_top_up": {
    "enabled": false,
    "threshold_usd": 5.00,
    "package_id": "starter"
  }
}
```

| 字段 | 说明 |
|---|---|
| `balance_usd` | 当前美元余额，同 `GET /api/billing/balance` |
| `spent_this_month_usd` | 本月消费总额（美元，正数） |
| `spent_change_percent` | 较上月同期变化百分比，负数表示下降 |
| `auto_top_up.threshold_usd` | 余额低于此值（美元）时触发自动充值 |
| `auto_top_up.package_id` | 自动充值使用的套餐 ID |

**替代方案：** 不建 summary，由前端分别调用 `balance` + `auto-top-up` + 新「本月消费」接口；请求数增加。

---

### 9. 账单流水 `GET /api/billing/records`

充值页「Billing」Tab + CSV 导出需要。

```
GET /api/billing/records?limit=50&offset=0
```

**响应示例：**

```json
[
  {
    "id": "uuid",
    "style": "api",
    "key": "seedance-1-5-pro · 720p · 5s",
    "api_key": "******1f78",
    "amount_usd": -2.00,
    "created_at": 1749899520000
  },
  {
    "id": "uuid",
    "style": "topup",
    "key": "Stripe · Visa ••4242",
    "api_key": null,
    "amount_usd": 10.00,
    "created_at": 1749896400000
  }
]
```

| `style` | 含义 | `amount_usd` 符号 |
|---|---|---|
| `api` | API 调用扣费 | 负数 |
| `web` | 网页 Playground 扣费 | 负数 |
| `topup` | Stripe 充值 | 正数 |
| `bonus` | 赠送 / 活动 | 正数 |

**数据来源建议：**
- `api` / `web`：复用或扩展 `GET /api/usage` 的计费记录（输出 `cost_usd` 后取负）
- `topup`：充值交易表
- `bonus`：运营赠送记录（若有）

**与 `GET /api/usage` 的区别：** `usage` 偏任务维度；`records` 是用户可见的完整账单流水（含充值、赠送）。

---

## P2 — 自动充值（完整新业务）

后端目前 **完全没有** 自动充值相关接口。详见 [`auto-top-up-api-draft.md`](./auto-top-up-api-draft.md)，**实现时请采用 USD + 套餐 ID**，不要用 credits 阈值：

| 配置项 | 前端期望 | 说明 |
|---|---|---|
| 触发阈值 | `threshold_usd` | 余额（美元）低于此值时触发 |
| 充值方式 | `package_id` | `starter` / `pro` / `business`，与手动充值一致 |
| 扣款金额 | 由套餐 `price_usd` 决定 | 前端不配置任意金额 |

至少需要：

| 能力 | 说明 |
|---|---|
| 保存支付方式 | Stripe Customer + PaymentMethod（Setup Intent 或 Checkout `mode=setup`） |
| 读写自动充值配置 | `GET` / `PUT` `/api/billing/auto-top-up` |
| 余额监控与触发 | 扣费后或定时任务检测 `balance_usd < threshold_usd` 时 off-session 扣款 |
| 失败处理 | 扣款失败通知用户、暂停自动充值 |

**前端现状：** 自动充值面板已用 `thresholdUsd` / `topUpAmountUsd`（美元）展示；后端就绪后前端将统一为 `threshold_usd` + `package_id`。

---

## P3 — 暂未实现的前端占位功能

| 功能 | 前端文案 | 需要的大致接口 |
|---|---|---|
| 添加银行卡 | Add Card | Stripe Setup Intent / Customer Portal |
| 添加账单地址 | Add Billing Address | 用户账单地址 CRUD |
| 自动充值（未接后端前） | Enable Auto Top-up | 见 P2 |

---

## 前端现状与待对齐项（供后端理解上下文）

### 已按 USD 设计的部分

| 模块 | 说明 |
|---|---|
| 充值记录列表 / 账单流水 | `amountUsd`，格式 `$10.00` |
| 套餐选购 | 展示 `priceUsd`，跳转 Stripe 按美元扣款 |
| 自动充值表单 | `thresholdUsd`、`topUpAmountUsd` 步进输入 |
| Playground | 费用预估、余额不足判断均为 USD |
| Mock 内部账本 | `mock/account-balance.ts` 以美元记账 |

### 仍混用 credits 的部分（待后端 USD 接口就绪后改前端）

| 位置 | 现状 | 后端就绪后 |
|---|---|---|
| Header 余额 | 直接展示 `profile.balance` 整数 | 改为 `balance_usd`，`$17.50` 格式 |
| 充值页余额 / 本月消费 | `formatCredits()` 展示整数 | 改为 `formatUsd(balance_usd)` |
| 套餐副标题 | 显示「1000 credits」 | 移除，仅保留套餐名 + 价格 |
| 充值详情弹窗 | 展示 `creditsGranted` 行 | 移除该行 |
| `src/api/billing.ts` 映射 | 兼容 `balance`、`spent_this_month_credits` | 改为只读 `balance_usd`、`spent_this_month_usd` |
| Mock `billing.ts` / `auth.ts` | 将 USD 乘以 100 伪造 credits 余额 | 直接返回 `balance_usd` |

### 用户资料其他字段

| 后端有 | 前端有 | 处理 |
|---|---|---|
| `role` | 无 | 前端暂不需要 |
| `created_at` | 无 | 前端暂不需要 |
| 无 `name` | `name` | 前端从 email 本地派生 |

---

## 联调检查清单

- [ ] `GET /api/billing/balance` 返回 `balance_usd`（美元），不返回 credits
- [ ] `GET /api/user/profile` 返回 `balance_usd`
- [ ] `GET /api/billing/packages` 仅 `id` + `price_usd`，无 `credits`
- [ ] `GET /api/billing/transactions` 无 `credits_granted`，含 `amount_usd` 与详情字段
- [ ] `POST /api/billing/checkout` 支持 `success_url` / `cancel_url`
- [ ] 所有时间字段为 13 位毫秒（见 [`backend-global-adjustments.md`](./backend-global-adjustments.md)）
- [ ] `GET /api/billing/summary` 使用 `balance_usd`、`spent_this_month_usd`
- [ ] `GET /api/billing/records` 使用 `amount_usd`
- [ ] 自动充值配置使用 `threshold_usd` + `package_id`
- [ ] 控制台模型 / 用量接口使用 `price_usd_per_second`、`cost_usd`，不暴露 credits

---

## Mock 专用（生产不需要）

| 接口 | 用途 |
|---|---|
| `POST /api/billing/checkout/mock-complete` | 本地 Mock 模拟 Webhook 完成支付 |

生产环境由 Stripe Webhook `POST /api/billing/webhook` 处理；入账 credits 后，对外查询接口仍返回换算后的 `balance_usd`。
