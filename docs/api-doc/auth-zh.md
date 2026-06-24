# Varo — genflow-api 认证 API 文档

无密码（邮箱 OTP）认证。用户通过邮箱接收一次性验证码登录，服务端颁发 JWT access token 与可轮换的 refresh token。系统无密码，账号在首次验证验证码时自动创建。

- Base URL：部署相关，形如 `https://<your-host>`
- 交互式文档（Swagger）：`<Base URL>/docs`
- 相关文档：[计费 / Stripe API](./stripe-zh.md) ｜ [其余 REST API](./rest-api-zh.md)

---

## 令牌模型

| 令牌 | 用途 | 有效期 |
|---|---|---|
| access token（JWT） | 调用控制台接口（`/api/*`，`/api/auth` 除外） | **15 分钟** |
| refresh token | 换取新的 access token | **7 天，滑动续期** |

- access token 通过 `Authorization: Bearer <access_token>` 传递，claims 含 `sub`（用户 ID）与 `role`。
- refresh token 为高熵随机串，服务端仅存其 SHA-256 哈希。每次刷新都会**颁发新 token 并立即撤销旧 token**（轮换），每次刷新有效期顺延 7 天。
- 视频生成接口使用的 `sk_live_` API Key 与本流程无关，详见 [其余 REST API](./rest-api-zh.md)。

---

## 用户流程

### 注册 / 登录（同一流程）

```
1. POST /api/auth/request-otp   { email }            -> 发送 6 位验证码到邮箱
2. 用户从邮件获取验证码（开发环境下验证码输出到服务器日志）
3. POST /api/auth/verify-otp    { email, code }      -> 返回 access_token + refresh_token
   首次登录的邮箱会自动创建账号（初始 credits 余额为 0）
4. 用 access_token 调用控制台接口（Authorization: Bearer <access_token>）
```

### 维持会话

```
access token 过期（15 分钟）后：
  POST /api/auth/refresh   { refresh_token }   -> 返回新的 access_token + refresh_token
  注意：旧 refresh token 立即失效，请用返回的新 refresh token 替换本地存储。

若 refresh token 也已过期（超过 7 天未刷新）：
  需重新走 request-otp / verify-otp 登录流程。
```

### 退出登录

```
POST /api/auth/logout   { refresh_token }   -> 撤销该 refresh token
```

---

## 接口

### POST /api/auth/request-otp

向指定邮箱发送 6 位验证码。验证码有效期 **10 分钟**，同一邮箱 **15 分钟内最多请求 3 次**。无论邮箱是否已注册，响应均为 `{ "sent": true }`（避免账号枚举）。

**请求体**
```json
{ "email": "user@example.com" }
```

**响应 200**
```json
{ "sent": true }
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 422 | 邮箱格式不合法 |
| 429 | 请求过于频繁（15 分钟内超过 3 次） |

> 开发环境（`EMAIL_DRIVER=log`）下验证码会以 `INFO genflow: OTP for <email>: <code>` 形式输出到服务器日志；生产环境（`EMAIL_DRIVER=smtp`）通过邮件发送。

---

### POST /api/auth/verify-otp

校验验证码，成功后返回 access token 与 refresh token。验证码**单次有效**，最多允许 **5 次错误尝试**。若邮箱首次登录，则自动创建账号（初始 credits 余额为 0）。

**请求体**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**响应 200**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "token_type": "bearer"
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 400 | 验证码无效、已过期或错误次数过多 |
| 422 | 邮箱格式不合法 |

---

### POST /api/auth/refresh

用 refresh token 换取新的 access token 与 refresh token，旧 refresh token 立即失效（轮换）。

**请求体**
```json
{ "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..." }
```

**响应 200**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "bmV3cmVmcmVzaHRva2Vu...",
  "token_type": "bearer"
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 401 | refresh token 无效、已撤销或已过期 |

---

### POST /api/auth/logout

撤销指定 refresh token，使其立即失效。

**请求体**
```json
{ "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..." }
```

**响应 200**
```json
{ "revoked": true }
```
