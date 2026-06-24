# API Keys 页接口对比（前端 vs 后端文档）

> 对比基准  
> - 前端：`src/views/api-keys/ApiKeysView.vue`、`src/api/api-keys.ts`  
> - 后端：`docs/api-doc/rest-api-zh.md`（API Key 接口章节）  
> - 日期：2026-06-22

---

## 总览

| 前端调用 | 后端文档 | 状态 |
|---|---|---|
| `GET /api/api-keys` | `GET /api/api-keys` | ⚠️ 部分覆盖（字段差异 + 缺用量统计） |
| `POST /api/api-keys` | `POST /api/api-keys` | ⚠️ 部分覆盖（缺 `name` 请求/响应） |
| `DELETE /api/api-keys/{id}` | `DELETE /api/api-keys/{key_id}` | ✅ 已覆盖（路径参数名不同，响应已适配） |

三个核心接口后端均已提供，无完全缺失的端点。主要差异在**字段命名**与**业务字段缺失**。

---

## 1. 列表 `GET /api/api-keys`

### 后端文档响应

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

### 前端表格使用字段

| 前端字段 | 后端字段 | 状态 | 说明 |
|---|---|---|---|
| `id` | `id` | ✅ | 一致 |
| `name` | — | ❌ 缺失 | 前端「Name」列；无后端字段时回退为 `prefix` |
| `keyMasked` | `prefix` | ✅ 已映射 | 前端 API 层 `prefix` → `keyMasked` |
| `createdAt` | `created_at` | ✅ 已映射 | ISO8601 → Unix ms |
| `status` | `is_active` | ✅ 已映射 | `true` → `active`，`false` → `revoked` |
| `totalCalls` | — | ❌ 缺失 | 前端「Calls / Spend」列之调用次数 |
| `totalSpendUsd` | — | ❌ 缺失 | 前端「Calls / Spend」列之消耗金额 |
| `lastUsedAt` | — | ❌ 缺失 | 前端「Last Used」列 |

### 前端已做适配

`src/api/api-keys.ts` 中 `mapApiKey()` 负责 snake_case → camelCase 转换；缺失字段默认 `0` / `null`，`name` 回退为 `prefix`。

---

## 2. 创建 `POST /api/api-keys`

### 后端文档

**请求体：** 无（不接收任何参数）

**响应 200：**

```json
{
  "id": "uuid",
  "key": "sk_live_abc123...",
  "prefix": "sk_live_1f78",
  "created_at": "2026-06-11T11:56:41Z"
}
```

### 前端使用

| 场景 | 前端字段 | 后端字段 | 状态 |
|---|---|---|---|
| 请求 | `{ name: string }` | — | ❌ 后端未定义 `name` 参数 |
| 响应 — 完整 key | `key` | `key` | ✅ |
| 响应 — ID | `id` | `id` | ✅ |
| 响应 — 创建时间 | `createdAt` | `created_at` | ✅ 已映射 |
| 响应 — 名称 | `name` | — | ❌ 前端用请求时的 `name` 本地保存 |

创建弹窗要求用户输入 Key name，但后端当前不支持命名。联调时 `name` 仅在前端内存中保留，刷新列表后会回退显示 `prefix`。

---

## 3. 删除 `DELETE /api/api-keys/{key_id}`

### 后端文档响应

```json
{ "revoked": true }
```

### 前端使用

| 项 | 说明 |
|---|---|
| 路径 | 前端 `DELETE /api/api-keys/{id}`，与后端 `{key_id}` 语义一致 ✅ |
| 响应 | 前端忽略响应体，仅判断请求成功 ✅ |

---

## 4. 业务逻辑差异

| 差异点 | 前端行为 | 后端文档 |
|---|---|---|
| 已撤销 Key 是否展示 | 列表展示 `revoked` 状态行 | 文档描述为「有效的 API Key」，未说明是否返回 `is_active: false` 的记录 |
| 删除 vs 撤销 | UI 文案为「Delete」，删除后从列表移除 | 接口语义为「撤销（revoke）」，响应 `{ revoked: true }` |
| 消耗单位 | UI 以 USD 格式化 `totalSpendUsd` | 系统计费单位为 **credits**，无 per-key 用量接口 |

---

## 5. 前端已修改项（2026-06-22）

| 文件 | 变更 |
|---|---|
| `src/api/api-keys.ts` | 新增 `ApiApiKey` 类型与 `mapApiKey` / `mapCreateApiKeyResult` 映射 |
| `src/types/index.ts` | 补充字段来源 JSDoc |
| `mock/api-keys.ts` | Mock 响应改为 snake_case，贴近后端格式 |

---

## 6. 需后端补充的项

详见 [`api-keys-backend-gaps.md`](./api-keys-backend-gaps.md)。
