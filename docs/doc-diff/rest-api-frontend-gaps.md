# 前端 vs 后端 API 差异清单（基于 rest-api-zh.md）

> **对比基准**
> - 后端文档：[`docs/api-doc/rest-api-zh.md`](../api-doc/rest-api-zh.md)（2026-06 最新版）
> - 前端调用：`src/api/*.ts`、`src/views/*`
>
> **排除范围（本文不展开）**
> - 认证：OTP 登录、refresh、logout 等（见 [`auth-zh.md`](../api-doc/auth-zh.md)）
> - 充值 / Stripe：`/api/billing/checkout`、交易流水、自动充值等（见 [`stripe-zh.md`](../api-doc/stripe-zh.md)）
>
> **日期：** 2026-06-26

---

## 1. 总览

| 前端能力 | 前端调用 | 后端文档现状 | 差异级别 |
|---|---|---|---|
| Models 首页列表 | `GET /api/models?offset&limit&q` | 有，但 **JWT 必填**、无分页、字段为费率结构 | 🔴 严重 |
| 模型详情 / Playground | `GET /api/models/{id}` | 有，但 **JWT 必填**、缺展示/Playground 字段 | 🔴 严重 |
| 收藏 / 最近 Tab | `GET /api/models/batch` 等 5 个接口 | **完全缺失** | 🔴 严重 |
| 定价页 | `GET /api/pricing` | **完全缺失** | 🔴 严重 |
| Playground 表单 | `GET /api/models/{id}/input-schema` | **完全缺失** | 🔴 严重 |
| Run 按钮估价 | `POST /api/models/{id}/quote` | **完全缺失** | 🔴 严重 |
| 文件上传 | `POST /api/upload` | **完全缺失** | 🔴 严重 |
| Playground 运行 | `POST/GET /api/playground/generations` | **完全缺失** | 🔴 严重 |
| API Keys 页 | `POST/GET/DELETE /api/api-keys` | 有，缺 `name`、用量统计字段 | 🟡 中等 |
| 外部集成代码示例 | `POST /v1/generations` | 文档为 `/v1/videos/generations` | 🟡 中等 |
| 用量查询 | — | `GET /api/usage` 已有 | 🟢 前端暂未对接 |

> **已确认问题：** `GET /api/models` 在后端要求 JWT，但前端 Models 首页、定价页一样应对**访客公开**；未登录用户目前无法浏览模型列表（或只能看到空卡片）。

---

## 2. 公开接口清单

### 2.1 后端文档当前声明的公开接口

| 接口 | 认证 |
|---|---|
| `GET /api/billing/config` | 无 |
| `GET /api/billing/packages` | 无 |
| `GET /v1/models` | 无 |
| `GET /healthz` | 无 |

### 2.2 前端还需要公开、但文档未列入的接口

| 接口 | 前端页面 | 说明 |
|---|---|---|
| `GET /api/models` | Models 首页 | 访客浏览 Latest Models |
| `GET /api/models/{id}` | 模型详情 | 访客可进入详情页 |
| `GET /api/models/batch` | Models 收藏/最近 Tab | 批量拉卡片（ID 来自 JWT 偏好接口） |
| `GET /api/models/{id}/input-schema` | Playground | 动态表单 Schema |
| `POST /api/models/{id}/quote` | Playground | Run 按钮实时估价 |
| `GET /api/pricing` | 定价页 | 全量价目表 |

**建议：** 更新 `rest-api-zh.md`「认证方式」章节的公开接口列表，并将上述 6 个接口的认证方式改为**无（公开）**。

---

## 3. 模型接口

> 前端代码：`src/api/models.ts` · 页面：`src/views/models/ModelsView.vue`

### 3.1 `GET /api/models` — 鉴权错误

| 项目 | 后端文档 | 前端期望 |
|---|---|---|
| 认证 | **JWT 必填** | **无（公开）** |
| 用途 | 控制台费率 / 分辨率查询 | **模型目录首页**，卡片展示 |

### 3.2 `GET /api/models` — 请求参数缺失

后端文档：**无查询参数**。

前端发送：

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `offset` | number | 0 | 分页偏移 |
| `limit` | number | 20 | 每页条数（最大 100） |
| `q` | string | — | 按名称 / 提供商 / 描述搜索 |

### 3.3 `GET /api/models` — 响应结构不匹配

**后端文档 `data`（数组）：**

```json
[
  {
    "id": "seedance-1-5-pro-251215",
    "resolutions": ["480p", "720p", "1080p"],
    "mode": "audio",
    "active": true
  }
]
```

**前端期望 `data`（分页对象）：**

```json
{
  "items": [
    {
      "id": "seedance-i2v",
      "name": "Seedance 2.0 Image-to-Video",
      "display_name": "Seedance 2.0",
      "provider": "ByteDance",
      "capabilities": ["image-to-video"],
      "starting_price_usd": 0.084,
      "standard_price_usd": 0.1,
      "price_unit": "per_second",
      "price_detail": "720p",
      "discount_percent": 16,
      "description": "...",
      "thumbnail_url": "/...",
      "icon_url": "/assets/models/seedance.svg",
      "is_hot": true,
      "is_new": false
    }
  ],
  "total": 48,
  "offset": 0,
  "limit": 20
}
```

> 前端当前对「`data` 为纯数组」做了临时兼容，但数组内仍缺少卡片所需字段，页面只能显示 ID 占位内容。

#### 字段对比（列表项）

| 前端字段 | API 字段 | 后端文档 | 说明 |
|---|---|---|---|
| `id` | `id` | ✅ | — |
| `name` | `name` | ❌ | 完整名称 |
| `displayName` | `display_name` | ❌ | 卡片标题 |
| `provider` | `provider` | ❌ | 提供商 |
| `capabilities` | `capabilities` | ❌ | 如 `text-to-video` |
| `startingPriceUsd` | `starting_price_usd` | ❌ | 卡片单价（USD） |
| `originalPriceUsd` | `standard_price_usd` | ❌ | 划线价 |
| `priceUnit` | `price_unit` | ❌ | `per_second` 等枚举 |
| `priceDetail` | `price_detail` | ❌ | 如 `720p` |
| `discountPercent` | `discount_percent` | ❌ | 折扣整数 |
| `description` | `description` | ❌ | 卡片描述 |
| `thumbnailUrl` | `thumbnail_url` | ❌ | 预览图 |
| `iconUrl` | `icon_url` | ❌ | 品牌图标 |
| `isHot` | `is_hot` | ❌ | 热门标记 |
| `isNew` | `is_new` | ❌ | 新品标记 |
| — | `resolutions` | ✅ 有 | 前端列表**不需要**（Playground Schema 用） |
| — | `mode` | ✅ 有 | 前端列表**不需要**（内部计费用） |
| — | `active` | ✅ 有 | 可保留；前端默认只展示 `active: true` |

**金额约定：** 前端对外只展示 USD（`starting_price_usd`），**不暴露** `credits` / `credits_per_second`。内部 token 计费公式可保留在服务端，但目录接口需换算成 USD + `price_unit`。

---

### 3.4 `GET /api/models/{model_id}` — 鉴权与字段

| 项目 | 后端文档 | 前端期望 |
|---|---|---|
| 认证 | JWT 必填 | **无（公开）** |
| 响应 | `{ id, resolutions, mode, active }` | 列表字段 + 详情扩展字段 |

**前端额外需要的字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| `model_path` | string | 展示路径，如 `bytedance/seedance-2.0/text-to-video` |
| `api_model_id` | string | 外部 `POST /v1/generations` 请求体中的 `model` 值 |
| `per_run_price_usd` | number | 默认配置下的单次运行价（占位，Run 按钮以 quote 为准） |
| `runs_per_ten_usd` | number | 「$10 能跑几次」展示 |
| `readme_md` | string | API Tab README（Markdown） |
| `faq` | `{ question, answer }[]` | API Tab FAQ |

---

### 3.5 完全缺失的模型相关接口

| 接口 | 认证 | 前端用途 |
|---|---|---|
| `GET /api/models/batch?ids=` | **公开** | 收藏 / 最近 Tab 批量拉卡片 |
| `GET /api/user/model-preferences` | JWT | 读取收藏 ID 列表 + 最近访问 |
| `POST /api/models/{id}/favourite` | JWT | 添加收藏（幂等） |
| `DELETE /api/models/{id}/favourite` | JWT | 取消收藏（幂等） |
| `POST /api/models/{id}/visit` | JWT | 记录最近访问（去重，最多 50 条） |

**典型流程：**

```
收藏 Tab:
  GET /api/user/model-preferences  → favourites: ["id1", "id2"]
  GET /api/models/batch?ids=id1,id2 → 卡片字段

最近 Tab:
  GET /api/user/model-preferences  → recent: [{ model_id, visited_at }]
  GET /api/models/batch?ids=...     → 卡片字段（按 recent 顺序排列）
```

详细字段规范见 [`models-backend-gaps.md`](./models-backend-gaps.md)。

---

## 4. Playground 相关接口（文档完全缺失）

> 前端页面：`src/views/models/ModelDetailView.vue`、`src/views/ai-generator/AiGeneratorView.vue`  
> 详细规范：[`playground-backend-gaps.md`](./playground-backend-gaps.md)

| 接口 | 认证 | 状态 | 说明 |
|---|---|---|---|
| `GET /api/models/{id}/input-schema` | **公开** | ❌ 缺失 | JSON Schema 动态表单 |
| `POST /api/models/{id}/quote` | **公开** | ❌ 缺失 | 按当前 input 实时估价，返回 `cost_usd` |
| `POST /api/upload` | JWT | ❌ 缺失 | 上传图片/视频/音频，返回 `{ url }` |
| `POST /api/playground/generations` | JWT | ❌ 缺失 | 控制台点击 Run，创建任务 |
| `GET /api/playground/generations/{id}` | JWT | ❌ 缺失 | 轮询任务状态与 output URL |

**与现有后端的关系：**

- 后端已有 `/v2/generate` + `/v2/status`（API Key）和 `/v1/videos/generations`（OpenAI 兼容），但 Playground **不走这些路径**；控制台 Run 需独立的 JWT 通道，并在账单中标记 `style: web`（见 billing 文档，本文不展开）。
- `POST .../quote` 与 Run 扣费**必须共用同一套计价函数**（文档中的 token 公式可以复用，但对外只返回 USD）。

---

## 5. 定价页接口（文档完全缺失）

> 前端：`src/api/pricing.ts` · 页面：`src/views/pricing/PricingView.vue`  
> 详细规范：[`pricing-backend-gaps.md`](./pricing-backend-gaps.md)

| 接口 | 认证 | 状态 |
|---|---|---|
| `GET /api/pricing` | **公开** | ❌ 缺失 |

**期望响应 `data`：** 定价条目数组，每条含 `id`、`name`、`standard_price_usd`、`starting_price_usd`、`price_unit`、可选 `model_id` / `discount_percent`。

**与 `GET /api/models` 的边界：**

| 接口 | 受众 | 粒度 |
|---|---|---|
| `GET /api/models` | 访客 + 登录用户 | 一模型一条，含 Playground 入口、缩略图 |
| `GET /api/pricing` | 访客 | 多 SKU 价目表，可一模型多条 |

---

## 6. API Key 接口

> 前端：`src/api/api-keys.ts` · 页面：`src/views/api-keys/ApiKeysView.vue`  
> 详细规范：[`api-keys-backend-gaps.md`](./api-keys-backend-gaps.md)

后端文档已有三个接口，但与前端存在以下差异：

### 6.1 `POST /api/api-keys` — 缺少命名

| 项目 | 后端文档 | 前端期望 |
|---|---|---|
| 请求体 | 无 | `{ "name": "production" }` |
| 响应 | 无 `name` | 含 `name` 字段 |

### 6.2 `GET /api/api-keys` — 缺少用量统计

前端表格「Calls / Spend」「Last Used」列需要（文档未定义）：

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | string | 用户自定义名称 |
| `total_calls` | integer | 累计调用次数 |
| `total_spend_usd` | number | 累计消费 USD（或 `total_spend_credits`，前端可适配） |
| `last_used_at` | number \| null | 最后使用时间（13 位毫秒） |

### 6.3 时间戳

文档示例已改为 13 位毫秒 ✅，与 [`backend-global-adjustments.md`](./backend-global-adjustments.md) 一致。

### 6.4 已撤销 Key 策略

文档写「查询所有**有效的** API Key」，未说明 `is_active: false` 是否返回。前端 Mock 支持展示 Revoked 状态，需后端确认策略。

---

## 7. 视频生成代理路径差异

> 前端代码示例：`src/utils/playground-request-snippets.ts`  
> 后端文档：`rest-api-zh.md` § OpenAI 兼容接口

| 项目 | 后端文档 | 前端期望 |
|---|---|---|
| 提交生成 | `POST /v1/videos/generations` | `POST /v1/generations` |
| 查询状态 | `GET /v1/videos/generations/{id}` | `GET /v1/generations/{id}` |
| 请求体 | 以 `prompt` 为主 | Schema 定义的完整 `input` 字段集（snake_case） |

**说明：** 路径中的 `video` 应去掉，媒介类型由 `model` + Schema 决定，而非 URL。Playground API Tab 的 Quick Start 代码已按 `/v1/generations` 生成。

`/v2/generate` + `/v2/status` 在后端文档中存在，前端 Playground 当前**未直接调用**（Run 仍走 Mock / 待 `playground/generations` 落地）。

---

## 8. 用量接口（后端有，前端未对接）

后端文档已有：

```
GET /api/usage?limit&offset  （JWT）
→ [{ task_id, model, duration, cost_usd, status, created_at }]
```

前端**尚无独立用量页 API 调用**；Billing 页使用的是 `/api/billing/records` 等（充值模块，本文不展开）。

若后续做「用量明细」页，可直接复用此接口；需确认：

- 是否区分 Playground（web）与 API Key 调用来源
- 是否返回 `api_key` 前缀或 `invocation_channel`

---

## 9. 优先级建议

### P0 — 阻塞 Models 首页与详情联调

- [ ] `GET /api/models` 改为**公开**，支持 `offset` / `limit` / `q`
- [ ] `GET /api/models` 响应改为分页对象 + 卡片字段（§3.3）
- [ ] `GET /api/models/{id}` 改为**公开**，补充详情字段（§3.4）
- [ ] 新增 `GET /api/models/batch`
- [ ] 新增用户偏好 4 接口（§3.5）
- [ ] 新增 `GET /api/pricing`（§5）

### P1 — 阻塞 Playground 联调

- [ ] 新增 `GET /api/models/{id}/input-schema`
- [ ] 新增 `POST /api/models/{id}/quote`
- [ ] 新增 `POST /api/upload`
- [ ] 新增 `POST/GET /api/playground/generations`

### P2 — API Keys 完整体验

- [ ] `POST /api/api-keys` 支持 `name`
- [ ] `GET /api/api-keys` 返回 `name` + 用量统计
- [ ] 确认 revoked Key 列表策略

### P3 — 外部集成路径对齐

- [ ] `/v1/videos/generations` 迁移或别名至 `/v1/generations`
- [ ] 请求体支持 Schema 全字段（不仅 `prompt`）
- [ ] 更新 `rest-api-zh.md` 公开接口清单（§2）

---

## 10. 关联文档

| 文档 | 内容 |
|---|---|
| [`models-backend-gaps.md`](./models-backend-gaps.md) | 模型目录 + 偏好接口完整规范 |
| [`playground-backend-gaps.md`](./playground-backend-gaps.md) | Playground Schema / Quote / Upload / Run |
| [`model-docs-backend-gaps.md`](./model-docs-backend-gaps.md) | README / FAQ / `api_model_id` |
| [`pricing-backend-gaps.md`](./pricing-backend-gaps.md) | 定价页接口规范 |
| [`api-keys-backend-gaps.md`](./api-keys-backend-gaps.md) | API Key 命名与用量 |
| [`backend-global-adjustments.md`](./backend-global-adjustments.md) | 时间戳、多语言、Turnstile 等全局约定 |
