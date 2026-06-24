# Varo — genflow-api 计费 / Stripe API 文档

通过 Stripe Checkout 充值 credits。用户选择套餐后跳转至 Stripe 托管支付页完成付款，Stripe 通过 Webhook 通知服务端为用户增加 credits。credits 用于视频生成计费。

- Base URL：部署相关，形如 `https://<your-host>`
- 相关文档：[认证 API](./auth-zh.md) ｜ [其余 REST API](./rest-api-zh.md)

---

## 用户充值流程

```
1. GET  /api/billing/config        -> 获取 Stripe publishable key（前端挂载 Stripe.js 用，公开）
2. GET  /api/billing/packages      -> 获取可购买套餐及价格（公开）
3. POST /api/billing/checkout      (JWT) { package } -> 创建 Checkout Session，
                                      返回 checkout_url，并写入一条 pending 交易记录
4. 前端将用户跳转至 checkout_url（Stripe 托管支付页）完成支付
5. Stripe 异步回调 POST /api/billing/webhook
      服务端验证签名 -> 原子地将交易置为 completed -> 为用户增加 credits
6. GET  /api/billing/transactions  (JWT) -> 查看充值历史
   GET  /api/billing/balance       (JWT) -> 查看最新 credits 余额（见“其余 REST API”文档）
```

要点：

- **credits 入账以 Webhook 为准**，而非 `checkout` 调用本身。前端跳转回 `success_url` 后，余额可能因 Webhook 尚未送达而短暂未更新。
- Webhook 幂等：通过条件更新（`UPDATE ... WHERE status='pending'`）保证同一笔支付不会重复计费，Stripe 重复投递不会重复加 credits。
- 套餐的「金额 → credits」比例来自数据库 `config` 表（`credit_packages`），可通过 SQL 调整，无需改代码。Stripe 价格 ID 由环境变量 `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO` / `STRIPE_PRICE_BUSINESS` 提供。

---

## 接口

### GET /api/billing/config

返回前端挂载 Stripe.js 所需的 publishable key。**公开接口，无需认证**（publishable key 本就可公开）。

**响应 200**
```json
{ "publishable_key": "pk_test_..." }
```

---

### GET /api/billing/packages

获取可购买的 credits 套餐列表。**公开接口，无需认证**（用于价格页）。

**响应 200**
```json
[
  { "id": "starter",  "price_usd": 10, "credits": 1000 },
  { "id": "pro",      "price_usd": 25, "credits": 3000 },
  { "id": "business", "price_usd": 50, "credits": 7000 }
]
```

---

### POST /api/billing/checkout

为选定套餐创建 Stripe Checkout Session，并写入一条 `pending` 交易记录。

**认证方式：** JWT

**请求体**
```json
{ "package": "starter" }
```

`package` 取值须为 `starter`、`pro`、`business` 之一。

**响应 200**
```json
{ "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_..." }
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 400 | 套餐名称不合法 |
| 401 | 未认证或 token 无效 |
| 500 | `STRIPE_SECRET_KEY` 未配置 |

---

### POST /api/billing/webhook

Stripe Webhook 接收端点。验证 `Stripe-Signature` 请求头，仅处理 `checkout.session.completed` 事件：原子地将对应交易由 `pending` 置为 `completed`，并按套餐为用户增加 credits。**无需 JWT**，安全性由 Stripe 签名保证。

**请求头**
| 请求头 | 说明 |
|---|---|
| `Stripe-Signature` | Stripe 生成的 HMAC 签名，使用 `STRIPE_WEBHOOK_SECRET` 校验 |

**响应 200**
```json
{ "received": true }
```

> 非 `checkout.session.completed` 事件、已完成或未知的交易，同样返回 `{ "received": true }` 且不重复计费。

**错误码**
| 状态码 | 原因 |
|---|---|
| 400 | Stripe 签名验证失败 |
| 500 | `STRIPE_WEBHOOK_SECRET` 未配置 |

---

### GET /api/billing/transactions

查询当前用户的充值历史，按时间倒序排列。

**认证方式：** JWT

**响应 200**
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

---

## 本地 / 沙箱测试

1. 在 Stripe 沙箱（test mode）创建产品与价格，将价格 ID 填入 `.env` 的 `STRIPE_PRICE_*`。
2. `.env` 配置 `STRIPE_SECRET_KEY`（`sk_test_...`）、`STRIPE_PUBLISHABLE_KEY`（`pk_test_...`）。
3. 转发 Webhook 并获取 `whsec_...` 填入 `STRIPE_WEBHOOK_SECRET`：
   ```bash
   stripe listen --forward-to localhost:8000/api/billing/webhook
   ```
4. 用测试卡 `4242 4242 4242 4242`（任意未来有效期、任意 CVC）完成支付。

支付成功后，Webhook 会为用户增加对应套餐的 credits，可通过 `GET /api/billing/balance` 验证。
