# API Keys 页 — 后端接口缺失清单

> 供后端开发参考。前端页面：`src/views/api-keys/ApiKeysView.vue`  
> 对比文档：[`api-keys-api-comparison.md`](./api-keys-api-comparison.md)

---

## P0 — 阻塞完整联调

### 1. API Key 命名 `name`

**现状：** `POST /api/api-keys` 无请求体；`GET /api/api-keys` 响应无 `name` 字段。

**前端需要：**

创建时传入名称：

```json
{ "name": "production" }
```

列表/创建响应中包含：

```json
{
  "id": "uuid",
  "name": "production",
  "prefix": "sk_live_1f78",
  "created_at": "2026-06-11T11:56:41Z",
  "is_active": true
}
```

**原因：** 页面「Name」列与创建弹窗均要求用户为 Key 指定可读名称（如 production / staging），便于区分多个 Key。当前只能用 `prefix` 回退显示，体验不足。

**建议：**

- `api_keys` 表增加 `name` 字段（varchar，用户自定义，可重复）
- `POST` 接受 `{ "name": "..." }`（必填或默认 `"Untitled"`）
- `GET` 列表返回 `name`

---

## P1 — 表格完整体验

### 2. 单 Key 用量统计

**现状：** 后端无 per-key 用量接口。`GET /api/usage` 返回用户级视频生成记录，不含 API Key 维度。

**前端表格「Calls / Spend」「Last Used」列需要：**

| 字段 | 类型 | 说明 |
|---|---|---|
| `total_calls` | integer | 该 Key 累计 API 调用次数 |
| `total_spend_credits` | integer | 该 Key 累计消耗 credits（建议用 credits 而非 USD，与计费体系一致） |
| `last_used_at` | string (ISO8601) \| null | 最后一次使用时间 |

**建议方案 A（推荐）：** 在 `GET /api/api-keys` 列表响应中直接附带上述字段（聚合查询或冗余计数）。

**建议方案 B：** 新增 `GET /api/api-keys/{key_id}/usage` 详情接口；前端需 N+1 请求，不推荐。

**前端适配说明：** 若后端提供 `total_spend_credits`，前端将把「Spend」列从 USD 改为 credits 展示（与充值页余额单位一致）。

---

### 3. 已撤销 Key 的列表策略

**现状：** 文档写「查询当前用户所有**有效的** API Key」，未明确 `is_active: false` 是否返回。

**前端行为：** 表格展示 Active / Revoked 两种状态；Mock 数据包含已撤销行。

**需后端确认：**

| 策略 | 前端影响 |
|---|---|
| 仅返回 `is_active: true` | 删除后 Key 从列表消失（当前 DELETE mock 行为） |
| 返回全部，含 `is_active: false` | 删除后显示 Revoked 状态，不可再使用 |

请明确文档与实现，前端可按策略调整 UI（隐藏 Revoked 行 vs 保留展示）。

---

## P2 — 体验优化

### 4. 删除语义对齐

**现状：** 后端接口为「撤销（revoke）」，响应 `{ "revoked": true }`；前端 UI 文案为「Delete」。

**建议：** 保持 revoke 语义即可，无需改接口。若产品希望软删除后仍可见，配合 P1-3 返回 `is_active: false` 记录。

---

### 5. 创建响应补充 `name`

**现状：** `POST` 响应仅 `{ id, key, prefix, created_at }`。

**建议：** 创建响应也返回 `name`，与列表字段一致，避免前端仅依赖本地状态。

---

## 联调检查清单

- [ ] `GET /api/api-keys` 返回 `prefix`、`created_at`、`is_active`（snake_case）
- [ ] `POST /api/api-keys` 接受并持久化 `name`
- [ ] `POST` 响应 `key` 仅返回一次
- [ ] `DELETE /api/api-keys/{id}` 返回 `{ "revoked": true }`
- [ ] （P1）列表含 `total_calls`、`total_spend_credits`、`last_used_at`
- [ ] （P1）明确 revoked Key 是否在列表中返回
