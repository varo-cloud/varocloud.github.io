# Models 首页 — 后端接口缺失清单

> 供后端开发参考。前端页面：`src/views/models/ModelsView.vue`  
> 对比文档：[`models-api-comparison.md`](./models-api-comparison.md)  
> 官方 API 文档：[`rest-api-zh.md`](../api-doc/rest-api-zh.md)（当前模型章节仅为费率查询，需重写）

---

## 设计原则

1. **功能以前端为准**：公开模型目录、分页搜索、收藏/最近、卡片价格、跳转模型详情。
2. **金额只暴露 USD**：不返回 `credits`、`credits_per_second`；内部换算由后端完成（参见 [`billing-backend-gaps.md`](./billing-backend-gaps.md)）。
3. **价格单位与定价页一致**：`price_unit` 使用枚举（`per_second` / `per_image` / `per_million_tokens` / `per_hour`），展示文案由前端 i18n 处理。
4. **公开列表**：`GET /api/models` 列表对访客开放（与定价页一致）；收藏/偏好接口需 JWT。
5. **命名**：响应字段 **snake_case**；外层 `{ code, message, data }` 包装。
6. **Playground / Model Schema 不在本文范围**：`input_schema`、`model_path` 及 Playground 相关接口由**单独接口文档**定义，本文仅覆盖 Models 首页目录与用户偏好。

---

## P0 — 阻塞联调

### 1. 重写 `GET /api/models`（模型目录列表）

**认证：** 无（公开）

**查询参数**

| 参数 | 默认 | 说明 |
|---|---|---|
| `offset` | 0 | 分页偏移 |
| `limit` | 20 | 每页条数（1–100） |
| `q` | — | 可选，搜索 `name` / `display_name` / `provider` / `description` |

**响应 200**

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
        "price_detail": "5s · 720p",
        "discount_percent": 16,
        "description": "Hollywood-grade cinematic image-to-video...",
        "thumbnail_url": "https://cdn.example.com/thumbs/seedance-i2v.jpg"
      }
    ],
    "total": 48,
    "offset": 0,
    "limit": 20
  }
}
```

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✅ | 模型唯一 ID |
| `name` | string | ✅ | 完整名称 |
| `display_name` | string | 可选 | 卡片标题（缺省用 `name`） |
| `provider` | string | ✅ | 提供商 |
| `capabilities` | string[] | ✅ | 如 `text-to-video`、`image-to-video` |
| `starting_price_usd` | number | ✅ | **单价**（USD），配合 `price_unit` |
| `standard_price_usd` | number | 可选 | 标准单价，用于划线价 |
| `price_unit` | string | ✅ | 枚举：`per_second` \| `per_image` \| `per_million_tokens` \| `per_hour` |
| `price_detail` | string | 可选 | 运行配置说明，如 `5s · 720p`（非计费单位） |
| `discount_percent` | number | 可选 | 折扣整数，如 `16` → `-16%` |
| `description` | string | ✅ | 卡片描述 |
| `thumbnail_url` | string | 可选 | 缩略图 URL |

#### `price_unit` 枚举

与 [`pricing-backend-gaps.md`](./pricing-backend-gaps.md) 完全一致。无效枚举将导致前端单位文案缺失。

| `price_unit` | 适用 | 卡片示例 |
|---|---|---|
| `per_second` | 视频 | `$0.084` `/秒` · `5s · 720p` |
| `per_image` | 图像 | `$0.07` `/图像` |
| `per_million_tokens` | 语言模型 | `$5` `/M` |
| `per_hour` | Serverless GPU | `$2.49` `/小时` |

#### 金额精度

| `price_unit` | 建议精度 |
|---|---|
| `per_second`、`per_image` | 最多 3 位小数 |
| `per_million_tokens`、`per_hour` | 最多 2 位小数 |

**原因：** 原文档 `GET /api/models` 返回 `{ credits_per_second }` 且无分页/展示字段，无法支撑首页模型卡片。

---

### 2. 新增 `GET /api/models/batch`

按 ID 批量获取列表项（收藏 / 最近 Tab）。

**认证：** 无

**查询参数：** `ids` — 逗号分隔的模型 ID

**响应 200：** `data` 为列表项对象数组（字段同 §1 `items` 元素）

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    { "id": "seedance-i2v", "name": "...", "starting_price_usd": 0.084, "price_unit": "per_second" }
  ]
}
```

---

### 3. 用户模型偏好（收藏 / 最近访问）

> **现状：** `rest-api-zh.md` **无任何**收藏/最近访问接口描述；前端已通过 Mock 联调，待后端实现下列 4 个端点。  
> **前端代码：** `src/stores/modelPreferences.ts`、`src/api/modelPreferences.ts`、`src/views/models/ModelsView.vue`

#### 业务说明

Models 首页登录后展示三个 Tab：

| Tab | 数据来源 | 说明 |
|---|---|---|
| Latest Models | `GET /api/models`（分页） | 全量目录，公开 |
| Favourite Models | `GET /api/user/model-preferences` → `favourites` → `GET /api/models/batch` | 仅 ID 列表存用户偏好，卡片详情批量拉取 |
| Recently Used | `GET /api/user/model-preferences` → `recent` → `GET /api/models/batch` | 按 `visited_at` 倒序展示 |

偏好接口只存 **模型 ID**，不嵌套模型详情；已下架模型在 `batch` 响应中缺失时，前端自动跳过（不展示该卡片）。

#### 前端触发时机

| 动作 | 调用接口 | 条件 |
|---|---|---|
| 用户登录 / 刷新页面（已登录） | `GET /api/user/model-preferences` | 拉取全量偏好，填充 Tab 与爱心状态 |
| 用户登出 | — | 前端清空本地偏好，隐藏收藏/最近 Tab |
| 点击卡片爱心 | `POST` 或 `DELETE .../favourite` | 已登录；未登录跳转登录页 |
| 点击卡片进入详情 | `POST .../visit` | **已登录**时记录（`ModelCard`、`ModelDetailView` 均会触发） |
| 切换收藏/最近 Tab | `GET /api/models/batch?ids=` | 用偏好中的 ID 列表批量取卡片 |

写操作（收藏/访问）成功后，后端返回**完整偏好对象**，前端用响应覆盖本地状态（乐观更新，失败则回滚）。

---

#### 统一响应结构 `ModelPreferences`

所有偏好接口的 `data` 均为同一结构：

```json
{
  "favourites": ["seedance-i2v", "kling-t2v"],
  "recent": [
    { "id": "seedance-i2v", "visited_at": 1749633592000 },
    { "id": "kling-t2v", "visited_at": 1749633401000 }
  ]
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `favourites` | string[] | 收藏的模型 ID 列表 |
| `recent` | object[] | 最近访问记录 |
| `recent[].id` | string | 模型 ID |
| `recent[].visited_at` | number | **13 位毫秒**时间戳（见 [`backend-global-adjustments.md`](./backend-global-adjustments.md)） |

**排序规则：**

| 字段 | 排序 |
|---|---|
| `favourites` | 建议按**收藏时间倒序**（最新收藏在前）；前端按数组顺序展示 |
| `recent` | **必须**按 `visited_at` **倒序**（最近访问在前） |

**容量建议：**

| 字段 | 建议上限 | 说明 |
|---|---|---|
| `favourites` | 无硬上限（或 500） | 重复添加同一 ID 应幂等 |
| `recent` | **50 条** | 与前端 Mock 一致；超出时丢弃最旧记录 |

---

#### 3.1 `GET /api/user/model-preferences`

拉取当前用户的收藏与最近访问。

**认证：** JWT（`Authorization: Bearer <access_token>`）

**请求参数：** 无

**响应 200**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "favourites": ["seedance-i2v", "kling-t2v"],
    "recent": [
      { "id": "seedance-i2v", "visited_at": 1749633592000 }
    ]
  }
}
```

无记录时返回空数组（**不要**返回 `null`）：

```json
{ "favourites": [], "recent": [] }
```

**错误码**

| 状态码 | 原因 |
|---|---|
| 401 | 未登录或 token 无效 |

---

#### 3.2 `POST /api/models/{model_id}/favourite`

添加收藏。

**认证：** JWT

**路径参数：** `model_id` — 模型 ID（须存在于模型目录）

**请求体：** 无

**响应 200：** `data` 为完整 `ModelPreferences`（含更新后的 `favourites`）

**业务规则：**

- 若 `model_id` 已在 `favourites` 中，**幂等**返回成功，不重复添加
- 不要求 `model_id` 对应模型当前 `active=true`（允许收藏已下架模型，batch 时前端过滤）

**错误码**

| 状态码 | 原因 |
|---|---|
| 401 | 未登录 |
| 404 | `model_id` 在模型目录中不存在 |

---

#### 3.3 `DELETE /api/models/{model_id}/favourite`

取消收藏。

**认证：** JWT

**路径参数：** `model_id`

**请求体：** 无

**响应 200：** `data` 为完整 `ModelPreferences`

**业务规则：**

- 若 `model_id` 不在 `favourites` 中，**幂等**返回成功（`favourites` 不变）

**错误码**

| 状态码 | 原因 |
|---|---|
| 401 | 未登录 |

> 取消收藏**不需要** 404；ID 不存在于收藏列表视为已是目标状态。

---

#### 3.4 `POST /api/models/{model_id}/visit`

记录最近访问。

**认证：** JWT

**路径参数：** `model_id`

**请求体：** 无

**响应 200：** `data` 为完整 `ModelPreferences`（含更新后的 `recent`）

**业务规则：**

1. 若 `model_id` 已存在于 `recent`，**先移除旧记录**再插入新记录（去重）
2. 新记录 `visited_at` = 服务端当前时间（**13 位毫秒**）
3. 插入到 `recent` **头部**（最新在前）
4. 列表超过 **50 条**时截断尾部

伪代码：

```python
def record_visit(user_id: str, model_id: str) -> ModelPreferences:
    recent = [r for r in get_recent(user_id) if r.id != model_id]
    recent.insert(0, RecentEntry(id=model_id, visited_at=now_ms()))
    recent = recent[:50]
    save_recent(user_id, recent)
    return get_preferences(user_id)
```

**错误码**

| 状态码 | 原因 |
|---|---|
| 401 | 未登录 |
| 404 | `model_id` 在模型目录中不存在 |

---

#### 与 `GET /api/models/batch` 的配合

收藏/最近 Tab **不**在偏好接口中返回模型详情，流程如下：

```
1. GET /api/user/model-preferences     → favourites / recent IDs
2. GET /api/models/batch?ids=id1,id2   → 模型卡片字段（§1 列表项）
3. 前端按 favourites / recent 数组顺序排序 batch 结果后渲染
```

| 场景 | 后端行为 | 前端行为 |
|---|---|---|
| 收藏的模型已下架 | `batch` 不返回该 ID | 卡片不展示 |
| `batch` 请求含无效 ID | 忽略无效 ID，只返回存在的模型 | 展示返回的子集 |
| `ids` 为空 | 返回 `[]` | 展示空状态文案 |

`batch` 接口规范见本文 §2。

---

#### 数据存储建议

```sql
-- 收藏（每用户每模型一条）
CREATE TABLE user_model_favourites (
  user_id    UUID NOT NULL REFERENCES users(id),
  model_id   VARCHAR NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, model_id)
);
CREATE INDEX idx_favourites_user_created ON user_model_favourites (user_id, created_at DESC);

-- 最近访问（每用户每模型一条，更新 visited_at）
CREATE TABLE user_model_recent (
  user_id     UUID NOT NULL REFERENCES users(id),
  model_id    VARCHAR NOT NULL,
  visited_at  BIGINT NOT NULL,  -- 13 位毫秒
  PRIMARY KEY (user_id, model_id)
);
CREATE INDEX idx_recent_user_visited ON user_model_recent (user_id, visited_at DESC);
```

或使用 JSONB 字段存于 `user_profiles`，但独立表更利于索引与截断 `recent`。

---

#### 后端现状与前端映射

| 项 | 状态 |
|---|---|
| `rest-api-zh.md` | ❌ 无相关章节 |
| 后端实现 | ❌ 未实现 |
| 前端 API 客户端 | ✅ `src/api/modelPreferences.ts` |
| 前端 Mock | ✅ `mock/model-preferences.ts` |
| 字段映射 | 后端 `visited_at` → 前端 `visitedAt`（API 层映射，联调前补齐） |

**原因：** 收藏/最近是 Models 首页登录用户的核心体验；`rest-api-zh.md` 与后端均未提供，阻塞收藏 Tab、最近 Tab 及爱心按钮的真实联调。

---

## P1 — 体验增强（非阻塞）

### 5. 多语言

按 `X-Locale` / `Accept-Language` 返回本地化 `name`、`description`（见 [`backend-global-adjustments.md`](./backend-global-adjustments.md)）。

### 6. 缓存

模型目录变更频率低，建议 `Cache-Control: public, max-age=300`。

---

## 与现有文档接口的关系

| 原文档接口 | 建议处理 |
|---|---|
| `GET /api/models` 返回 `credits_per_second` | **替换**为模型目录；费率在服务端换算为 `starting_price_usd` + `price_unit` |
| `GET /api/models/{id}` 仅费率 | 模型详情 / Playground schema **另文定义**，不在本文范围 |
| `GET /v1/models` | 保留，供 API Key 调用方列举生成模型，**不替代**控制台目录 |

定价页专用接口见 [`pricing-backend-gaps.md`](./pricing-backend-gaps.md)，与本接口数据有交集但粒度不同。

---

## 联调检查清单

- [ ] `GET /api/models` 公开、支持 `offset` / `limit` / `q`
- [ ] 响应分页包装 `{ items, total, offset, limit }`
- [ ] 列表项含 `starting_price_usd`、`price_unit`（必填枚举）
- [ ] `standard_price_usd` 可选，用于划线价
- [ ] `price_detail` 为运行配置说明，非自由文本单位
- [ ] 实现 `GET /api/models/batch?ids=`
- [ ] 实现 `GET /api/user/model-preferences`（JWT，空列表不返回 null）
- [ ] 实现 `POST /api/models/{id}/favourite`（幂等添加，404 当模型不存在）
- [ ] 实现 `DELETE /api/models/{id}/favourite`（幂等删除）
- [ ] 实现 `POST /api/models/{id}/visit`（去重、倒序、最多 50 条）
- [ ] 写操作响应返回完整 `ModelPreferences`
- [ ] `visited_at` 为 13 位毫秒时间戳
- [ ] `favourites` / `recent` 排序符合 §3 规则
- [ ] 禁止向前端返回 credits 字段
- [ ] 在 `rest-api-zh.md` 重写「模型接口」章节

---

## 前端联调状态

| 项 | 状态 | 位置 |
|---|---|---|
| API 映射层 | ✅ | `src/api/models.ts` |
| 卡片 `price_unit` + i18n | ✅ | `ModelCard.vue`、`src/utils/pricing.ts` |
| Mock snake_case | ✅ | `mock/models.ts` |
| 收藏/最近偏好 Mock | ✅ | `mock/model-preferences.ts` |
| 偏好 API `visited_at` 映射 | ⚠️ 待补齐 | `src/api/modelPreferences.ts`（联调前加映射层） |

---

## 需同步更新的其他文档

| 文档 | 说明 |
|---|---|
| **`rest-api-zh.md`** | 重写模型目录与 §3 偏好接口；Playground schema 另文补充 |
| **`billing-backend-gaps.md` §6** | 与本文 §1 合并理解，统一 USD + `price_unit` |
| **`pricing-backend-gaps.md`** | `price_unit` 枚举定义一致，无需重复修改 |
