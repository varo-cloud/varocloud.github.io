# 定价页 — 后端接口缺失清单

> 供后端开发参考。前端页面：`src/views/pricing/PricingView.vue`  
> 对比文档：[`pricing-api-comparison.md`](./pricing-api-comparison.md)  
> 官方 API 文档：[`rest-api-zh.md`](../api-doc/rest-api-zh.md)（**尚无定价接口章节**，后端实现后需同步补充）

---

## 设计原则

1. **功能以前端为准**：全量价目表展示、标准价/起价/折扣、跳转模型详情（**无分类 Tab 筛选**）。
2. **金额只暴露 USD**：不返回 `credits`、`credits_per_second`；内部换算由后端完成（参见 [`billing-backend-gaps.md`](./billing-backend-gaps.md)）。
3. **命名**：响应字段使用 **snake_case**；`price_unit` 等枚举值使用 **snake_case**（如 `per_second`）。
4. **公开接口**：定价页无需登录，建议与 `GET /api/billing/packages` 一样**无需 JWT**。
5. **单位由枚举驱动**：`price_unit` 返回枚举 key，展示文案（`/秒`、`/M` 等）由前端 i18n 处理，**禁止**返回自由文本单位。

---

## P0 — 阻塞联调

### 1. 新增 `GET /api/pricing`

获取定价目录全量列表，供定价页表格展示。

**认证：** 无（公开）

**请求参数：** 无（前端全量展示，不做筛选）

**响应 200**

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": "veo-31-lite-i2v",
      "model_id": "seedance-i2v",
      "name": "Veo 3.1 Lite Image-to-video",
      "standard_price_usd": 0.1,
      "starting_price_usd": 0.084,
      "price_unit": "per_second",
      "discount_percent": 15
    },
    {
      "id": "flux-pro-image",
      "name": "Flux Pro Image",
      "standard_price_usd": 0.07,
      "starting_price_usd": 0.07,
      "price_unit": "per_image"
    },
    {
      "id": "gpt-4o",
      "name": "GPT-4o",
      "standard_price_usd": 5,
      "starting_price_usd": 5,
      "price_unit": "per_million_tokens"
    },
    {
      "id": "a100-80gb",
      "name": "A100 80GB",
      "standard_price_usd": 2.49,
      "starting_price_usd": 2.49,
      "price_unit": "per_hour"
    }
  ]
}
```

> 外层 `{ code, message, data }` 与项目现有 API 包装格式一致。

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✅ | 定价条目唯一 ID（可与 `model_id` 不同，同一模型可有多个定价 SKU） |
| `model_id` | string | 可选 | 关联控制台模型 ID；有值时前端「View」跳转到 `/models/{model_id}` |
| `name` | string | ✅ | 展示名称 |
| `standard_price_usd` | number | ✅ | 标准单价（USD），见下方精度说明 |
| `starting_price_usd` | number | ✅ | 起价/输入价（USD），表格「价格」列加粗展示 |
| `price_unit` | string | ✅ | 计费单位枚举，见下表；**必填**，前端据此决定单位文案与行标签 |
| `discount_percent` | number | 可选 | 折扣百分比整数，如 `15` 表示 `-15%`；无折扣可省略或 `null` |
| `category` | string | 可选 | 后台分类用（`image-video` \| `language` \| `serverless`）；前端**不筛选、不展示** |
| `media_type` | string | 可选 | 后台分类用（`video` \| `image` \| `llm`）；前端**不筛选、不展示** |

#### `price_unit` 枚举（必填）

| `price_unit` | 适用场景 | 中文单位 | 英文单位 | 价格示例 | 行标签（前端 i18n） |
|---|---|---|---|---|---|
| `per_second` | 视频 | `/秒` | `/s` | `$0.10 /秒` | 起价 |
| `per_image` | 图像 | `/图像` | `/image` | `$0.07 /图像` | 起价 |
| `per_million_tokens` | 语言模型输入 | `/M` | `/M` | `$5 /M` | **输入价格** |
| `per_hour` | Serverless GPU | `/小时` | `/hr` | `$2.49 /小时` | 起价 |

**无效枚举值将导致前端 i18n 缺失，单位无法正确展示。**

#### 金额精度建议

| `price_unit` | 建议精度 | 示例 |
|---|---|---|
| `per_second` | 最多 3 位小数 | `0.084`、`0.1` |
| `per_image` | 最多 3 位小数 | `0.007`、`0.14` |
| `per_million_tokens` | 最多 2 位小数 | `5`、`0.75`、`2.5`、`1.84` |
| `per_hour` | 最多 2 位小数 | `2.49` |

#### 前端展示规则（供后端理解字段用途）

| 表格列 | 使用的字段 | 展示方式 |
|---|---|---|
| 模型 | `name` | 原样展示 |
| 标准价格（USD） | `standard_price_usd` + `price_unit` | `$0.10` + `/秒`（单位由 i18n 渲染） |
| 价格 | `starting_price_usd` + `price_unit` | 行标签：`per_million_tokens` →「输入价格」，其余 →「起价」；金额加粗 + 单位 |
| 折扣 | `discount_percent` | 有值显示 `-15%` 徽章，无值显示 `--` |
| View | `model_id` 或 `id` | 跳转模型详情 |

#### 列表排序

后端按运营配置的排序权重返回即可；前端不做筛选或二次排序。

#### 金额计算建议（后端内部）

若费率存于 `config.model_rates` 的 credits 字段，响应前换算为 USD：

```python
CREDITS_PER_USD = 100  # 示例，以实际配置为准

def credits_to_usd(credits: float, unit: str) -> float:
    decimals = 2 if unit == "per_million_tokens" else 3
    return round(credits / CREDITS_PER_USD, decimals)
```

`discount_percent` 可由后端计算：`(1 - starting / standard) * 100`（四舍五入为整数），或由运营配置表直接存储。

#### 数据来源建议

- 新建 `pricing_catalog` 配置表（或 CMS），与 `model_rates` 解耦。
- `model_id` 外键关联控制台模型，便于「View」跳转；无对应模型时可省略 `model_id`。
- 建议增加 `sort_order` 字段控制列表顺序。

**原因：** 定价页是**面向访客的价目表**（多 SKU、折扣、不同计费单位），与 API 费率接口 `GET /api/models` 的 `{ id, credits_per_second }` 粒度不同，不宜混用。

---

## P1 — 体验增强（非阻塞）

### 2. 多语言名称

前端已通过 `X-Locale` / `Accept-Language` 传递 `en-US` 或 `zh-CN`（见 [`backend-global-adjustments.md`](./backend-global-adjustments.md)）。

**建议：** `name` 按请求 locale 返回对应语言；或返回 `name_en` / `name_zh`，由前端选择（需同步改前端映射）。

### 3. 缓存

定价数据变更频率低，建议：

- `Cache-Control: public, max-age=300`（5 分钟）
- 或 CDN 边缘缓存

---

## 与 `GET /api/models` 的边界

| 接口 | 受众 | 数据 |
|---|---|---|
| `GET /api/pricing` | 访客 / 未登录用户 | 价目表：标准价、起价、折扣、`price_unit` |
| `GET /api/models` | 已登录控制台 | 可用模型 + 计费费率（USD） |

控制台模型费率改造见 [`billing-backend-gaps.md`](./billing-backend-gaps.md) 第 6 节，**不替代**本定价接口。

---

## 联调检查清单

- [ ] 实现 `GET /api/pricing`，公开无需 JWT
- [ ] 在 `rest-api-zh.md` 补充本接口章节
- [ ] 响应使用统一包装 `{ code, message, data }`
- [ ] 所有金额字段为 `_usd` 后缀的 `number`，禁止返回 credits
- [ ] 字段 snake_case：`model_id`、`standard_price_usd`、`starting_price_usd`、`price_unit`、`discount_percent`
- [ ] `price_unit` 仅使用四个合法枚举值（`per_second` / `per_image` / `per_million_tokens` / `per_hour`）
- [ ] `per_million_tokens` 条目金额按百万 tokens 计价（如 `5` 表示 $5/M，不是 $5/1K）
- [ ] `category` / `media_type` 为可选字段（前端不筛选，可省略）
- [ ] `model_id` 有值时对应 `GET /api/models/{model_id}` 可访问的模型
- [ ] 无折扣条目省略 `discount_percent` 或返回 `null`，前端显示 `--`
- [ ] （可选）按 `X-Locale` 返回本地化 `name`

---

## 前端联调状态

前端已完成以下适配，后端实现上述接口即可联调：

| 项 | 状态 | 位置 |
|---|---|---|
| snake_case → camelCase 映射 | ✅ 已完成 | `src/api/pricing.ts` |
| Mock 返回 snake_case + 枚举单位 | ✅ 已完成 | `mock/pricing.ts` |
| 按 `price_unit` i18n 展示单位 | ✅ 已完成 | `src/utils/pricing.ts`、`PricingTableRow.vue` |
| 语言模型「输入价格」标签 | ✅ 已完成 | `per_million_tokens` 时展示 |
| 分类 Tab 筛选 | ❌ 已移除 | 无需后端提供筛选参数 |

---

## 需同步更新的其他文档

| 文档 | 是否需要更新 | 说明 |
|---|---|---|
| **`pricing-backend-gaps.md`（本文）** | ✅ 已对齐最新前端 | 发给后端的主要参考 |
| **`pricing-api-comparison.md`** | ✅ 已对齐 | 前后端差异对比 |
| **`rest-api-zh.md`** | ⚠️ 后端实现后需补充 | 当前无任何 `GET /api/pricing` 描述；建议在「模型接口」章节后新增「定价接口」 |
| **`backend-global-adjustments.md`** | 无需改动 | 时间戳、Locale 等全局规范已覆盖 |
