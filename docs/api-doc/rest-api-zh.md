# Varo — genflow-api REST API 文档

视频生成 API 中转服务。客户端使用 `sk_live_` API Key 调用视频生成接口，使用 JWT 调用控制台接口，服务端负责鉴权、credit 计费，并将请求转发至 BytePlus Ark（Seedance / Dreamina）完成视频生成。

- Base URL：部署相关，形如 `https://<your-host>`
- 交互式文档（Swagger）：`<Base URL>/docs`
- 拆分文档：[认证 API（邮箱 OTP 登录）](./auth-zh.md) ｜ [计费 / Stripe API](./stripe-zh.md)

本文档涵盖：API Key、账户余额、用量、模型、用户资料、视频生成（`/v1`、`/v2`）及健康检查。认证流程见 [认证 API](./auth-zh.md)，充值流程见 [计费 / Stripe API](./stripe-zh.md)。

---

## 认证方式

| 方式 | 格式 | 适用接口 |
|---|---|---|
| JWT | `Authorization: Bearer <access_token>` | 控制台接口（`/api/*`，`/api/auth` 除外） |
| API Key | `Authorization: Bearer sk_live_...` | 视频生成代理接口（`/v1/*`、`/v2/*`） |

- JWT 通过邮箱验证码（OTP）流程获取，详见 [认证 API](./auth-zh.md)。access token 有效期 15 分钟，refresh token 有效期 7 天（滑动续期）。
- `sk_live_` API Key 永久有效，除非主动撤销。
- 部分接口公开无需认证：`GET /api/billing/config`、`GET /api/billing/packages`、`GET /v1/models`、`GET /healthz`。

---

## API Key 接口

以下接口均需 JWT 认证。

### POST /api/api-keys

生成一个新的 `sk_live_` API Key。完整 key 仅在本次响应中返回一次，请立即保存。

**响应 200**
```json
{
  "id": "uuid",
  "key": "sk_live_abc123...",
  "prefix": "sk_live_1f78",
  "created_at": "2026-06-11T11:56:41Z"
}
```

---

### GET /api/api-keys

查询当前用户所有有效的 API Key。只返回前缀，不返回完整 key。

**响应 200**
```json
[
  {
    "id": "uuid",
    "prefix": "sk_live_1f78",
    "created_at": "2026-06-11T11:56:41Z",
    "is_active": true
  }
]
```

---

### DELETE /api/api-keys/{key_id}

撤销一个 API Key。

**响应 200**
```json
{ "revoked": true }
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 404 | Key 不存在或不属于当前用户 |

---

## 账户余额接口

### GET /api/billing/balance

查询当前用户的 credit 余额。充值流程见 [计费 / Stripe API](./stripe-zh.md)。

**认证方式：** JWT

**响应 200**
```json
{ "balance": 1750 }
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 404 | 用户不存在 |

---

### POST /api/admin/credits/topup

为指定用户充值 credits（原子增加）。调用方需具有 `admin` 角色。

**认证方式：** JWT（仅管理员）

**请求体**
```json
{
  "user_id": "uuid",
  "amount": 1000
}
```

**响应 200**
```json
{
  "user_id": "uuid",
  "new_balance": 2750
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 403 | 非管理员账号 |
| 404 | 目标用户不存在 |

---

## 用量接口

### GET /api/usage

查询当前用户的视频生成记录，按时间倒序排列。

**认证方式：** JWT

**查询参数**
| 参数 | 默认值 | 说明 |
|---|---|---|
| `limit` | 50 | 最大返回条数（1–200） |
| `offset` | 0 | 分页偏移量 |

**响应 200**
```json
[
  {
    "task_id": "cgt-20260611195952-9l74f",
    "model": "seedance-1-5-pro-251215",
    "duration": 5,
    "credits_consumed": 200,
    "status": "queued",
    "created_at": "2026-06-11T11:59:52Z"
  }
]
```

---

## 模型接口

模型列表与计费费率来自数据库 `config` 表（`model_rates`），可通过 SQL 调整。

### GET /api/models

查询所有可用模型及对应计费费率。

**认证方式：** JWT

**响应 200**
```json
[
  { "id": "seedance-1-5-pro-251215", "credits_per_second": 40, "active": true },
  { "id": "dreamina-seedance-2-0-260128", "credits_per_second": 50, "active": true },
  { "id": "dreamina-seedance-2-0-fast-260128", "credits_per_second": 30, "active": true }
]
```

---

### GET /api/models/{model_id}

查询单个模型详情。

**认证方式：** JWT

**响应 200**
```json
{ "id": "seedance-1-5-pro-251215", "credits_per_second": 40, "active": true }
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 404 | 模型不存在 |

---

## 用户资料接口

### GET /api/user/profile

查询当前登录用户的个人信息及余额。

**认证方式：** JWT

**响应 200**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user",
  "balance": 1750,
  "created_at": "2026-06-01T00:00:00Z"
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 404 | 用户不存在 |

---

## 视频生成接口（代理 `/v2`）

以下接口均需 `sk_live_` API Key。

支持的模型与计费费率（来自 `config` 表）：

| 模型 | 每秒消耗 credits |
|---|---|
| `seedance-1-5-pro-251215` | 40 |
| `dreamina-seedance-2-0-260128` | 50 |
| `dreamina-seedance-2-0-fast-260128` | 30 |

费用 = 每秒 credits × 时长。例如 5 秒 `seedance-1-5-pro-251215` 视频消耗 200 credits。

> **计费与退款：** credits 在提交任务时扣除。若上游生成未能开始（如上游报错、网络错误、返回非 2xx），已扣除的 credits 会**自动退还**。

### POST /v2/generate

提交视频生成任务。请求体按 BytePlus 的 `content` 数组格式**透传**（调用方负责构造上游所需结构）。

**请求体**
```json
{
  "model": "seedance-1-5-pro-251215",
  "content": [
    { "type": "text", "text": "一只猫在花园里散步" }
  ],
  "duration": 5
}
```

**响应 200**
```json
{
  "task_id": "cgt-20260611195952-9l74f",
  "upstream": { "id": "cgt-20260611195952-9l74f" }
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 400 | 不支持的模型 |
| 401 | API Key 无效或缺失 |
| 402 | Credits 余额不足 |
| 500 | `ARK_API_KEY` 未配置（已退款） |
| 502 | 上游请求失败（已退款） |
| 其它 | 透传上游状态码（如 401/404，已退款） |

---

### GET /v2/status

查询视频生成任务的状态，直接透传上游响应。仅可查询属于当前 API Key 所属用户的任务。

**查询参数**
| 参数 | 必填 | 说明 |
|---|---|---|
| `task_id` | 是 | `/v2/generate` 返回的任务 ID |

**响应 — 生成中**
```json
{
  "id": "cgt-20260611195952-9l74f",
  "model": "seedance-1-5-pro-251215",
  "status": "running"
}
```

**响应 — 生成成功**
```json
{
  "id": "cgt-20260611195952-9l74f",
  "status": "succeeded",
  "content": { "video_url": "https://..." },
  "duration": 5,
  "resolution": "720p",
  "ratio": "9:16",
  "framespersecond": 24
}
```

`video_url` 为签名 URL，有效期 **24 小时**。

**错误码**
| 状态码 | 原因 |
|---|---|
| 401 | API Key 无效或缺失 |
| 404 | 任务不存在或不属于当前用户 |

---

## OpenAI 兼容接口（`/v1`）

`/v1` 路由提供与 OpenAI API 格式兼容的视频生成接口，可直接使用 OpenAI Python 客户端或任何支持 OpenAI API 格式的工具对接。

**认证方式：** `sk_live_` API Key，与 `/v2/*` 相同。`GET /v1/models` 无需认证。

计费与退款规则同 `/v2`：credits 在提交时扣除，上游未能开始生成时自动退还。

### GET /v1/models

获取可用模型列表（来自 `config` 表）。

**响应 200**
```json
{
  "object": "list",
  "data": [
    { "id": "seedance-1-5-pro-251215", "object": "model", "owned_by": "varo" },
    { "id": "dreamina-seedance-2-0-260128", "object": "model", "owned_by": "varo" },
    { "id": "dreamina-seedance-2-0-fast-260128", "object": "model", "owned_by": "varo" }
  ]
}
```

---

### POST /v1/videos/generations

提交视频生成任务。`prompt` 字段在内部会映射为 BytePlus 的 `content[0].text`。

**请求体**
```json
{
  "model": "seedance-1-5-pro-251215",
  "prompt": "一只猫在花园里散步",
  "duration": 5
}
```

**响应 200**
```json
{
  "id": "cgt-20260611195952-9l74f",
  "object": "video.generation",
  "created": 1749600000,
  "model": "seedance-1-5-pro-251215",
  "status": "queued"
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 400 | 不支持的模型 |
| 401 | API Key 无效或缺失 |
| 402 | Credits 余额不足 |
| 500 | `ARK_API_KEY` 未配置（已退款） |
| 502 | 上游请求失败（已退款） |

---

### GET /v1/videos/generations/{id}

查询视频生成任务的状态。仅可查询属于当前 API Key 所属用户的任务。

**响应 — 排队中 / 生成中**
```json
{
  "id": "cgt-20260611195952-9l74f",
  "object": "video.generation",
  "created": 1749600000,
  "model": "seedance-1-5-pro-251215",
  "status": "running"
}
```

**响应 — 生成成功**
```json
{
  "id": "cgt-20260611195952-9l74f",
  "object": "video.generation",
  "created": 1749600000,
  "model": "seedance-1-5-pro-251215",
  "status": "succeeded",
  "url": "https://..."
}
```

`url` 为签名 URL，有效期 **24 小时**。

**响应 — 生成失败**
```json
{
  "id": "cgt-20260611195952-9l74f",
  "object": "video.generation",
  "created": 1749600000,
  "model": "seedance-1-5-pro-251215",
  "status": "failed",
  "error": { "message": "Generation failed" }
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 401 | API Key 无效或缺失 |
| 404 | 任务不存在或不属于当前用户 |

---

### Python 调用示例（OpenAI SDK）

先安装依赖：`pip install openai httpx`

```python
import time
import httpx
from openai import OpenAI

API_KEY = "sk_live_..."
BASE = "https://<your-host>/v1"

client = OpenAI(api_key=API_KEY, base_url=BASE)
headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# 查询模型列表 — 可直接使用 OpenAI SDK 原生方法
for m in client.models.list().data:
    print(m.id)

# 提交生成任务并轮询状态
with httpx.Client(timeout=30) as http:
    resp = http.post(
        f"{BASE}/videos/generations",
        headers=headers,
        json={
            "model": "seedance-1-5-pro-251215",
            "prompt": "一只猫在花园里散步",
            "duration": 5,
        },
    )
    task_id = resp.json()["id"]

    while True:
        s = http.get(f"{BASE}/videos/generations/{task_id}", headers=headers).json()
        print("状态：", s["status"])
        if s["status"] == "succeeded":
            print("视频链接：", s["url"])
            break
        if s["status"] == "failed":
            print("错误：", s["error"]["message"])
            break
        time.sleep(10)
```

---

## 健康检查

### GET /healthz

无需认证。

**响应 200**
```json
{ "status": "ok" }
```
