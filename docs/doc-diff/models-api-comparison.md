# Models 首页接口对比（前端 vs 后端文档）

> 对比基准  
> - 前端：`src/views/models/ModelsView.vue`、`src/components/models/ModelCard.vue`、`src/api/models.ts`  
> - 后端：`docs/api-doc/rest-api-zh.md`（模型接口章节）  
> - 日期：2026-06-22

---

## 总览

| 前端调用 | 后端文档 | 状态 |
|---|---|---|
| `GET /api/models?offset&limit&q` | `GET /api/models` | ❌ 严重不匹配（鉴权、分页、字段） |
| `GET /api/models/{id}` | `GET /api/models/{model_id}` | ❌ 严重不匹配（字段、Playground schema） |
| `GET /api/models/batch?ids=` | — | ❌ 完全缺失 |
| `GET /api/user/model-preferences` | — | ❌ 完全缺失 |
| `POST /api/models/{id}/favourite` | — | ❌ 完全缺失 |
| `DELETE /api/models/{id}/favourite` | — | ❌ 完全缺失 |
| `POST /api/models/{id}/visit` | — | ❌ 完全缺失 |

后端文档中的 `GET /api/models` 仅为控制台**费率查询**（`credits_per_second`），与前端 Models 首页所需的**模型目录**是不同业务。详见 [`models-backend-gaps.md`](./models-backend-gaps.md)。

---

## 1. 列表 `GET /api/models`

### 后端文档（现状）

**认证：** JWT

**请求参数：** 无

**响应 200：**

```json
[
  { "id": "seedance-1-5-pro-251215", "credits_per_second": 40, "active": true }
]
```

### 前端期望

**认证：** 无（首页公开，未登录可浏览）

**请求参数：**

| 参数 | 类型 | 说明 |
|---|---|---|
| `offset` | number | 分页偏移，默认 0 |
| `limit` | number | 每页条数，默认 20，最大 100 |
| `q` | string | 可选，按名称 / 提供商 / 描述搜索 |

**响应 200：**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
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
        "icon_url": "/assets/models/seedance.svg"
      }
    ],
    "total": 48,
    "offset": 0,
    "limit": 20
  }
}
```

### 字段对比（列表项）

| 前端字段 | 后端 API 字段 | 后端文档 | 状态 |
|---|---|---|---|
| `id` | `id` | ✅ | 一致 |
| `name` | `name` | — | ❌ 缺失 |
| `displayName` | `display_name` | — | ❌ 缺失 |
| `provider` | `provider` | — | ❌ 缺失 |
| `capabilities` | `capabilities` | — | ❌ 缺失 |
| `startingPriceUsd` | `starting_price_usd` | — | ❌ 缺失（文档仅有 credits） |
| `originalPriceUsd` | `standard_price_usd` | — | ❌ 缺失 |
| `priceUnit` | `price_unit` | — | ❌ 缺失（枚举，见定价页） |
| `priceDetail` | `price_detail` | — | ❌ 缺失 |
| `discountPercent` | `discount_percent` | — | ❌ 缺失 |
| `description` | `description` | — | ❌ 缺失 |
| `thumbnailUrl` | `thumbnail_url` | — | ❌ 缺失 |
| `iconUrl` | `icon_url` | — | ❌ 缺失 |
| — | `credits_per_second` | ✅ | 前端不使用，后端应换算为 USD |
| — | `active` | ✅ | 前端列表不展示，后端可过滤 `active=false` |

### 价格单位（与定价页一致）

`price_unit` 枚举与 [`pricing-backend-gaps.md`](./pricing-backend-gaps.md) 相同：

| `price_unit` | 卡片展示 |
|---|---|
| `per_second` | `$0.084` + `/秒` |
| `per_image` | `$0.07` + `/图像` |
| `per_million_tokens` | `$5` + `/M` |
| `per_hour` | `$2.49` + `/小时` |

`price_detail` 为可选补充说明；`per_second` 时仅填分辨率（如 `720p`），**不是**计费单位，不含时长。

---

## 2. 详情 `GET /api/models/{id}`

### 后端文档（现状）

```json
{ "id": "seedance-1-5-pro-251215", "credits_per_second": 40, "active": true }
```

### 前端期望（在列表字段基础上扩展）

| 前端字段 | 后端 API 字段 | 说明 |
|---|---|---|
| `modelPath` | `model_path` | 模型路径，用于 API 文档展示 |
| `inputSchema` | `input_schema` | JSON Schema，驱动 Playground 表单 |
| `isHot` | `is_hot` | 可选，热门标记 |
| `isNew` | `is_new` | 可选，新品标记 |
| `perRunPriceUsd` | `per_run_price_usd` | 默认配置下单次运行总价（USD） |
| `runsPerTenUsd` | `runs_per_ten_usd` | 可选，`$10` 可运行次数 |

Playground 运行按钮使用 `per_run_price_usd`（总价），卡片列表使用 `starting_price_usd` + `price_unit`（单价）。

---

## 3. 批量查询 `GET /api/models/batch`

收藏 / 最近使用 Tab 需要根据 ID 列表拉取模型卡片。

**请求：** `GET /api/models/batch?ids=seedance-i2v,kling-t2v`

**响应：** 与列表 `items` 相同结构的数组（顺序可与请求 ID 一致）。

后端文档：**无此接口**。

---

## 4. 用户模型偏好

| 前端调用 | 用途 |
|---|---|
| `GET /api/user/model-preferences` | 拉取收藏 ID 列表与最近访问 |
| `POST /api/models/{id}/favourite` | 添加收藏 |
| `DELETE /api/models/{id}/favourite` | 取消收藏 |
| `POST /api/models/{id}/visit` | 记录最近访问 |

后端文档：**均无**。

---

## 5. 与定价页、费率接口的边界

| 接口 | 受众 | 数据粒度 |
|---|---|---|
| `GET /api/models`（本页） | 访客 + 登录用户 | 一模型一条，含 Playground、缩略图 |
| `GET /api/pricing` | 访客 | 一 SKU 一条，标准价/折扣价目录 |
| `GET /api/models`（文档现状） | JWT 控制台 | 仅 `{ id, credits_per_second }` 费率 |

建议：**扩展** `GET /api/models` 为模型目录（公开 + 富字段），费率查询可合并到详情或保留内部字段；credits 不暴露给前端（见 [`billing-backend-gaps.md`](./billing-backend-gaps.md)）。

---

## 6. 前端已做适配

| 项 | 状态 | 位置 |
|---|---|---|
| snake_case → camelCase 映射 | ✅ | `src/api/models.ts` |
| `price_unit` 枚举 + i18n 单位 | ✅ | `ModelCard.vue`、`src/utils/pricing.ts` |
| Mock 返回 snake_case | ✅ | `mock/models.ts` |
| Playground 使用 `per_run_price_usd` | ✅ | `ModelDetailView.vue` |

---

## 7. 结论

- 后端文档中的模型接口**无法满足** Models 首页；需按 [`models-backend-gaps.md`](./models-backend-gaps.md) 重新设计。
- 价格单位与定价页共用 `price_unit` 枚举，金额字段统一 `_usd` 后缀。
- 收藏 / 最近访问 / 批量查询 / 公开访问均为 P0 阻塞项。
