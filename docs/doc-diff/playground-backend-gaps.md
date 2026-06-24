# Playground 页面 — 后端缺口说明（合并版）

> 面向后端实现。本文档合并原 `playground-schema` / `playground-upload` / `playground-pricing` / `playground-run` 四份缺口说明，**发给后端只需此一份**。  
> 前端页面：`src/views/models/ModelDetailView.vue`、`src/components/playground/*`  
> 关联文档：  
> - [`rest-api-zh.md`](../api-doc/rest-api-zh.md)（当前 `/v1/videos/generations` 应改为 `/v1/generations`）  
> - [`billing-backend-gaps.md`](./billing-backend-gaps.md)（账单 `style: web | api`、USD）  
> - [`backend-global-adjustments.md`](./backend-global-adjustments.md)（13 位毫秒时间戳、多语言）  
> - [`model-docs-backend-gaps.md`](./model-docs-backend-gaps.md)（API Tab README / FAQ / `api_model_id`）

参考竞品 Schema：[WaveSpeed Seedance 2.0 T2V](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-2.0/text-to-video)

---

## 1. 总览

### 1.1 Playground 能力矩阵

| 能力 | 认证 | 前端状态 | 后端状态 |
|---|---|---|---|
| 动态表单（Input Schema） | 公开 | ✅ UI + Mock | ⏳ 需 `GET .../input-schema` |
| 本地上传（图/视/音） | JWT | ✅ UI + Mock | ❌ 需 `POST /api/upload` |
| Run 按钮实时估价 | 公开 | ✅ UI + Mock | ⏳ 需 `POST .../quote` |
| 表单 / JSON 运行 | JWT | ✅ UI + Mock | ❌ 需 `POST/GET .../playground/generations` |
| HTTP / Python / JS 代码视图 | 用户自备 API Key | ✅ 本地模板 | ⏳ 需对齐 `POST /v1/generations` |

### 1.2 需新增 / 调整的接口一览

| 方法 | 路径 | 认证 | 用途 |
|---|---|---|---|
| `GET` | `/api/models/{model_id}/input-schema` | 公开 | Playground 动态表单 |
| `POST` | `/api/upload` | JWT | 本地上传 → 返回 URL |
| `POST` | `/api/models/{model_id}/quote` | 公开 | Run 按钮动态估价 |
| `POST` | `/api/playground/generations` | JWT | 控制台点击 Run |
| `GET` | `/api/playground/generations/{id}` | JWT | 轮询任务 / 展示结果 |
| `POST` | `/v1/generations` | API Key | 外部集成（OpenAI SDK） |
| `GET` | `/v1/generations/{id}` | API Key | 外部轮询 |

**弃用：** `POST/GET /v1/videos/generations` → 迁移至 `/v1/generations`（路径不含媒介类型）。

### 1.3 典型数据流

```
加载页面
  ├─ GET /api/models/{id}              → 展示信息、api_model_id、per_run_price_usd（占位价）
  └─ GET /api/models/{id}/input-schema → 渲染表单

用户改表单
  └─ debounce POST .../quote           → 更新 Run 按钮 $价格

用户上传文件（可选）
  └─ POST /api/upload                  → url 写入 input 字段

用户点 Run（JWT）
  └─ POST /api/playground/generations  → 扣费 + 创建任务
       └─ GET .../playground/generations/{id} 轮询 → 右侧展示 output.url
```

Quote 与 Run **必须共用同一套计价函数**；上传得到的 `url` 与用户粘贴的 URL 在 Run / Quote 中**等价**。

---

## 2. 设计原则

1. **Schema 与模型详情分离**：详情返回展示/计费字段；Playground 表单单独拉 Schema。
2. **字段命名 snake_case**：与 OpenAPI / JSON Schema 惯例一致。
3. **OpenAI SDK 为一等公民**：外部集成以 `/v1/*` + OpenAI Python/Node SDK 为准。
4. **Playground 走 JWT**：网页 Run 不要求 API Key；与外部 API 共用生成管线，但**调用方式必须可区分**（`invocation_channel`）。
5. **输入以 Schema 为准**：Run / Quote 接受 Schema 定义的字段集合，而非仅 `prompt`。
6. **计价只在后端**：`POST .../quote` 与 Run 扣费同函数；**禁止**前端复现定价公式。
7. **金额对外只暴露 USD**：`cost_usd` / `amount_usd`；禁止 `credits_*`（见 [`billing-backend-gaps.md`](./billing-backend-gaps.md)）。
8. **模型双标识**：`model_path`（展示）vs `api_model_id`（`/v1` 请求体 `model`）；`model_id`（控制台 ID，Playground Run 用）。
9. **路径与媒介解耦**：生成 URL 不得含 `video`/`image`/`audio`；由请求体 `model` + Schema 决定类型。

---

## 3. Input Schema

### 3.1 `GET /api/models/{model_id}/input-schema`

| 项 | 说明 |
|---|---|
| 认证 | **公开**（无需 JWT） |
| Path | `model_id` — 与 `GET /api/models/{id}` 一致 |
| 成功响应 | `{ code, message, data }`；`data` 为 **Input Schema 对象** 或含 `components.schemas.Input` 的 OpenAPI 文档（前端自动提取） |

#### 响应示例（推荐：直接返回 Input）

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "type": "object",
    "example_url": "https://static.wavespeed.ai/examples/.../output.mp4#t=0.001",
    "required": ["prompt"],
    "x-order-properties": [
      "prompt",
      "reference_images",
      "reference_videos",
      "reference_audios",
      "aspect_ratio",
      "resolution",
      "duration",
      "enable_web_search",
      "generate_audio"
    ],
    "properties": {
      "prompt": {
        "type": "string",
        "description": "Describe the scene, action, camera movement, and mood for the video."
      },
      "reference_images": {
        "type": "array",
        "description": "Reference image URLs.",
        "items": { "type": "string" },
        "maxItems": 9,
        "x-ui-component": "uploaders",
        "x-ui-component-props": { "accept": "image/*" }
      },
      "aspect_ratio": {
        "type": "string",
        "enum": ["16:9", "9:16", "4:3", "3:4", "1:1", "21:9"],
        "default": "16:9",
        "x-ui-component": "select"
      },
      "duration": {
        "type": "integer",
        "minimum": 4,
        "maximum": 15,
        "default": 5,
        "x-ui-component": "slider"
      },
      "generate_audio": {
        "type": "boolean",
        "default": true,
        "x-ui-component": "switch"
      }
    }
  }
}
```

#### 错误码

| HTTP | code | 场景 |
|---|---|---|
| 404 | 404 | `model_id` 不存在或无 Schema |
| 500 | 500 | 内部错误 |

### 3.2 Schema 字段约定

| 字段 | 类型 | 用途 |
|---|---|---|
| `type` | `"object"` | 固定 |
| `properties` | `Record<string, SchemaProperty>` | 各输入字段 |
| `required` | `string[]` | 必填字段名 |
| `x-order-properties` | `string[]` | **渲染顺序** |
| `example_url` | `string` | 可选；未运行前右侧默认示例输出（图/视/音按扩展名识别） |

**SchemaProperty 常用属性：** `type`、`description`、`default`、`enum`、`minimum`/`maximum`/`step`、`minItems`/`maxItems`、`items`、`x-ui-component`、`x-ui-component-props`（如 `{ "accept": "image/*" }`）。

**`x-ui-component` 枚举：**

| 值 | 前端组件 | 说明 |
|---|---|---|
| `select` | 下拉 | 需 `enum` |
| `slider` | 滑块 | 需 `minimum` / `maximum` |
| `switch` | 开关 | `type: boolean` |
| `uploader` | 单文件上传 | `accept` 区分 image/video/audio |
| `uploaders` | 多文件上传 | 配合 `minItems` / `maxItems` |
| `textarea` | 多行文本 | 如 `prompt` |
| `number` | 数字输入 | 如 `seed` |

### 3.3 与模型详情的关系

| 接口 | 包含 Schema？ |
|---|---|
| `GET /api/models` | 否 |
| `GET /api/models/{id}` | **否** |
| `GET /api/models/{id}/input-schema` | **是** |

详情仍需 `model_path`、`api_model_id`、`per_run_price_usd` 等（见 §10）。

---

## 4. 媒体上传

Schema 中 `uploader` / `uploaders` 字段支持：**粘贴 URL**（不调接口）或 **本地上传**（调 `POST /api/upload` → 将返回的 `url` 写入表单）。

### 4.1 `POST /api/upload`

| 项 | 说明 |
|---|---|
| 认证 | **JWT 必填**；未登录 `401` |
| Content-Type | `multipart/form-data` |
| Query | `kind`：`image` \| `video` \| `audio`（前端始终传入） |
| Body | 单字段 **`file`** |
| 超时 | 前端 120s（大视频） |

```http
POST /api/upload?kind=image
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file=<binary>
```

#### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "url": "https://cdn.varo.cloud/uploads/u_01HXYZ/photo.jpg",
    "filename": "photo.jpg",
    "mime_type": "image/jpeg",
    "size": 1048576
  }
}
```

| 字段 | 说明 |
|---|---|
| `url` | **必填**；HTTPS 可访问，供上游拉取；随 Quote / Run 提交 |
| `filename` | 原始文件名（可脱敏） |
| `mime_type` | 服务端检测 MIME（**snake_case**） |
| `size` | 字节数 |

#### 错误码

| HTTP | code | 场景 |
|---|---|---|
| 401 | 401 | 未登录 |
| 400 | 400 | 缺少 `file`、空文件、`kind` 非法 |
| 413 | 413 | 超过大小上限 |
| 415 | 415 | MIME 不允许 |
| 500 | 500 | 存储失败 |

### 4.2 存储与安全（建议）

| `kind` | MIME 白名单 | 单文件上限 |
|---|---|---|
| `image` | jpeg, png, webp, gif | 10 MB |
| `video` | mp4, webm, quicktime | 200 MB |
| `audio` | mpeg, wav, mp4, ogg | 50 MB |

- 魔数校验真实类型；对象键含 `user_id`；CDN 对外 URL
- URL 在任务全生命周期有效（≥ 排队+处理时间）
- 频率限制、禁止可执行文件

### 4.3 典型上传字段

| 字段 | `x-ui-component` | 值类型 |
|---|---|---|
| `image`, `last_image`, `end_image` | `uploader` | `string` |
| `reference_images`, `images` | `uploaders` | `string[]` |
| `reference_videos` | `uploaders` | `string[]` |
| `reference_audios` | `uploaders` | `string[]` |

**不在范围内：** API Key 上传、分片续传、上传进度百分比（二期）。

---

## 5. 动态计价（Quote）

Playground Run 按钮旁需展示**随表单变化的精确费用**（`duration`、`resolution`、`reference_videos` 计费模式切换、`batch_size`、折扣等）。

### 5.1 `POST /api/models/{model_id}/quote`

| 认证 | 说明 |
|---|---|
| 展示预估价 | **公开**（未登录也可看价） |
| 与 Run 配合 | Run 时服务端再次计价扣费，不依赖 quote 缓存 |

**请求体：**

```json
{
  "input": {
    "prompt": "A cinematic shot of waves at sunset",
    "aspect_ratio": "16:9",
    "resolution": "720p",
    "duration": 10,
    "generate_audio": true,
    "reference_videos": []
  },
  "batch_size": 2
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `input` | 是 | 与 Playground Run 的 `input` 一致；按 Schema 校验 |
| `batch_size` | 否 | 默认 `1`，最大 `4` |

**响应：**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "cost_usd": 2.40,
    "standard_cost_usd": 3.00,
    "discount_percent": 20,
    "unit_cost_usd": 1.20,
    "batch_size": 2,
    "runs_per_ten_usd": 8,
    "breakdown": {
      "billing_mode": "output_duration",
      "billed_seconds": 10,
      "resolution": "720p",
      "rate_per_second_usd": 0.12,
      "has_reference_videos": false
    }
  }
}
```

| 字段 | 说明 |
|---|---|
| `cost_usd` | **本次总价**（已含 `batch_size`），Run 按钮展示 |
| `standard_cost_usd` | 可选，划线原价 |
| `unit_cost_usd` | 可选，单次价 |
| `runs_per_ten_usd` | 可选，`floor(10 / unit_cost_usd)` |
| `breakdown.billing_mode` | `output_duration` / `input_plus_output_duration` / `per_image` / `per_request` |

**错误码：** 400（校验失败）、404（模型不存在）、422（无法计价）。

### 5.2 静态字段 vs Quote 分工

| 来源 | 用途 | 随表单变化 |
|---|---|---|
| `starting_price_usd` | 模型卡片起价 | 否 |
| `per_run_price_usd` | Quote 加载前**占位** | 否 |
| **`POST .../quote`** | Playground **实时价** | **是** |

### 5.3 Seedance 2.0 计价参考（后端实现）

**无 `reference_videos`：** 锚定 480p·5s = $0.60，按秒 × 分辨率倍率（720p=2×, 1080p=5×, 4k=10×）。

**有 `reference_videos`：** 按秒 `input_seconds + output_seconds`（input clamp 2–15s）；720p = $0.15/s 等。

---

## 6. Playground 运行（JWT）

### 6.1 `POST /api/playground/generations`

控制台 **Run**（已登录）。

| 项 | 说明 |
|---|---|
| 认证 | JWT |
| 计费 | 扣余额；`invocation_channel = playground`；`style = web` |
| 批量 | `batch_size` 1–4 |

**请求体：**

```json
{
  "model_id": "seedance-t2v",
  "input": {
    "prompt": "A cinematic shot of waves at sunset",
    "aspect_ratio": "16:9",
    "resolution": "720p",
    "duration": 5,
    "generate_audio": true
  },
  "batch_size": 1
}
```

**响应（单任务）：**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "gen_01H...",
    "object": "generation",
    "status": "queued",
    "model": "bytedance/seedance-2.0/text-to-video",
    "created_at": 1749633592000,
    "batch_size": 1,
    "usage": { "cost_usd": 0.48 }
  }
}
```

**`batch_size > 1`：** 返回 `{ "object": "list", "data": [ ... ] }`。

**错误码：** 400（校验）、401、402（余额不足）、404、500/502（上游失败；扣费退款规则见账单文档）。

### 6.2 `GET /api/playground/generations/{id}`

轮询进度与结果；仅任务所属用户。

**完成示例：**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "gen_01H...",
    "object": "generation",
    "status": "completed",
    "model": "bytedance/seedance-2.0/text-to-video",
    "created_at": 1749633592000,
    "output": { "type": "video", "url": "https://..." },
    "usage": { "cost_usd": 0.48 }
  }
}
```

**`status`：** `queued` | `processing` | `completed` | `failed`（可选 `progress` 0–100）。

### 6.3 Playground JSON 模式请求体

```json
{
  "model_id": "seedance-t2v",
  "input": { "prompt": "...", "duration": 5 },
  "batch_size": 2
}
```

与外部 `/v1` 扁平体区分：JSON 模式面向控制台 JWT Run。

---

## 7. 调用方式区分（计费统计必做）

| `style`（账单） | 场景 |
|---|---|
| `web` | Playground（JWT） |
| `api` | API Key 外部调用 |

建议任务表增加 **`invocation_channel`**：

| 值 | 说明 |
|---|---|
| `playground` | 网页 Run |
| `openai_sdk` | OpenAI Python/Node SDK |
| `http_v1` | 裸 HTTP `/v1/generations` |
| `http_v2` | 裸 HTTP `/v2/generate` |

**后端需保证：**

1. 任务创建时写入，不可事后推断
2. `GET /api/usage` 透出 `invocation_channel`、`cost_usd`（替代 `credits_consumed`）
3. Playground 任务 `api_key` 为 `null`，用 `user_id` 关联
4. API 调用关联 `api_key_id` / 前缀

可选请求头：`X-Varo-Invocation-Channel`、`X-Varo-Client`（如 `openai-python/1.30.0`）。

---

## 8. 统一生成 API `/v1/generations`

### 8.1 路径

| 操作 | 路径 |
|---|---|
| 创建 | **`POST /v1/generations`** |
| 查询 | **`GET /v1/generations/{id}`** |
| 弃用 | `/v1/videos/generations`（可短期别名 + `Deprecation` 头） |

### 8.2 请求体（API Key，扁平 Schema 字段）

```json
{
  "model": "dreamina-seedance-2-0-260128",
  "prompt": "A cinematic shot of waves at sunset",
  "duration": 5,
  "aspect_ratio": "16:9",
  "resolution": "720p",
  "reference_images": ["https://..."],
  "generate_audio": true
}
```

| 规则 | 说明 |
|---|---|
| `model` | **必填**；`api_model_id`，非 `model_path` |
| 字段名 | 与 Schema `properties` 一致（`snake_case`） |
| 体形状 | 扁平字段；**不是** `{ model, input: {...} }` 包装 |

### 8.3 OpenAI SDK

- Python / Node：`base_url = "https://<host>/v1"`
- 创建：`client.post("/generations", body={...})`（**不用** `client.videos.*`）
- 查询：`client.get("/generations/{id}")`
- 认证：`Authorization: Bearer sk_live_...`
- 状态建议映射：`running`→`processing`，`succeeded`→`completed`

### 8.4 `/v2` 与 `/v1`

| 路径 | 定位 |
|---|---|
| `/v1/*` | 对外主推；Playground 代码视图 |
| `/v2/*` | BytePlus `content[]` 透传；`http_v2` |

共用任务表与计费，仅 `invocation_channel` 不同。

---

## 9. 代码示例视图规范

Playground 可切换 **Form / JSON / HTTP / Python / JavaScript**。后三种为只读示例 + 复制，用户用 API Key 在外部执行。

| 项 | 规范 |
|---|---|
| Base URL | `https://<host>/v1` |
| 创建 / 查询 | `POST/GET /v1/generations` |
| `model` | 模型详情 **`api_model_id`** |
| 请求体 | 扁平 Schema 字段 + `model` |

Python / Node / HTTP 示例如下；前端 `src/utils/playground-request-snippets.ts` 将按此对齐。

**Python（OpenAI SDK + 轮询）：**

```python
import time
from openai import OpenAI

client = OpenAI(api_key="sk_live_...", base_url="https://<host>/v1")

generation = client.post(
    "/generations",
    body={
        "model": "dreamina-seedance-2-0-260128",
        "prompt": "A cinematic shot of waves at sunset",
        "duration": 5,
        "aspect_ratio": "16:9",
        "resolution": "720p",
        "generate_audio": True,
    },
    cast_to=dict,
)

while True:
    status = client.get(f"/generations/{generation['id']}", cast_to=dict)
    if status["status"] == "succeeded":
        print(status["url"])
        break
    if status["status"] == "failed":
        raise RuntimeError(status.get("error", {}).get("message", "Generation failed"))
    time.sleep(5)
```

**JavaScript（OpenAI Node SDK）：**

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk_live_...",
  baseURL: "https://<host>/v1",
});

const generation = await client.post("/generations", {
  body: {
    model: "dreamina-seedance-2-0-260128",
    prompt: "A cinematic shot of waves at sunset",
    duration: 5,
    aspect_ratio: "16:9",
    resolution: "720p",
    generate_audio: true,
  },
});

let status = generation;
while (status.status === "queued" || status.status === "running") {
  await new Promise((r) => setTimeout(r, 5000));
  status = await client.get(`/generations/${generation.id}`);
}
```

**HTTP：**

```http
POST https://<host>/v1/generations
Authorization: Bearer sk_live_...
Content-Type: application/json

{
  "model": "dreamina-seedance-2-0-260128",
  "prompt": "A cinematic shot of waves at sunset",
  "duration": 5,
  "aspect_ratio": "16:9",
  "resolution": "720p",
  "generate_audio": true
}
```

**禁止文档化：** `POST /api/v1/predictions`（不存在的历史占位）。

---

## 10. 模型详情补充字段

`GET /api/models/{id}` 建议包含：

| 字段 | 说明 |
|---|---|
| `model_path` | 展示路径，如 `bytedance/seedance-2.0/text-to-video` |
| `api_model_id` | `/v1` 请求体 `model` |
| `per_run_price_usd` | 默认 Schema 配置下单次价（Quote 占位） |
| `runs_per_ten_usd` | 可选 |

API Tab README / FAQ 见 [`model-docs-backend-gaps.md`](./model-docs-backend-gaps.md)。

---

## 11. 需调整的现有接口

### 11.1 `GET /api/usage`

建议每条记录：

```json
{
  "task_id": "cgt-...",
  "model": "dreamina-seedance-2-0-260128",
  "duration": 5,
  "cost_usd": 2.00,
  "status": "completed",
  "invocation_channel": "openai_sdk",
  "api_key_prefix": "sk_live_1f78",
  "created_at": 1749633592000
}
```

### 11.2 `POST /v1/generations` 响应

- `object`: `"generation"`
- `created_at`: 13 位毫秒
- `output`: `{ "type": "video"|"image"|"audio"|..., "url": "..." }`
- `status` 与 Playground 统一

---

## 12. 前端联调状态

| 模块 | 项 | 状态 |
|---|---|---|
| Schema | `GET .../input-schema` 客户端 | ✅ |
| Schema | 动态表单、校验、`example_url` | ✅ |
| 上传 | UI + `POST /api/upload` 客户端 | ✅ Mock |
| 上传 | 真实后端 | ❌ |
| Quote | `usePlaygroundQuote` 防抖 300ms | ✅ Mock |
| Quote | 真实后端 | ⏳ |
| Run | UI、轮询、结果展示、放大/下载 | ✅ Mock |
| Run | 真实 `POST/GET .../playground/generations` | ❌ |
| 代码视图 | HTTP/Python/JS 模板 | ✅（待 `/v1/generations` 定稿） |

**主要前端文件：**

| 文件 | 用途 |
|---|---|
| `src/api/modelSchema.ts` | Input Schema |
| `src/api/upload.ts` | 上传 |
| `src/api/playground.ts` | Quote |
| `src/composables/useMediaUpload.ts` | 上传逻辑 |
| `src/composables/usePlaygroundQuote.ts` | 动态计价 |
| `src/utils/playground-request-snippets.ts` | 代码示例 |
| `mock/schemas.ts` / `mock/upload.ts` / `mock/playground-quote.ts` | Mock |

---

## 13. `rest-api-zh.md` 同步清单

- [ ] `GET /api/models/{id}/input-schema`
- [ ] `POST /api/upload`（JWT）
- [ ] `POST /api/models/{id}/quote`
- [ ] `POST/GET /api/playground/generations`
- [ ] **`POST/GET /v1/generations`** 替代 `/v1/videos/generations`
- [ ] 扩展 `/v1/generations` 请求体（Schema 字段表）
- [ ] OpenAI Python + Node SDK 示例
- [ ] `invocation_channel`、`cost_usd` 用量字段
- [ ] `model_path` vs `api_model_id` 映射
- [ ] 从模型详情文档移除内嵌 `input_schema`

---

## 14. 实现优先级

| 优先级 | 项 |
|---|---|
| **P0** | `GET .../input-schema` |
| **P0** | `POST /api/upload` |
| **P0** | `calculate_cost_usd()` 单点 + `POST .../quote` + Run 同价扣费 |
| **P0** | `POST/GET /api/playground/generations`（JWT） |
| **P0** | `POST/GET /v1/generations` + OpenAI SDK 验证 |
| **P0** | `invocation_channel` 落库 + `GET /api/usage` |
| **P1** | `api_model_id`；`batch_size`；账单 `style=web` |
| **P1** | 前端切真实 API（关 Mock） |
| **P2** | `breakdown` UI；`X-Varo-Client` 统计；旧 `/v1/videos/*` 下线 |

---

## 15. 验收标准（自检清单）

### Schema
- [ ] 未登录可 `GET .../input-schema`
- [ ] `x-order-properties`、`required`、`x-ui-component` 驱动前端表单

### 上传
- [ ] 登录用户上传 jpg/mp4/mp3 得 HTTPS `url`
- [ ] URL 填入表单后 Quote / Run 可提交且上游可拉取
- [ ] 未登录 401；超大/错误 MIME → 413/415

### Quote
- [ ] 改 `duration` / `resolution` 后 `cost_usd` 变化
- [ ] Quote 与 Run 扣费一致；未登录可看价

### Playground Run
- [ ] JWT Run **不要**求 API Key
- [ ] 轮询至 `completed` 展示 `output.url`
- [ ] 余额不足 402；`batch_size` 1–4

### 外部 API
- [ ] OpenAI Python/Node SDK `client.post("/generations")` 可创建+轮询
- [ ] URL **不含** video/image 等媒介字眼
- [ ] 所有入口写入 `invocation_channel`；`cost_usd` 无 `credits_*`
- [ ] `created_at` 13 位毫秒；无 `/api/v1/predictions`
