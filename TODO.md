# TODO

## Cloudflare Turnstile Site Key

**状态：** 待申请

当前开发、测试、生产环境均使用 Cloudflare 官方测试 Site Key（`1x00000000000000000000AA`），人机验证会自动通过，仅用于联调与演示。

### 后续需要做的事

1. 登录 [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
2. 创建 Turnstile 站点，添加正式域名（如生产域名、测试域名）
3. 获取 **Site Key**（前端）与 **Secret Key**（后端校验，若 API 需要）
4. 更新环境变量：
   - `.env.production` → `VITE_TURNSTILE_SITE_KEY=<正式 Site Key>`
   - `.env.staging` → `VITE_TURNSTILE_SITE_KEY=<正式 Site Key>`（可与生产共用或单独创建）
5. 若后端 `request-otp` / `verify-otp` 需要校验 token，同步配置服务端 Secret Key
6. 部署后验证：真实环境下 Turnstile 组件可正常加载，且未通过验证时无法登录

### 参考

- 测试 Key（始终通过）：`1x00000000000000000000AA`
- 相关代码：`src/components/auth/TurnstileWidget.vue`、`src/views/auth/AuthView.vue`
