# 充值页接口对比（前端 vs 后端文档）

> 对比基准  
> - 前端：`src/views/billing/BillingView.vue`、`src/api/billing.ts`  
> - 后端：`docs/api-doc/rest-api-zh.md`、`docs/api-doc/stripe-zh.md`  
> - 日期：2026-06-22

---

## 总览

| 前端调用 | 后端文档 | 状态 |
|---|---|---|
| `GET /api/billing/summary` | 无 | ❌ 缺失 |
| `GET /api/billing/packages` | `GET /api/billing/packages` | ✅ 已覆盖（字段名 snake_case） |
| `GET /api/billing/transactions` | `GET /api/billing/transactions` | ⚠️ 部分覆盖（缺详情字段） |
| `GET /api/billing/records` | 无 | ❌ 缺失 |
| `POST /api/billing/checkout` | `POST /api/billing/checkout` | ⚠️ 部分覆盖（缺回调 URL 参数） |
| `POST /api/billing/checkout/mock-complete` | 无 | 🔧 仅 Mock，生产不需要 |
| `POST /api/billing/auto-top-up` | 无 | ❌ 缺失 |
| `GET /api/billing/config` | `GET /api/billing/config` | ⚠️ 后端有，前端未使用 |
| `GET /api/billing/balance` | `GET /api/billing/balance` | ⚠️ 后端有，前端走 summary 聚合 |
| `GET /api/user/profile` | `GET /api/user/profile` | ⚠️ 部分覆盖（字段差异） |

---

## 1. 账户余额

### 后端已有

**`GET /api/billing/balance`**（JWT）

```json
{ "balance": 1750 }
```

**`GET /api/user/profile`**（JWT）

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user",
  "balance": 1750,
  "created_at": "2026-06-01T00:00:00Z"
}
```

### 前端使用

| 场景 | 前端字段 | 后端字段 | 说明 |
|---|---|---|---|
| Header 余额 | `balance` | `balance` | ✅ 已对齐（credits 整数） |
| 充值页摘要 | `summary.balance` | `balance` | 前端原用 `balanceUsd`，已改为 `balance` |
| 用户资料 | `profile.balance` | `balance` | 前端原用 `balanceUsd`，已改为 `balance` |

**注意：** 后端 `balance` 单位是 **credits**，不是 USD。充值页顶部「余额」应展示 credits，套餐价格仍用 `price_usd`。

---

## 2. 账单摘要 `GET /api/billing/summary`

### 前端期望响应

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

### 后端文档

**无此接口。** 目前仅分别有 `GET /api/billing/balance` 与（待实现的）自动充值接口。

### 字段说明

| 字段 | 充值页用途 | 后端现状 |
|---|---|---|
| `balance` | 顶部余额卡片 | 可用 `GET /api/billing/balance` 替代 |
| `spent_this_month_credits` | 「本月消费」卡片 | ❌ 无 |
| `spent_change_percent` | 环比趋势 `↓ 12%` | ❌ 无 |
| `auto_top_up` | 自动充值开关状态 | ❌ 无（见 `auto-top-up-api-draft.md`） |

> 详见 [`billing-backend-gaps.md`](./billing-backend-gaps.md)

---

## 3. 套餐列表 `GET /api/billing/packages`

### 对比

| 后端字段 | 前端内部字段 | 状态 |
|---|---|---|
| `id` | `id` | ✅ |
| `price_usd` | `priceUsd` | ✅ 已在 `mapCreditPackage` 转换 |
| `credits` | `credits` | ✅ |

**结论：** 仅 snake_case ↔ camelCase 差异，前端 API 层已处理，无需后端改动。

---

## 4. 创建 Checkout `POST /api/billing/checkout`

### 请求体对比

| 字段 | 后端文档 | 前端发送 | 状态 |
|---|---|---|---|
| `package` | ✅ `starter` / `pro` / `business` | ✅ | 一致 |
| `success_url` | ❌ 未文档化 | ✅ 发送 | 需后端支持 |
| `cancel_url` | ❌ 未文档化 | ✅ 发送 | 需后端支持 |

### 响应体对比

| 后端字段 | 前端内部字段 | 状态 |
|---|---|---|
| `checkout_url` | `checkoutUrl` | ✅ 已映射 |

**说明：** 若后端在创建 Session 时自行配置固定 `success_url` / `cancel_url`，需告知前端域名规则；否则应接受前端传入的本地化路径（如 `/en/billing?checkout=success`）。

---

## 5. 充值历史 `GET /api/billing/transactions`

### 后端文档响应

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

### 前端「View 详情」额外需要

| 字段 | 用途 | 后端文档 |
|---|---|---|
| `payment_method` | 支付方式（Stripe） | ❌ |
| `payment_detail` | 卡号尾号 `Visa ••4242` | ❌ |
| `package_id` | 套餐名称 | ❌ |
| `completed_at` | 完成时间 | ❌ |
| `receipt_url` | Stripe 收据链接 | ❌ |

前端 `mapTransaction` 已支持上述字段的 snake_case 映射；后端补充返回即可，无需改前端字段名。

---

## 6. 账单流水 `GET /api/billing/records`

### 前端期望

充值页「Billing」Tab + CSV 导出，每条记录：

```json
{
  "id": "uuid",
  "style": "api",
  "key": "seedance-2.0 · 720p · 8s",
  "api_key": "******BneyZM",
  "amount_credits": -102,
  "created_at": "2026-06-14T14:32:00Z"
}
```

`style` 枚举：`api` | `web` | `topup` | `bonus`

### 后端文档

**无此接口。** 现有 `GET /api/usage` 仅返回视频生成任务，不含充值/赠送等账单流水。

---

## 7. Stripe 配置 `GET /api/billing/config`

```json
{ "publishable_key": "pk_test_..." }
```

后端已文档化，前端当前未调用（Mock 模式不需要 Stripe.js）。若后续做内嵌支付或保存银行卡，需接入此接口。

---

## 8. 自动充值 `POST /api/billing/auto-top-up`

后端文档 **无**。前端充值页右侧面板依赖此接口保存设置。

完整方案见 [`auto-top-up-api-draft.md`](./auto-top-up-api-draft.md)。

---

## 9. 前端已做的字段对齐（2026-06-22）

| 改动 | 文件 |
|---|---|
| `UserProfile.balanceUsd` → `balance` | `src/types/index.ts` |
| Profile API 映射 `balance` | `src/api/auth.ts` |
| `BillingSummary.balanceUsd` → `balance` | `src/types/index.ts` |
| 套餐 / 交易 / 摘要 snake_case 映射 | `src/api/billing.ts` |
| `updateAutoTopUp` 请求体改 snake_case | `src/api/billing.ts` |
| Mock 响应对齐后端字段名 | `mock/auth.ts`、`mock/billing.ts` |

---

## 10. 建议后端优先实现顺序

1. `POST /api/billing/checkout` 支持 `success_url` / `cancel_url`
2. `GET /api/billing/transactions` 补充详情字段
3. `GET /api/billing/summary` 或拆分接口提供本月消费统计
4. `GET /api/billing/records` 账单流水
5. 自动充值全套接口（见草案）
