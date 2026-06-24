# 充值页 — 后端接口缺失清单

> 供后端开发参考。前端充值页：`src/views/billing/BillingView.vue`  
> 对比文档：[`billing-api-comparison.md`](./billing-api-comparison.md)  
> 自动充值草案：[`auto-top-up-api-draft.md`](./auto-top-up-api-draft.md)

---

## P0 — 阻塞联调（手动充值主流程）

### 1. Checkout 回调 URL

**现状：** `stripe-zh.md` 中 `POST /api/billing/checkout` 请求体仅 `{ "package": "starter" }`。

**前端需要：** 创建 Session 时传入本地化回调地址：

```json
{
  "package": "starter",
  "success_url": "https://varo.cloud/en/billing?checkout=success",
  "cancel_url": "https://varo.cloud/en/billing?checkout=cancelled"
}
```

**原因：** 站点支持 `/en`、`/zh` 多语言路由，回调 URL 需由前端按当前 locale 动态生成，不宜写死单一地址。

**建议：** 接受 `success_url` / `cancel_url` 为必填或可选参数；校验域名白名单防止开放重定向。

---

### 2. 交易详情字段

**现状：** `GET /api/billing/transactions` 仅返回 `id`、`amount_usd`、`credits_granted`、`status`、`created_at`。

**前端「View」弹窗还需要：**

| 字段 | 类型 | 说明 |
|---|---|---|
| `payment_method` | string | 固定 `"stripe"` 即可 |
| `payment_detail` | string \| null | 如 `Visa ••4242`，来自 Stripe PaymentIntent |
| `package_id` | string \| null | `starter` / `pro` / `business` |
| `completed_at` | string (ISO8601) \| null | Webhook 完成时间 |
| `receipt_url` | string \| null | Stripe receipt 链接 |

**建议：** 在 `checkout.session.completed` Webhook 处理时从 Stripe Session 写入上述字段。

---

## P1 — 充值页完整体验

### 3. 账单摘要 `GET /api/billing/summary`

充值页顶部三张卡片需要聚合数据，建议新增：

```json
{
  "balance": 1750,
  "spent_this_month_credits": 9628,
  "spent_change_percent": -12,
  "auto_top_up": {
    "enabled": false,
    "threshold_credits": 500,
    "package_id": "starter"
  }
}
```

| 字段 | 说明 |
|---|---|
| `balance` | 当前 credits 余额，同 `GET /api/billing/balance` |
| `spent_this_month_credits` | 本月消耗 credits 总量（绝对值，正整数） |
| `spent_change_percent` | 较上月同期变化百分比，负数表示下降 |
| `auto_top_up` | 自动充值配置，结构见自动充值草案 |

**替代方案：** 不建 summary 接口，由前端分别调用 `balance` + `auto-top-up` + 新「本月消费」接口；会增加请求数。

---

### 4. 账单流水 `GET /api/billing/records`

充值页第二个 Tab「Billing」+ CSV 导出功能需要。

**建议接口：**

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
    "amount_credits": -200,
    "created_at": "2026-06-14T14:32:00Z"
  },
  {
    "id": "uuid",
    "style": "topup",
    "key": "Stripe · Visa ••4242",
    "api_key": null,
    "amount_credits": 1000,
    "created_at": "2026-06-14T13:00:00Z"
  }
]
```

| `style` | 含义 | `amount_credits` 符号 |
|---|---|---|
| `api` | API 调用扣费 | 负数 |
| `web` | 网页 Playground 扣费 | 负数 |
| `topup` | Stripe 充值 | 正数 |
| `bonus` | 赠送 / 活动 | 正数 |

**数据来源建议：**
- `api` / `web`：复用或扩展 `GET /api/usage` 的计费记录
- `topup`：充值交易表
- `bonus`：运营赠送记录（若有）

**与 `GET /api/usage` 的区别：** `usage` 仅视频生成任务；`records` 是用户可见的完整账单流水（含充值）。

---

## P2 — 自动充值（完整新业务）

后端目前 **完全没有** 自动充值相关接口与逻辑。详见 [`auto-top-up-api-draft.md`](./auto-top-up-api-draft.md)。

至少需要：

| 能力 | 说明 |
|---|---|
| 保存支付方式 | Stripe Customer + PaymentMethod（Setup Intent 或 Checkout `mode=setup`） |
| 读写自动充值配置 | 阈值 credits + 触发套餐 |
| 余额监控与触发 | 扣费后或定时任务检测余额 < 阈值时发起 off-session 扣款 |
| 失败处理 | 扣款失败通知用户、暂停自动充值 |

**前端现状：** UI 已存在，但阈值/金额仍用 USD 展示；后端接口就绪后，前端将改为 credits + 套餐选择，与手动充值保持一致。

---

## P3 — 暂未实现的前端占位功能

以下按钮在 UI 中存在，**无对应后端接口**，可后续迭代：

| 功能 | 前端文案 | 需要的大致接口 |
|---|---|---|
| 添加银行卡 | Add Card | Stripe Setup Intent / Customer Portal |
| 添加账单地址 | Add Billing Address | 用户账单地址 CRUD |
| 自动充值（未接后端前） | Enable Auto Top-up | 见自动充值草案 |

---

## 语义对齐提醒

### Credits vs USD

后端计费体系以 **credits** 为核心：
- 余额：`balance`（credits 整数）
- 套餐：同时有 `price_usd` 和 `credits`
- 视频扣费：按 `credits_per_second × duration`

前端已把用户余额字段从 `balanceUsd` 改为 `balance`（credits）。充值页「本月消费」若后端返回 credits，字段名建议用 `spent_this_month_credits`，避免与 USD 混淆。

### 用户资料字段

| 后端有 | 前端有 | 处理 |
|---|---|---|
| `role` | 无 | 前端暂不需要，可忽略 |
| `created_at` | 无 | 前端暂不需要 |
| 无 `name` | `name` | 前端从 email 本地派生，不依赖后端 |

---

## Mock 专用（生产不需要）

| 接口 | 用途 |
|---|---|
| `POST /api/billing/checkout/mock-complete` | 本地 Mock 模拟 Webhook 完成支付 |

生产环境由 Stripe Webhook `POST /api/billing/webhook` 处理，前端不调用 mock-complete。
