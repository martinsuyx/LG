# 后台 Demo —— 页面规格（P3-3 审计日志 / Audit Logs）

## 1. 页面名称（中/英）

审计日志 / Audit Logs

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：报表与总览 → 审计日志
* 权限：`security_admin`（全部：查询/导出/留存策略配置）、`admin`（查询/导出）、`auditor`（只读取证导出）、`org_admin`（可查本组织数据），其余角色无权访问

## 3. 目标与业务价值（1 句话）

集中记录平台关键安全与业务操作，支持可追溯、可取证、可合规留存，保障审计与争议处理。

## 4. 主要用户场景（2–3 个）

* 安全管理员按时间/主体/动作检索日志，定位异常与越权操作。
* 审计员导出取证包（含签名/哈希与事件链），提交外部合规检查。
* 管理员查看高风险事件趋势，优化权限与流程。

## 5. 设计稿链接与断点

* 参考：高保真 V6（报表与总览 · 审计）。
* 断点：≥1440 双栏（左筛选右表格 + 顶部统计卡）；≤1024 单栏折叠。

## 6. 页面组件结构（信息架构）

* **筛选区**：时间范围、事件级别（info/warn/error/security）、事件类型（登录/权限/资金/订单/风控/KYC/导出等）、主体（用户/角色/团队/门店）、来源（web/api/cron/rpa）、资源类型与 ID、IP/UA、结果（success/fail）。
* **统计卡**：总事件数、失败事件数、安全级事件数、导出次数。
* **日志列表**：表格（时间、事件、主体、资源、结果、IP/UA、追踪ID、签名状态、操作）。
* **详情抽屉**：原始事件 JSON、签名/哈希、链式前后事件、上下文（请求参数脱敏）、取证打包按钮。
* **操作区**：导出、取证打包、查看留存策略、刷新。

## 7. 事件模型（字段名/类型/必填/校验/示例/控件）

* **AuditEvent**：

  * `event_id`(string, 只读, UUID)
  * `ts`(datetime, 必填, ISO8601 with tz)
  * `level`(enum: info|warn|error|security)
  * `type`(enum: login_success|login_fail|permission_change|user_create|user_delete|role_grant|order_review|withdraw_payout|wallet_export|risk_hit_ignore|risk_ticket_resolve|kyc_approve|kyc_reject|export_download|config_change|api_access|data_view|data_change|... 可扩展)
  * `actor`(object)：{`user_id`, `name?`, `roles[]`, `org_id?`}
  * `source`(enum: web|api|cron|rpa|callback)
  * `resource`(object)：{`type`(order|user|role|team|store|wallet|withdraw|risk_hit|ticket|kyc|export|config|report|other), `id`}
  * `action`(string)：如 approve/reject/create/update/delete/download
  * `result`(enum: success|fail)
  * `reason?`(string)：失败/拒绝原因
  * `ip`(string)、`ua`(string)
  * `trace_id`(string)：跨服务追踪
  * `signature`(object)：{`algo`(SHA256|SM3), `hash`, `prev_hash`, `chain_ok`(bool)}
  * `redactions[]?`：被脱敏字段键路径列表
  * `extra?`(object)：扩展数据（如变更 diff、金额、阈值等）

> **链式签名**：`prev_hash` 引用上一个事件哈希，形成可验证的“区块式”事件链（每日/每小时轮换起点）。

## 8. 操作/按钮（权限/确认/提示）

* **下载 CSV/XLSX**：`POST /api/v1/audit/export`（异步任务）。
* **取证打包**：`POST /api/v1/audit/evidence` body: {event_ids[]|range, include_context: bool} → 生成 zip（含 JSON、签名链、校验脚本、README）。
* **校验签名**：详情页点击“验证链完整性”→ 调用 `GET /api/v1/audit/verify?from=...&to=...`。
* **查看留存策略**：打开策略侧栏；有权限可编辑并提交审批。
* **复制 cURL**：复制带时间/类型过滤的 API 查询示例。

## 9. API 合约（方法/URL/参数/响应示例/错误码）

* **列表**：`GET /api/v1/audit/events?start=...&end=...&type=export_download&result=fail&page=1&page_size=50`

```json
{
  "total": 1280,
  "page": 1,
  "page_size": 50,
  "items": [
    {"event_id":"A202510030001","ts":"2025-10-03T10:00:12+08:00","level":"security","type":"export_download","actor":{"user_id":"U1001","roles":["finance"]},"source":"web","resource":{"type":"export","id":"E20251003001"},"action":"download","result":"fail","ip":"203.0.113.10","ua":"Chrome/140","trace_id":"tr-9ab...","signature":{"algo":"SHA256","hash":"abc...","prev_hash":"def...","chain_ok":true}}
  ]
}
```

* **详情**：`GET /api/v1/audit/events/{event_id}` → 原始 JSON + 签名 + 上下文摘要。
* **导出**：`POST /api/v1/audit/export` → `{export_id}`；`GET /api/v1/exports/{export_id}`。
* **取证打包**：`POST /api/v1/audit/evidence` → `{package_id, download_url}`。
* **链验证**：`GET /api/v1/audit/verify?from=...&to=...` → `{ok, first_hash, last_hash, broken_links[]}`。
* **策略**：`GET /api/v1/audit/retention_policy` / `PUT /api/v1/audit/retention_policy`（需审批流）。
* **错误码**：`400` 参数错误；`403` 权限不足；`404` 事件不存在；`409` 策略冲突；`423` 取证包生成中；`500` 服务异常。

## 10. Mock 数据（≥3 条代表性）

* `mocks/audit/events.page1.json`（见列表示例）
* `mocks/audit/event.detail.json`

```json
{"event_id":"A202510030001","ts":"2025-10-03T10:00:12+08:00","level":"security","type":"export_download","actor":{"user_id":"U1001","roles":["finance"]},"source":"web","resource":{"type":"export","id":"E20251003001"},"action":"download","result":"fail","reason":"signature expired","ip":"203.0.113.10","ua":"Chrome/140","trace_id":"tr-9ab...","signature":{"algo":"SHA256","hash":"abc...","prev_hash":"def...","chain_ok":true},"redactions":["extra.token"],"extra":{"params_hash":"9f1..."}}
```

* `mocks/audit/verify.ok.json`

```json
{"ok":true,"first_hash":"aaa...","last_hash":"zzz...","broken_links":[]}
```

## 11. 状态机与流程

* **事件写入**：`received → validated → signed → stored`；失败进入 `error` 并报警。
* **取证包**：`requested → bundling → ready|failed`。
* **策略修改**：`draft → pending_approval → approved|rejected`（策略生效需二人审）。

## 12. 合规与留存策略（180/365 天等）

* **留存周期**：按事件类型配置（默认 365 天，安全事件 730 天，可按组织/地区覆盖）。
* **冻结（Legal Hold）**：特定事件范围在调查期间暂停删除。
* **删除机制**：到期触发归档/删除任务（可选冷存储）；删除日志记录到 `audit_retention`。
* **WORM 存储**（可选）：对关键日志使用不可修改（Write-Once-Read-Many）策略/对象锁。
* **哈希链与时间戳**：每日生成链首公证（时间戳服务），支持外部验证。
* **脱敏**：对 PII/密钥字段在存储前脱敏/加密，详情页显示红acted 字段路径。

## 13. 边界条件与异常场景

* 查询跨度过大（>90 天）：建议使用导出任务。
* 明细中包含敏感字段：仅显示脱敏值与字段路径，原值需更高权限通过取证包访问。
* 链验证失败：标红提示并提供修复指导（定位断点区间）。
* 策略冲突：地区/组织覆盖与全局策略冲突时需审批决议。

## 14. 交互细节

* 表格多列固定（时间/事件/主体/资源/结果），支持横向滚动。
* IP/UA 列 hover 显示解析详情（归属地、设备）。
* 详情抽屉的 JSON 支持折叠/搜索/复制；签名/哈希可一键复制。
* 取证打包弹窗可选择范围、是否包含上下文、是否包含图片证据。

## 15. 可用性/无障碍要点

* 键盘导航：上下移动选中行，Enter 打开详情；Esc 关闭。
* 高对比度配色与状态图标；屏幕阅读器朗读表头与单元格内容。
* 大量 JSON 文本提供可视化树结构与可展开的键路径。

## 16. 性能与分页要求

* 列表接口 < 800ms；详情 < 400ms。
* 分页默认 50/页，最大 200；深翻页使用游标。
* 后端索引：`ts`、`type`、`actor.user_id`、`resource.type+id`、`trace_id`。
* 导出与取证走异步任务；状态轮询 5s。

## 17. 日志/审计点（元审计）

* `audit_view|audit_export|audit_evidence|audit_verify|audit_retention_update|audit_policy_approve`（记录操作者/原因/差异）。

## 18. 监控/埋点事件

* `page_view:audit_logs`
* `filter_change:audit_logs` {field, from, to}
* `audit_export_click` {filters_hash}
* `audit_evidence_click` {range}
* `audit_verify_click` {from, to}

## 19. 交付物清单

* 设计稿：`audit-logs.fig`。
* OpenAPI 片段：`openapi/audit.events.list.yaml`、`audit.events.detail.yaml`、`audit.export.yaml`、`audit.evidence.yaml`、`audit.verify.yaml`、`audit.retention.policy.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/audit-logs.spec.ts`。
* 验收 checklist：`acceptance/audit-logs-checklist.md`。

## 20. 签收（安全/合规/产品/QA/日期）

* 安全负责人：____  合规：____  产品：____  QA：____  日期：____
