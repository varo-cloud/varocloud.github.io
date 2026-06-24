# 模型 API 文档 / README / FAQ — 后端缺口说明

> 面向后端实现。  
> 前端页面：`src/views/models/ModelDetailView.vue`、`src/components/models/ModelApiTab.vue`  
> 关联文档：  
> - [`playground-backend-gaps.md`](./playground-backend-gaps.md)（Playground 全量后端缺口：`/v1/generations`、Quote、上传、运行等）  
> - [`models-backend-gaps.md`](./models-backend-gaps.md)（模型列表）

---

## 1. 背景

模型详情页 **API Tab** 已实现，内容分四层：

| 区块 | 数据来源 | 前端实现 |
|---|---|---|
| Quick Start（HTTP / Python / JavaScript） | Schema + 当前 Playground 表单值 + `api_model_id` | `playground-request-snippets.ts` 本地模板生成 |
| 参数表 | Input Schema（`GET /api/models/{id}/input-schema`） | `schema-api-docs.ts` 自动推导，**唯一技术参数来源** |
| README | 后端 Markdown | 特性、定价、场景、技巧等**运营向**内容，**不写参数表** |
| FAQ | 后端 JSON | `ModelApiTab.vue` 手风琴展示 |

Playground 与 API Tab **共享同一份 `formValues`**：用户在 Playground 改参数，切到 API Tab 时代码示例自动更新。

**动态计价**见 [`playground-backend-gaps.md`](./playground-backend-gaps.md) §5：Run 按钮价格应通过 `POST /api/models/{id}/quote` 按当前 `input` 实时计算，**不要**仅使用静态 `per_run_price_usd`。

---

## 2. `GET /api/models/{id}` 需补充字段

在现有模型详情响应上增加：

```json
{
  "id": "seedance-t2v",
  "model_path": "bytedance/seedance-2.0/text-to-video",
  "api_model_id": "dreamina-seedance-2-0-260128",
  "readme_md": "## Seedance 2.0 Text-to-Video\n\n...",
  "faq": [
    {
      "question": "What is the Seedance 2.0 Text-to-Video API?",
      "answer": "POST /v1/generations with your API key..."
    }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `api_model_id` | string | 是 | 外部 `POST /v1/generations` 请求体中的 `model` 值；与 `model_path` 不同 |
| `readme_md` | string | 否 | 模型 README，Markdown 格式；API Tab 底部展示 |
| `faq` | array | 否 | 常见问题；每项含 `question`、`answer`（纯文本或轻量 Markdown） |

### 字段说明

- **`api_model_id`**：详见 [`playground-backend-gaps.md`](./playground-backend-gaps.md) §10；API Tab 与 Playground 代码视图均依赖此字段生成示例。
- **`readme_md`**：运营/文档团队维护的长文案（特性、定价规则、使用技巧、相关模型链接等）。**不要**与 `description`（短摘要）混用，**也不要**重复 Input Schema 参数表（见 §3.1）。
- **`faq`**：按模型配置 3–8 条常见问答；用于 SEO 与降低支持成本。

### 认证

| 接口 | 认证 |
|---|---|
| `GET /api/models/{id}` | **无需登录**（与列表一致） |

---

## 3. 内容维护建议

### 3.1 README 结构（参考 WaveSpeed）

建议每模型 README 包含：

1. 模型简介（1 段）
2. Key Features（列表）
3. Pricing 规则与示例表
4. Best Use Cases
5. Pro Tips
6. Notes / Related Models

**不要在 `readme_md` 里写 Parameters 参数表。** API Tab 上方的「参数说明」由 Input Schema 自动生成，与 Playground 表单、代码示例共用同一数据源；若在 README 再写一遍，内容易漂移、维护成本高。

FAQ 中引用参数时，指向 API Tab 的「参数说明」区块即可（如 *"See the Parameters table in this API tab"*）。

前端用 Markdown 渲染（GFM 表格支持）。定价表等**非 Schema 字段**的业务表格仍放在 README 中。图片 URL 使用 CDN 绝对路径。

### 3.2 FAQ 结构

```json
{
  "question": "How much does each run cost?",
  "answer": "Pricing scales with resolution and duration. See the Playground for live estimates."
}
```

`question` / `answer` 建议英文为主（产品 V1 英文优先）；后续可按 `Accept-Language` 返回多语言版本（见 [`backend-global-adjustments.md`](./backend-global-adjustments.md)）。

### 3.3 与独立 Docs 站的关系

| 来源 | 用途 |
|---|---|
| `readme_md` + `faq` | 模型详情页 API Tab 内嵌（运营向） |
| Input Schema | **参数表** + Playground 表单 + 代码示例字段（技术向，唯一来源） |
| 独立 Docs 站（`/docs`） | 完整 API Reference、鉴权、错误码；参数表同样应从 Schema 生成或引用，勿在 README 重复 |

避免三处各写一套：推荐 CMS 存 `readme_md`，Docs 站引用或扩展同一内容。

---

## 4. 代码示例规范（前端已实现）

API Tab 与 Playground 代码视图共用 `src/utils/playground-request-snippets.ts`：

| 视图 | 端点 | 请求体 |
|---|---|---|
| Playground JSON | `POST /api/playground/generations`（JWT，待后端） | `{ model_id, input, batch_size }` |
| HTTP / Python / JS | `POST /v1/generations` | 扁平 `{ model: api_model_id, ...schema fields }` |
| 轮询 | `GET /v1/generations/{id}` | — |

详见 [`playground-backend-gaps.md`](./playground-backend-gaps.md) §8–§9。

---

## 5. Mock 数据（前端联调）

本地 Mock 已在 `mock/model-docs.ts` 为 `seedance-t2v` 等模型提供示例 `readme_md` / `faq` / `api_model_id`。后端上线后前端改读真实接口即可。

---

## 6. `rest-api-zh.md` 同步清单

- [ ] `GET /api/models/{id}` 响应增加 `api_model_id`、`readme_md`、`faq`
- [ ] 文档说明 `readme_md` 为 Markdown，`faq` 为 `{ question, answer }[]`
- [ ] 说明 API Tab 代码示例中的 `model` 取 `api_model_id`

---

## 7. 实现优先级

| 优先级 | 项 |
|---|---|
| **P0** | `api_model_id`（与 `/v1/generations` 同步上线） |
| **P1** | `readme_md` — 至少首发模型（Seedance T2V） |
| **P1** | `faq` — 3–5 条/模型 |
| **P2** | CMS 后台编辑 README / FAQ |
| **P2** | 多语言 `readme_md` / `faq` 按 locale 返回 |
