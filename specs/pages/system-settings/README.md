# 后台 Demo —— 页面规格（P3-4 系统设置 / System Settings）

## 1. 页面名称（中/英）

系统设置 / System Settings

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：系统与治理 → 系统设置
* 权限：`admin`（全部）、`security_admin`（证书/密钥/SSO/JWT/审计策略）、`ops_admin`（上传策略/通知与回调/任务阈值）、`finance`（货币/小数精度只读）、其余角色无访问

## 3. 目标与业务价值（1 句话）

统一配置平台级别的安全、合规模块与运行参数（上传、证书、密钥、特性开关、通知、国际化/时区/货币、SSO/JWT），保障系统稳定与合规运营。

## 4. 主要用户场景（2–3 个）

* 安全管理员维护 JWT/SSO、证书与密钥轮换，最小化凭证泄漏风险。
* 运维配置上传策略、回调与通知通道（Webhooks/邮件/IM），控制限流与任务阈值。
* 管理员管理 Feature Flags，灰度启用新功能，回滚异常配置。

## 5. 设计稿链接与断点

* 参考：高保真 V6（系统设置）。
* 断点：≥1280 左侧分组导航 + 右侧设置卡；≤1024 单栏折叠。

## 6. 页面组件结构（信息架构）

* 左侧分组：

  1. 上传策略（Uploads）
  2. 证书与密钥（Certificates & Secrets）
  3. 开关（Feature Flags）
  4. 通知与回调（Notifications & Webhooks）
  5. 国际化（I18N：时区/货币/小数精度）
  6. 认证与单点（SSO/JWT）
* 右侧为各分组的设置表单/列表/历史记录与操作日志抽屉。

## 7. 字段清单（字段名/类型/必填/校验/示例/控件）

### 7.1 上传策略 Uploads

* `provider`(enum: aliyun|aws|gcp|minio, 必填)
* `bucket`(string, 必填)
* `region`(string)
* `key_tpls[]`：{`biz`(order_attachment|kyc|export|avatar), `template`(如 `orders/${date}/${uuid}.jpg`)，`ttl_seconds`(int ≥300)}
* `max_size_mb`(int ≤50)
* `allow_types[]`(jpg|png|pdf|csv|xlsx)
* `sts_ttl_seconds`(int，默认 900)
* `cdn_domain?`(string)
* `audited_by`(user_id，自动填充)

### 7.2 证书与密钥 Certificates & Secrets

* `items[]`：{`id`, `name`, `type`(tls_cert|api_key|jwt_signing|encryption_key), `kid`(key id), `status`(active|rolling|revoked), `created_at`, `expires_at?`, `last_rotated_at?`, `scope`(global|env|service), `tags[]`, `creator`}
* `rotation_policy`：{`rotate_every_days`(int), `overlap_days`(int), `notify_before_days`(int)}
* `kms_provider`(enum: local|aliyun_kms|aws_kms|gcp_kms)，`vault_path`(string)

### 7.3 开关 Feature Flags

* `flags[]`：{`flag_key`, `name`, `desc`, `status`(on|off|gray), `gray_percent?`(0–100), `conditions?`(region|role|tenant), `owner`, `created_at`, `updated_at`}

### 7.4 通知与回调 Notifications & Webhooks

* `channels[]`：{`channel`(email|feishu|slack|webhook), `name`, `endpoint`(url/email), `secret?`, `enabled`(bool), `retry`:{`max_times`(int), `backoff`(linear|exp), `interval_sec`}}
* `templates[]`：{`tpl_key`, `title`, `content`(支持变量), `channel[]`}
* `subscriptions[]`：{`event_key`, `channels[]`, `filters`(severity|module|tenant)}

### 7.5 I18N（时区/货币/小数精度）

* `default_timezone`(IANA TZ，如 Asia/Shanghai)
* `default_currency`(CNY|HKD|USD|...)
* `decimal_scale`：{`money`(int 2–4), `percent`(1–3), `weight`(0–3)}
* `locale_options[]`：{`company_id`, `timezone`, `currency`, `decimal_overrides?`}

### 7.6 SSO/JWT

* `jwt`：{`issuer`, `audience`, `alg`(RS256|ES256|HS256), `kid_active`, `jwks_endpoint?`, `access_ttl_minutes`(5–120), `refresh_ttl_days`(1–30), `clock_skew_sec`(≤60)}
* `sso`：{`type`(oauth2|saml2|oidc), `client_id`, `redirect_uri`, `issuer`, `auth_url`, `token_url`, `logout_url?`, `scopes[]`, `mapping`:{`email`→`username`, `groups`→`roles[]`}}

## 8. 操作/按钮（权限/确认/提示）

* **保存设置**：所有分组表单支持草稿 → 提交 → 审批（可配置需要二人审）。
* **测试连接**（Uploads/通知/SSO）：实时检测并回显结果。
* **生成/轮换密钥**：`POST /api/v1/settings/secrets/{id}/rotate`，支持“滚动期”并并行允许旧/新共存。
* **启用/停用开关**：灰度需填写范围与阈值，默认带回滚选项。
* **发送测试通知**：`POST /api/v1/settings/notify/test`（选择模板+目标）。
* **导出配置**：生成只读配置包（脱敏）供审计。
* **查看操作日志**：右侧抽屉显示最近 100 条。

## 9. API 合约（方法/URL/参数/响应示例/错误码）

* **读取全部设置**：`GET /api/v1/settings` → 按分组返回。
* **保存分组设置**：`PUT /api/v1/settings/{group}`（uploads|secrets|flags|notify|i18n|auth）→ `{draft_id}`
* **提交流程**：`POST /api/v1/settings/{group}/submit` → `{approval_id}`；`POST /api/v1/settings/{group}/approve|reject`
* **测试连接**：`POST /api/v1/settings/{group}/test` → `{ok:true, detail}`
* **密钥轮换**：`POST /api/v1/settings/secrets/{id}/rotate` → `{ok:true, kid_new, effective_at}`
* **下载配置包**：`POST /api/v1/settings/export` → `{export_id}`；`GET /api/v1/exports/{export_id}`
* **错误码**：`400` 不合法；`403` 权限不足；`409` 冲突（灰度范围重叠/密钥状态）；`422` 校验失败；`500` 异常。

## 10. Mock 数据（≥3 条代表性）

* `mocks/settings/uploads.json`

```json
{"provider":"aliyun","bucket":"lg-prod","region":"cn-guangzhou","key_tpls":[{"biz":"order_attachment","template":"orders/${date}/${uuid}.jpg","ttl_seconds":86400}],"max_size_mb":10,"allow_types":["jpg","png","pdf"],"sts_ttl_seconds":900,"cdn_domain":"https://cdn.example.com"}
```

* `mocks/settings/flags.json`

```json
{"flags":[{"flag_key":"wallet_v2","name":"钱包2.0","status":"gray","gray_percent":20,"conditions":{"region":["GZ"]},"owner":"product"}]}
```

* `mocks/settings/auth.json`

```json
{"jwt":{"issuer":"lg-platform","audience":"lg-clients","alg":"RS256","kid_active":"kid-202510","access_ttl_minutes":30,"refresh_ttl_days":7},"sso":{"type":"oidc","client_id":"abc123","redirect_uri":"https://admin.example.com/callback","issuer":"https://login.example.com","auth_url":"/auth","token_url":"/token","scopes":["openid","profile","email"],"mapping":{"email":"username","groups":"roles"}}}
```

## 11. 状态机与流程

* **设置变更**：`editing → submitted → approved|rejected → effective`；必要时支持 `rollback`。
* **密钥轮换**：`active → rolling(并行有效) → active(new) → revoked(old)`。
* **开关灰度**：`off → gray(%, 条件) → on | rollback(off)`。

## 12. 边界条件与异常场景

* 上传策略与权限冲突（biz 未授权）：提交阻断并提示修正。
* 密钥将到期未轮换：仪表盘告警 + 邮件/IM 提醒。
* JWT kid 不存在或算法不匹配：拒绝保存并提示。
* Webhook 失败率高于阈值：自动降级并暂停通道，要求人工复核。
* 小数精度与财务报表不一致：保存前进行全局校验。

## 13. 交互细节

* 所有敏感值（密钥/证书/secret）**默认打码**，支持一键复制（2 秒揭示）。
* 保存为草稿不生效；提交后进入审批流（侧栏显示审批记录）。
* 变更预览 diff：高亮新增/修改/删除字段。
* 灰度开关提供“自动回滚条件”（错误率/报警指标）。

## 14. 可用性/无障碍要点

* 表单分组清晰、Tab 顺序合理；错误就近提示。
* 开关/选择器可键盘操作；提供 aria 标签与帮助说明。
* 长表单支持锚点与返回顶部。

## 15. 性能与分页要求

* 读取全部设置 < 600ms；保存与测试连接 < 1s（测试外部依赖除外）。
* 历史记录分页 20/页；支持按操作人/时间排序。
* 轮换与灰度操作走后台任务并实时更新状态。

## 16. 日志/审计点

* `settings_update|submit|approve|reject|export`
* `secret_rotate|secret_revoke`
* `feature_flag_change`
* `notify_channel_test`
* `auth_config_change`（JWT/SSO）

## 17. 监控/埋点事件

* `page_view:system_settings`
* `settings_test_click` {group}
* `feature_flag_toggle` {flag_key, to}
* `secret_rotate_click` {id}

## 18. 验收标准（Checklist）

* [ ] 各分组表单可保存草稿、提交、审批与生效；变更 diff 正确。
* [ ] 上传策略可获取 STS 并成功直传；大小/类型限制生效。
* [ ] 证书与密钥可轮换并记录审计；旧密钥在滚动期并行有效。
* [ ] Feature Flags 支持灰度与回滚；条件命中逻辑正确。
* [ ] 通知与回调通道可测试、失败自动退避并报警。
* [ ] I18N 设置影响金额/百分比/时间展示；与报表一致。
* [ ] SSO/JWT 配置通过连通性测试；签发/验签成功。
* [ ] e2e：修改上传策略 → 测试直传 → 轮换 JWT key → 打开灰度开关 → 发送测试通知。

## 19. 交付物清单

* 设计稿：`system-settings.fig`。
* OpenAPI 片段：`openapi/settings.read.yaml`、`settings.update.yaml`、`settings.submit.yaml`、`settings.approve.yaml`、`settings.test.yaml`、`settings.secrets.rotate.yaml`、`settings.export.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/system-settings.spec.ts`。
* 验收 checklist：`acceptance/system-settings-checklist.md`。

## 20. 签收（安全/运维/产品/QA/日期）

* 安全负责人：____  运维：____  产品：____  QA：____  日期：____
