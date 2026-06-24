# 自动充值 API 草案（建议后端实现）

> 状态：草案，供后端评审  
> 关联：[`billing-backend-gaps.md`](./billing-backend-gaps.md)  
> 前端页面：`src/views/billing/BillingView.vue` 右侧「自动充值」面板

---

## 1. 业务目标

当用户 credits 余额低于设定阈值时，系统自动使用已保存的 Stripe 支付方式，按指定套餐发起扣款并充值 credits，避免 API 调用因余额不足中断。

**约束：**
- 仅支持 Stripe（与当前手动充值一致）
- 充值金额必须为固定套餐（`starter` / `pro` / `business`），不支持任意金额
- 阈值与充值量均以 **credits** 为单位，与计费体系一致

---

## 2. 用户流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 用户首次开启自动充值                                        │
│    → 若无已保存支付方式，跳转 Stripe Setup / Checkout setup   │
│    → 保存 PaymentMethod 到 Stripe Customer                   │
├─────────────────────────────────────────────────────────────┤
│ 2. 用户配置阈值 + 套餐，调用 PUT /api/billing/auto-top-up     │
├─────────────────────────────────────────────────────────────┤
│ 3. 余额扣减后（或定时任务）检测 balance < threshold_credits   │
│    → 创建 off-session PaymentIntent 或使用 Stripe Billing     │
│    → 成功后 Webhook 入账 credits（复用现有 topup 逻辑）        │
│    → 失败则标记 auto_top_up 为 suspended 并通知用户           │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 数据模型（建议）

### `user_auto_top_up` 表

| 列 | 类型 | 说明 |
|---|---|---|
| `user_id` | uuid PK | 用户 |
| `enabled` | boolean | 是否启用 |
| `threshold_credits` | int | 低于此值触发充值 |
| `package_id` | varchar | `starter` / `pro` / `business` |
| `stripe_customer_id` | varchar | Stripe Customer ID |
| `payment_method_id` | varchar \| null | 默认支付方式 |
| `status` | enum | `active` / `suspended` / `pending_payment_method` |
| `last_triggered_at` | timestamptz \| null | 上次触发时间 |
| `updated_at` | timestamptz | |

### `status` 说明

| 值 | 含义 |
|---|---|
| `active` | 正常，可自动触发 |
| `pending_payment_method` | 已开启但尚未绑定支付方式 |
| `suspended` | 连续扣款失败，已暂停 |

---

## 4. API 接口

### 4.1 查询自动充值配置

```
GET /api/billing/auto-top-up
```

**认证：** JWT

**响应 200**

```json
{
  "enabled": false,
  "threshold_credits": 500,
  "package_id": "starter",
  "status": "pending_payment_method",
  "payment_method": {
    "brand": "visa",
    "last4": "4242",
    "exp_month": 12,
    "exp_year": 2028
  }
}
```

| 字段 | 说明 |
|---|---|
| `enabled` | 用户是否开启自动充值 |
| `threshold_credits` | 触发阈值（credits） |
| `package_id` | 自动购买的套餐 |
| `status` | 见数据模型 |
| `payment_method` | 已保存卡信息摘要；未绑定时为 `null` |

---

### 4.2 更新自动充值配置

```
PUT /api/billing/auto-top-up
```

**认证：** JWT

**请求体**

```json
{
  "enabled": true,
  "threshold_credits": 500,
  "package_id": "starter"
}
```

| 字段 | 必填 | 校验 |
|---|---|---|
| `enabled` | 是 | boolean |
| `threshold_credits` | 当 `enabled=true` | 正整数，建议 ≥ 100 |
| `package_id` | 当 `enabled=true` | 须为有效套餐 ID |

**响应 200** — 同 `GET` 响应结构。

**错误码**

| 状态码 | 原因 |
|---|---|
| 400 | 参数非法、套餐不存在、阈值过低 |
| 401 | 未认证 |
| 409 | 开启自动充值但未绑定支付方式（可返回 `setup_url` 引导绑卡） |

**开启但未绑卡时的 409 响应示例：**

```json
{
  "code": "payment_method_required",
  "message": "A saved payment method is required for auto top-up.",
  "setup_url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

---

### 4.3 绑定支付方式（Setup Session）

```
POST /api/billing/payment-method/setup
```

**认证：** JWT

**请求体**

```json
{
  "success_url": "https://varo.cloud/en/billing?setup=success",
  "cancel_url": "https://varo.cloud/en/billing?setup=cancelled"
}
```

**响应 200**

```json
{
  "setup_url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**说明：** 使用 Stripe Checkout `mode=setup` 或 SetupIntent，将 PaymentMethod 关联到用户的 Stripe Customer。成功后 Webhook `setup_intent.succeeded` 更新 `payment_method_id`。

---

### 4.4 删除已保存支付方式

```
DELETE /api/billing/payment-method
```

**认证：** JWT

**响应 200**

```json
{
  "removed": true
}
```

**副作用：** 若自动充值已开启，应将 `status` 置为 `pending_payment_method` 或自动 `enabled=false`。

---

### 4.5 账单摘要中的嵌套字段（可选）

若实现 `GET /api/billing/summary`，`auto_top_up` 可嵌入：

```json
{
  "enabled": false,
  "threshold_credits": 500,
  "package_id": "starter",
  "status": "active"
}
```

---

## 5. 触发逻辑（服务端）

### 触发时机（二选一或组合）

1. **同步触发（推荐）：** 每次 credits 扣减后，若 `balance < threshold_credits` 且 `enabled` 且 `status=active`，尝试自动充值。
2. **定时扫描：** 每 N 分钟扫描符合条件的用户（注意并发与幂等）。

### 防重复

- 同一用户设置 `cooldown`（如 5 分钟内不重复触发）
- 自动充值交易标记 `source: "auto_top_up"`，写入 transactions 表
- Webhook 幂等规则与手动充值相同

### Stripe 实现建议

```text
stripe.PaymentIntent.create(
  amount=package.price_usd * 100,
  currency='usd',
  customer=stripe_customer_id,
  payment_method=payment_method_id,
  off_session=True,
  confirm=True,
  metadata={ user_id, package_id, type: 'auto_top_up' }
)
```

扣款成功后走与 Checkout 相同的入账逻辑（增加 credits、写 transaction）。

### 失败处理

| 场景 | 处理 |
|---|---|
| 卡被拒 | `status → suspended`，发邮件/站内通知 |
| 3DS 需要验证 | off-session 可能失败，暂停并通知用户手动充值或重新绑卡 |
| 连续失败 ≥ 3 次 | 自动 `enabled=false` |

---

## 6. Webhook 扩展

在现有 `checkout.session.completed` 之外，建议监听：

| 事件 | 用途 |
|---|---|
| `setup_intent.succeeded` | 保存支付方式 |
| `payment_intent.succeeded` | 自动充值扣款成功入账 |
| `payment_intent.payment_failed` | 暂停自动充值 |

---

## 7. 与前端当前实现的差异

| 项目 | 前端现状 | 本草案 |
|---|---|---|
| 阈值单位 | USD（`thresholdUsd`） | **credits**（`threshold_credits`） |
| 充值金额 | 自定义 USD（`topUpAmountUsd`） | **固定套餐**（`package_id`） |
| 绑卡 | 「Add Card」占位 | 需 `POST /payment-method/setup` |
| 查询接口 | 从 `summary` 读取 | 独立 `GET /auto-top-up` |
| 保存接口 | `POST /auto-top-up` | 建议 `PUT /auto-top-up` |

**前端待后端就绪后调整：**
1. 阈值输入改为 credits
2. 充值金额改为套餐下拉（与左侧手动充值套餐一致）
3. 开启时若无支付方式，跳转 `setup_url`
4. 展示已绑卡信息（`Visa ••4242`）

---

## 8. 安全与合规

- 不存储完整卡号，仅 Stripe Customer / PaymentMethod ID
- `setup_url` / `success_url` 校验域名白名单
- 自动扣款前可在 UI 明确告知用户授权条款
- 管理员可查询用户自动充值状态（内部后台，非本草案范围）

---

## 9. 测试清单

- [ ] 绑卡 → 开启自动充值 → 余额降至阈值以下 → 自动入账
- [ ] 卡被拒 → `status=suspended` → 前端展示暂停状态
- [ ] 重复 Webhook 不重复入账
- [ ] 关闭自动充值后不再触发
- [ ] 删除支付方式后自动充值失效
- [ ] cooldown 内不重复扣款
