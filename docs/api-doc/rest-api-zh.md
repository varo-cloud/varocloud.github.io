# Varo — genflow-api REST API 文档

视频生成 API 中转服务。客户端使用 `sk_live_` API Key 调用视频生成接口，使用 JWT 调用控制台接口，服务端负责鉴权、credit 计费，并将请求转发至上游（Seedance / Dreamina）完成视频生成。

- Base URL：部署相关，形如 `https://<your-host>`
- 交互式文档（Swagger）：`<Base URL>/docs`
- 拆分文档：[认证 API（邮箱 OTP 登录）](./auth-zh.md) ｜ [计费 / Stripe API](./stripe-zh.md)

本文档涵盖：通用约定、API Key、账户余额、用量、模型、用户资料、计费与定价、视频生成（`/v1`、`/v2`）及健康检查。认证流程见 [认证 API](./auth-zh.md)，充值流程见 [计费 / Stripe API](./stripe-zh.md)。

---

## 通用约定

### 响应信封

所有 `/api/*` 接口（**含 `/api/auth`**）的成功响应统一包裹为：

```json
{ "code": 0, "message": "ok", "data": <实际数据> }
```

错误响应：

```json
{ "code": <HTTP 状态码>, "message": "<本地化错误信息>", "data": null }
```

- 为简洁起见，下文各接口的「响应」示例展示的是 `data` 字段内容，外层信封省略。
- `/v1/*`、`/v2/*` 代理接口与 `GET /healthz` **不**使用信封，返回原生结构（与 OpenAI / 上游格式兼容）。

### 时间戳

所有时间字段（如 `created_at`）均为 **13 位 Unix 毫秒时间戳整数（UTC）**，例如 `1781179001000`，不再返回 ISO8601 字符串。`/v1` 任务对象的 `created_at` 同样为毫秒整数。

### 多语言

通过请求头 `X-Locale`（优先）或 `Accept-Language` 选择语言，支持 `en-US`（默认）与 `zh-CN`。影响错误响应的 `message` 文案与 OTP 邮件语言。

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

**响应 200（`data`）**
```json
{
  "id": "uuid",
  "key": "sk_live_abc123...",
  "prefix": "sk_live_1f78",
  "created_at": 1781179001000
}
```

---

### GET /api/api-keys

查询当前用户所有有效的 API Key。只返回前缀，不返回完整 key。

**响应 200（`data`）**
```json
[
  {
    "id": "uuid",
    "prefix": "sk_live_1f78",
    "created_at": 1781179001000,
    "is_active": true
  }
]
```

---

### DELETE /api/api-keys/{key_id}

撤销一个 API Key。

**响应 200（`data`）**
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

查询当前用户的余额（美元）。充值流程见 [计费 / Stripe API](./stripe-zh.md)。

**认证方式：** JWT

**响应 200（`data`）**
```json
{ "balance_usd": 17.50 }
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 404 | 用户不存在 |

---

### POST /api/admin/credits/topup

为指定用户充值 credits（原子增加）。调用方需具有 `admin` 角色。`amount` 与 `new_balance` 为内部 credits 单位（1 美元 = 100 credits）。

**认证方式：** JWT（仅管理员）

**请求体**
```json
{
  "user_id": "uuid",
  "amount": 1000
}
```

**响应 200（`data`）**
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

**响应 200（`data`）**
```json
[
  {
    "task_id": "cgt-20260611195952-9l74f",
    "model": "seedance-1-5-pro-251215",
    "duration": 5,
    "cost_usd": 0.13,
    "status": "succeeded",
    "created_at": 1781179001000
  }
]
```

`cost_usd` 为该任务最终消耗的美元金额（任务完成后按实际用量结算，见「计费与定价」）。

---

## 模型接口

模型列表与计费配置来自数据库 `config` 表（`model_rates`），可通过 SQL 调整。

### GET /api/models

查询所有可用模型及其支持的分辨率与计费模式。

**认证方式：** JWT

**响应 200（`data`）**
```json
[
  {
    "id": "seedance-1-5-pro-251215",
    "resolutions": ["480p", "720p", "1080p"],
    "mode": "audio",
    "active": true
  },
  {
    "id": "dreamina-seedance-2-0-260128",
    "resolutions": ["480p", "720p", "1080p", "4k"],
    "mode": "video",
    "active": true
  },
  {
    "id": "dreamina-seedance-2-0-fast-260128",
    "resolutions": ["480p", "720p"],
    "mode": "video",
    "active": true
  }
]
```

`mode` 决定费率结构：`audio` 模型按「有/无音频」计费，`video` 模型按「分辨率 + 有/无参考视频」计费。具体见「计费与定价」。

---

### GET /api/models/{model_id}

查询单个模型详情。

**认证方式：** JWT

**响应 200（`data`）**
```json
{
  "id": "seedance-1-5-pro-251215",
  "resolutions": ["480p", "720p", "1080p"],
  "mode": "audio",
  "active": true
}
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

**响应 200（`data`）**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user",
  "balance_usd": 17.50,
  "created_at": 1780358400000
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 404 | 用户不存在 |

---

## 计费与定价

费用基于「token」按分辨率与时长动态计算，而非固定的「每秒 credits」。

### 计算公式

```
width, height = 分辨率与画幅(ratio) 对应的像素尺寸
tokens  = (input_video_seconds + duration) × width × height × fps ÷ 1024   （整除）
credits = max(1, ceil(rate × tokens ÷ 10000))
cost_usd = credits ÷ 100
```

- `rate` 由模型的 `mode` 与请求参数决定：
  - `mode = "audio"`：请求含音频取 `audio` 费率，否则取 `silent` 费率。
  - `mode = "video"`：取 `rate[resolution]` 下的 `with_video`（含参考视频输入）或 `no_video`（纯文生视频）。
- 画幅尺寸来自上游维度表（如 `720p / 16:9 = 1248×704`）；`4k` 按对应 `1080p` 尺寸的 2 倍推导。

> 示例：`720p / 16:9`、`fps=24`、`duration=5`、纯文生视频，`width×height = 1248×704`，
> `tokens = 5 × 1248 × 704 ÷ 1024 = 102960`。再乘以模型费率即得 credits。

### 生成参数

`/v1` 与 `/v2` 的生成请求均支持以下计费相关参数（缺省值如下）：

| 参数 | 默认值 | 说明 |
|---|---|---|
| `duration` | 5 | 输出时长（秒） |
| `resolution` | `720p` | 必须属于该模型的 `resolutions` |
| `ratio` | `16:9` | 画幅，支持 `16:9` / `4:3` / `1:1` / `21:9` |
| `fps` | 24 | 帧率，须为正整数 |
| `audio` | 无 | 为真时按音频费率计（audio 模型） |
| `input_video_seconds` | 0 | 参考视频时长，计入 token |

非法的 `resolution` 或 `fps` 返回 **400**。

### 扣费与结算

- **提交即预扣**：提交任务时按上述公式预估并扣除 credits。
- **失败全额退款**：若上游生成未能开始（上游报错、网络错误、非 2xx），预扣的 credits **自动全额退还**。
- **成功后对账**：任务成功后，按上游返回的实际 `completion_tokens` 重新结算一次，多扣退还、少扣补收（幂等，仅结算一次）。最终金额体现在 `GET /api/usage` 的 `cost_usd`。

---

## 视频生成接口（代理 `/v2`）

以下接口均需 `sk_live_` API Key。请求体按上游的 `content` 数组格式**透传**（调用方负责构造上游所需结构）。计费规则见「计费与定价」。

> `/v2/*` 不使用响应信封，直接返回原生结构。

### POST /v2/generate

提交视频生成任务。

**请求体**
```json
{
  "model": "seedance-1-5-pro-251215",
  "content": [
    { "type": "text", "text": "一只猫在花园里散步" }
  ],
  "duration": 5,
  "resolution": "720p",
  "ratio": "16:9",
  "fps": 24
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
| 400 | 不支持的模型，或生成参数非法 |
| 401 | API Key 无效或缺失 |
| 402 | 余额不足 |
| 500 | 模型上游未配置（`base_url` 或对应密钥环境变量缺失，已退款） |
| 502 | 上游请求失败（已退款） |
| 其它 | 透传上游状态码（如 401/404，已退款） |

---

### GET /v2/status

查询视频生成任务的状态，直接透传上游响应。仅可查询属于当前 API Key 所属用户的任务。任务成功时触发一次对账结算。

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
| 500 | 模型上游未配置 |
| 502 | 上游请求失败 |

---

## OpenAI 兼容接口（`/v1`）

`/v1` 路由提供与 OpenAI API 格式兼容的视频生成接口，可直接使用 OpenAI Python 客户端或任何支持 OpenAI API 格式的工具对接。

**认证方式：** `sk_live_` API Key，与 `/v2/*` 相同。`GET /v1/models` 无需认证。计费与结算规则同 `/v2`。

> `/v1/*` 不使用响应信封；时间字段 `created_at` 为毫秒整数。

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

提交视频生成任务。`prompt` 字段在内部会映射为上游的 `content[0].text`。

**请求体**
```json
{
  "model": "seedance-1-5-pro-251215",
  "prompt": "一只猫在花园里散步",
  "duration": 5,
  "resolution": "720p",
  "ratio": "16:9",
  "fps": 24
}
```

**响应 200**
```json
{
  "id": "cgt-20260611195952-9l74f",
  "object": "video.generation",
  "created_at": 1781179001000,
  "model": "seedance-1-5-pro-251215",
  "status": "queued"
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 400 | 不支持的模型，或生成参数非法 |
| 401 | API Key 无效或缺失 |
| 402 | 余额不足 |
| 500 | 模型上游未配置（已退款） |
| 502 | 上游请求失败（已退款） |

---

### GET /v1/videos/generations/{id}

查询视频生成任务的状态。仅可查询属于当前 API Key 所属用户的任务。

**响应 — 排队中 / 生成中**
```json
{
  "id": "cgt-20260611195952-9l74f",
  "object": "video.generation",
  "created_at": 1781179001000,
  "model": "seedance-1-5-pro-251215",
  "status": "running"
}
```

**响应 — 生成成功**
```json
{
  "id": "cgt-20260611195952-9l74f",
  "object": "video.generation",
  "created_at": 1781179001000,
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
  "status": "failed",
  "error": { "message": "Generation failed" }
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 401 | API Key 无效或缺失 |
| 404 | 任务不存在或不属于当前用户 |
| 500 | 模型上游未配置 |
| 502 | 上游请求失败 |

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
            "resolution": "720p",
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

无需认证。不使用响应信封。

**响应 200**
```json
{ "status": "ok" }
```