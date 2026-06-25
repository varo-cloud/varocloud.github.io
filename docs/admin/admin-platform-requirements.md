# 管理后台功能需求 — 总览索引

> **版本：** v1.2  
> **日期：** 2026-06-25  
> **受众：** 管理后台前端团队、后端团队

---

## 文档结构

本目录按职责拆为三份文档：

| 文档 | 路径 | 受众 | 内容 |
|---|---|---|---|
| **总览索引** | 本文 | 全员 | 背景、模块总览、里程碑、开放问题 |
| **后端 API 专章** | [admin-backend-api.md](./admin-backend-api.md) | 后端 | 鉴权、接口清单、请求/响应、业务规则、数据模型 |
| **前端页面专章** | [admin-frontend-pages.md](./admin-frontend-pages.md) | 前端 | 工程方案、路由、页面线框、组件、交互规范 |

---

## 1. 背景

**Varo AI 视频生成平台**（用户端 [frontend-web](../../README.md) + [genflow-api](../api-doc/rest-api-zh.md)）V1 面向海外开发者提供视频生成 Web Playground + REST API。

**管理后台（Admin Console）** 为内部运营与研发工具，**不面向终端用户**。V1 无需定制视觉，组件库快速搭建即可（参见 [产品 V1 功能调研](../Wavespeed%20&%20Atlascloud%20功能调研.md) §3）。

### 用户端模块摘要

| 模块 | 路径 | 说明 |
|---|---|---|
| 模型目录 | `/`、`/models/:id` | Playground、API Tab |
| 定价页 | `/pricing` | 全量价目表 |
| API Keys | `/api-keys` | 密钥管理 |
| 计费 | `/billing` | Stripe 充值、流水 |
| 认证 | `/auth` | 邮箱 OTP |
| 外部 API | `/v1/generations` | API Key 调用 |

### 当前缺口

| 能力 | 现状 |
|---|---|
| 模型与定价配置 | SQL 直改 `config.model_rates` |
| 运营管理 | 无 UI |
| 手动充值 | 仅有 `POST /api/admin/credits/topup`（文档已定义） |

---

## 2. 角色与权限（摘要）

| 角色 | 标识 | 范围 |
|---|---|---|
| 普通用户 | `user` | 用户端 `/api/*` |
| 管理员 | `admin` | `/api/admin/*` |

- 登录：与用户端相同 OTP；管理员账号 DB 预设 `role=admin`
- 鉴权：`Authorization: Bearer <token>` + `role === admin`，否则 403
- 审计（P1）：写操作记入 `admin_audit_logs`

> 详见 [后端 API 专章 §2](./admin-backend-api.md#2-鉴权与权限)

---

## 3. 功能模块总览

```
管理后台
├── P0 仪表盘          — 核心指标概览
├── P0 用户管理        — 查询、详情、手动调账
├── P0 模型管理        — CRUD、上下架、定价、Schema
├── P0 生成任务        — 全站任务列表、失败排查、手动退款
├── P0 充值订单        — Stripe 交易、pending 监控
├── P1 定价目录        — 定价页条目（可与模型管理合并）
├── P1 系统配置        — 套餐、体验金、限流
├── P1 API Key 管理    — 跨用户查询与撤销
├── P2 内容管理        — README / FAQ 可视化编辑
└── P2 运营工具        — Promo Code、批量赠送
```

| 模块 | 后端详述 | 前端详述 |
|---|---|---|
| 仪表盘 | [API §5.1](./admin-backend-api.md#51-仪表盘) | [页面 §5.2](./admin-frontend-pages.md#52-仪表盘-dashboard) |
| 用户管理 | [API §5.2](./admin-backend-api.md#52-用户管理) | [页面 §5.3–5.4](./admin-frontend-pages.md#53-用户列表-users) |
| 模型管理 | [API §5.3](./admin-backend-api.md#53-模型管理) | [页面 §5.5–5.6](./admin-frontend-pages.md#55-模型列表-models) |
| 生成任务 | [API §5.5](./admin-backend-api.md#55-生成任务) | [页面 §5.7–5.8](./admin-frontend-pages.md#57-任务列表-generations) |
| 充值订单 | [API §5.6](./admin-backend-api.md#56-充值订单) | [页面 §5.9](./admin-frontend-pages.md#59-充值订单-billingtransactions) |
| 系统配置 | [API §5.7](./admin-backend-api.md#57-系统配置p1) | [页面 §5.12](./admin-frontend-pages.md#512-系统配置-settingsp1) |
| API Keys | [API §5.8](./admin-backend-api.md#58-api-key-管理p1) | [页面 §5.10](./admin-frontend-pages.md#510-api-key-管理-api-keysp1) |
| 定价目录 | [API §5.4](./admin-backend-api.md#54-定价目录p1) | [页面 §5.11](./admin-frontend-pages.md#511-定价目录-pricingp1) |

---

## 4. 与用户端能力对照

| 用户端能力 | Admin 支撑 |
|---|---|
| Models 首页 | 模型管理：展示字段（多语言）、上下架、排序 |
| Playground | Input Schema 编辑；任务监控 |
| 模型 API Tab | `api_model_id`、多语言 `readme_md` / `faq` |
| 定价页 | 多语言 `name` + 定价字段或定价目录 |
| API Keys | 用户详情 Tab + 全站 Key 管理 |
| Billing / Stripe | 充值订单；套餐配置 |
| 注册体验金 | `signup_bonus_usd` + bonus 调账 |
| 生成失败退款 | 自动退款 + 手动退款 |

---

## 4.1 多语言策略

用户端 [frontend-web](../../README.md) 支持 `en-US` / `zh-CN`；Admin 与之对齐的方式如下：

| 范围 | 是否多语言 | 说明 |
|---|---|---|
| **Admin Console 界面** | **否** | 菜单、按钮、表格列等固定单一语言（建议中文），不引入 `vue-i18n` |
| **Admin 配置的用户端内容** | **是** | 模型名、描述、README、FAQ、定价名称等须存 `en-US` + `zh-CN` |
| Admin API 错误 message | 否 | 固定英文 |
| 用户端公开 API | 是 | 按 `X-Locale` 返回单语言 string；缺 locale 时 fallback `en-US` |

**数据形态：** Admin 读写 `LocalizedString`（`{ "en-US": "...", "zh-CN": "..." }`）；公开 `GET /api/models`、`GET /api/pricing` 等按 locale 解析后返回 string。

> 详见 [后端 API §3.3](./admin-backend-api.md#33-用户端内容多语言) · [前端页面 §2.5](./admin-frontend-pages.md#25-多语言策略)

---

## 5. 实施里程碑

### Phase 1 — 可运营（P0，约 1～1.5 周）

**后端：** 鉴权中间件 · users / models / generations / billing · balance-adjustment · refund · 模型展示字段多语言

**前端：** 独立工程 · 登录 · Dashboard · Users · Models（含语言子 Tab）· Generations · Billing

**验收：** 运营可完成「上新模型 → 充值异常排查 → 失败任务退款」，无需 SQL。

### Phase 2 — 效率提升（P1，约 1 周）

**后端：** config · pricing · api-keys · user suspend · audit logs · billing 异常处理 · readme/faq/定价名称多语言

**前端：** Settings · API Keys · Pricing（或合并模型页）· 审计日志 · 文档 FAQ 多语言编辑

### Phase 3 — 运营增强（P2）

Promo Code · 批量赠送 · FAQ 富文本 · 公告等多语言运营内容

---

## 6. 关联文档

| 文档 | 路径 |
|---|---|
| 产品 V1 范围 | [Wavespeed & Atlascloud 功能调研.md](../Wavespeed%20&%20Atlascloud%20功能调研.md) |
| REST API | [rest-api-zh.md](../api-doc/rest-api-zh.md) |
| 认证 / Stripe | [auth-zh.md](../api-doc/auth-zh.md) · [stripe-zh.md](../api-doc/stripe-zh.md) |
| 用户端缺口 doc-diff | [models-backend-gaps.md](../doc-diff/models-backend-gaps.md) 等 |
| 用户端类型 | [src/types/index.ts](../../src/types/index.ts) |

---

## 7. 开放问题（待产品确认）

| # | 问题 | 建议 |
|---|---|---|
| 1 | Admin 独立域名？ | `admin.varo.cloud` |
| 2 | 定价页独立 Admin 模块？ | V1 与模型编辑合并 |
| 3 | Admin 展示 credits？ | 列表仅 USD；详情可折叠 credits |
| 4 | 注册体验金自动 vs 人工？ | 自动发放 + Admin 补发 |
| 5 | super-admin 细分权限？ | V1 单 `admin` 角色 |
| 6 | Schema 可视化构建器？ | V1 JSON Editor |
| 7 | Admin 界面是否 i18n？ | **已确认：否**；仅用户端内容多语言（§4.1） |

---

**维护说明：** 接口变更更新 [admin-backend-api.md](./admin-backend-api.md)；页面变更更新 [admin-frontend-pages.md](./admin-frontend-pages.md)。
