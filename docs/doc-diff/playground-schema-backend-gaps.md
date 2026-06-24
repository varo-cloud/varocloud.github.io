# Playground 模型 Input Schema — 后端缺口说明

> 面向后端实现。前端 Playground 输入区**完全由模型 Input Schema 驱动**，Schema 通过**独立接口**获取，不再内嵌于 `GET /api/models/{id}`。

参考竞品结构：[WaveSpeed Seedance 2.0 T2V Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-2.0/text-to-video)

---

## 1. 设计原则

1. **Schema 与模型详情分离**：详情接口返回展示/计费字段；Playground 表单单独拉 Schema。
2. **字段命名 snake_case**：与 OpenAPI / JSON Schema 惯例一致。
3. **公开接口**：未登录用户也应能查看 Schema（与 Playground 预览一致）。
4. **Input 子集即可**：前端只消费 `components.schemas.Input`（或直接返回该对象）；完整 OpenAPI 包装也支持，前端会自动提取。

---

## 2. 新增接口

### `GET /api/models/{model_id}/input-schema`

| 项 | 说明 |
|---|---|
| 认证 | **公开**（无需 JWT） |
| Path | `model_id` — 与模型详情接口相同的 ID |
| 成功响应 | 标准 `{ code, message, data }`；`data` 为 **Input Schema 对象** 或 **含 `components.schemas.Input` 的 OpenAPI 文档** |

#### 响应示例（推荐：直接返回 Input）

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "type": "object",
    "example_url": "https://static.wavespeed.ai/examples/dfdcb9026c2f476ca9bf742f80e19fb0/d40dccd0-a2c9-4d00-ac2b-a43712128da8.mp4#t=0.001",
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
        "description": "Reference image URLs to guide visual style, characters, or scene composition.",
        "items": { "type": "string" },
        "maxItems": 9,
        "x-ui-component": "uploaders",
        "x-ui-component-props": { "accept": "image/*" }
      },
      "aspect_ratio": {
        "type": "string",
        "description": "The aspect ratio of the generated video.",
        "enum": ["16:9", "9:16", "4:3", "3:4", "1:1", "21:9"],
        "default": "16:9",
        "x-ui-component": "select"
      },
      "duration": {
        "type": "integer",
        "description": "The duration of the generated video in seconds (4-15s).",
        "minimum": 4,
        "maximum": 15,
        "default": 5,
        "x-ui-component": "slider"
      },
      "enable_web_search": {
        "type": "boolean",
        "description": "Enable web search for real-time information.",
        "default": false
      },
      "generate_audio": {
        "type": "boolean",
        "description": "Whether to generate native audio synchronized with the output video.",
        "default": true
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

---

## 3. Input Schema 字段约定

前端依赖以下结构渲染 Playground 表单：

| 字段 | 类型 | 用途 |
|---|---|---|
| `type` | `"object"` | 固定，表示输入为对象 |
| `properties` | `Record<string, SchemaProperty>` | 各输入字段定义 |
| `required` | `string[]` | 必填字段名列表 |
| `x-order-properties` | `string[]` | **渲染顺序**（按数组顺序展示） |
| `example_url` | `string` | 可选；示例输出 URL，用户未运行模型前在 Playground 右侧默认展示（支持图片 / 视频 / 音频，按扩展名识别） |

### SchemaProperty 常用属性

| 属性 | 说明 |
|---|---|
| `type` | `string` / `integer` / `number` / `boolean` / `array` |
| `description` | 字段说明（展示在 label 旁 info 图标 tooltip） |
| `default` | 默认值（前端初始化表单） |
| `enum` | 枚举选项（配合 `select`） |
| `minimum` / `maximum` / `step` | 数值/滑块约束 |
| `minItems` / `maxItems` | 数组上传数量限制 |
| `items` | 数组元素类型（通常为 `{ "type": "string" }`） |
| `x-ui-component` | UI 组件类型（见下表） |
| `x-ui-component-props` | 组件参数，如 `{ "accept": "image/*" }` |

### `x-ui-component` 枚举

| 值 | 前端组件 | 说明 |
|---|---|---|
| `select` | 下拉选择 | 需配合 `enum` |
| `slider` | 滑块 | 需配合 `minimum` / `maximum` |
| `switch` | 开关 | 通常 `type: boolean`；也可省略，由 `type` 推断 |
| `uploader` | 单文件上传 | 通过 `x-ui-component-props.accept` 区分 image/video/audio |
| `uploaders` | 多文件上传 | 同上，配合 `minItems` / `maxItems` |
| `textarea` | 多行文本 | 如 `prompt` |
| `number` | 数字输入 | 如 `seed` |

---

## 4. 与模型详情接口的关系

| 接口 | 包含 Schema？ |
|---|---|
| `GET /api/models` | 否 |
| `GET /api/models/{id}` | **否**（已从详情移除） |
| `GET /api/models/{id}/input-schema` | **是** |

模型详情仍需返回 `model_path`（如 `bytedance/seedance-2.0/text-to-video`），供 API Tab 与运行请求使用；Schema 按 `model_id` 索引即可。

---

## 5. 前端联调状态

| 项 | 状态 |
|---|---|
| `GET /api/models/{id}/input-schema` API 客户端 | ✅ `src/api/modelSchema.ts` |
| OpenAPI 包装自动提取 Input | ✅ `src/utils/model-schema.ts` |
| `x-order-properties` 排序 | ✅ |
| `required` 必填标记 + 提交校验 | ✅ |
| `x-ui-component` 驱动组件 | ✅（优先于类型推断） |
| `default` 初始值 | ✅ |
| `example_url` 默认示例输出 | ✅ |
| Mock：`seedance-t2v` = Seedance 2.0 T2V 真实 Schema | ✅ `mock/schemas.ts` |

---

## 6. 需同步更新的文档

- `docs/api-doc/rest-api-zh.md` — 新增 Schema 接口说明；从模型详情移除 `input_schema`
- `docs/doc-diff/models-api-comparison.md` — 更新：Schema 不再来自详情接口
- [`playground-run-backend-gaps.md`](./playground-run-backend-gaps.md) — Playground **运行**、代码示例（HTTP/Python/JS）、OpenAI SDK 对接、**按调用方式计费统计**
- [`model-docs-backend-gaps.md`](./model-docs-backend-gaps.md) — API Tab **README / FAQ / api_model_id**
