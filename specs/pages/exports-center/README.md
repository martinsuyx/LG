# 后台 Demo —— 页面规格（P3-2 导出中心 / Exports · Jobs）

## 1. 页面名称（中/英）

导出中心 / Exports · Jobs

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：报表与总览 → 导出中心
* 权限：`admin`（全部导出/管理）、`finance`（可下载金额类导出）、`risk`（可下载风控类导出）、`operator`（仅下载与本人权限相关的导出）

## 3. 目标与业务价值（1 句话）

统一管理平台内所有“异步导出任务”的创建、进度追踪、失败重试与权限化下载，确保大数据量导出的稳定性与可审计性。

## 4. 主要用户场景（2–3 个）

* 财务下载大型明细（订单/流水/提现/钱包汇总）并追踪任务状态。
* 风控导出命中/工单数据，失败后一键重试。
* 管理员查看各类导出的用量、失败率与下载审计。

## 5. 设计稿链接与断点

* 参考：高保真 V6（报表与总览 / 导出中心）。
* 断点：≥1280 双栏（左筛选右列表 + 顶部统计卡），≤1024 单栏折叠。

## 6. 页面组件结构（信息架构）

* **筛选区**：时间范围（任务创建时间）、状态（排队/进行中/完成/失败/已过期）、导出类型、发起人、来源页面、文件类型、大小区间。
* **统计卡**：今日发起任务数、完成数、失败数、平均完成时长。
* **任务列表表格**：任务号、类型、状态、进度、文件、大小、发起人、创建时间、完成时间、来源、参数摘要、操作。
* **详情抽屉**：任务元数据、原始筛选参数（JSON）、日志片段（最近 100 行）、失败原因与建议、下载链接历史。
* **操作区**：重试、取消、复制下载链接、复制 cURL、批量删除过期任务。

## 7. 字段清单（字段名/类型/必填/校验/示例/控件）

* **ExportJob**：

  * `job_id`(string, 只读)
  * `type`(enum: orders|wallet_ledger|wallet_summary|withdraws|campaigns|tasks|teams|members|users|roles|risk_hits|risk_tickets|risk_lists|risk_rules|kyc_cases|reports_custom, 必填)
  * `status`(enum: queued|processing|ready|failed|canceled|expired)
  * `progress`(int 0–100)
  * `file_name`(string|null)
  * `file_type`(enum: csv|xlsx|parquet|json)
  * `file_size`(integer, bytes|null)
  * `download_url`(string|null)  # 带签名、时效
  * `expires_at`(datetime|null)
  * `params`(object)  # 过滤条件摘要
  * `created_by`(string user_id)
  * `created_at`(datetime)
  * `finished_at`(datetime|null)
  * `source`(string)  # 触发来源，如 /orders, /reports
  * `retry_of`(string|null)  # 若由重试产生
  * `error`(object|null) → {code, message, stack?}

## 8. 操作/按钮（权限/确认/提示）

* **重试**：`POST /api/v1/exports/{job_id}/retry`（复制原参数重新排队；保留溯源）。
* **取消**：`POST /api/v1/exports/{job_id}/cancel`（仅 queued/processing 可取消）。
* **复制下载链接**：将带签名的 `download_url` 复制到剪贴板（带有效期提示）。
* **复制 cURL**：生成带鉴权头的下载示例。
* **批量删除过期**（仅 admin）：`POST /api/v1/exports/batch_delete_expired`。
* **刷新**：轮询/手动刷新状态。
* **权限提示**：无权限下载金额类文件时按钮置灰并展示 tooltip。

## 9. API 合约（方法/URL/参数/响应示例/错误码）

* **列表**：`GET /api/v1/exports?status=processing&type=orders&page=1&page_size=20`

```json
{
  "total": 136,
  "page": 1,
  "page_size": 20,
  "items": [
    {"job_id":"E20251003001","type":"orders","status":"processing","progress":65,"file_name":null,"file_type":"csv","file_size":null,"download_url":null,"expires_at":null,"params":{"start":"2025-09-01","end":"2025-09-30","status":"approved"},"created_by":"U1001","created_at":"2025-10-03T10:00:00+08:00","finished_at":null,"source":"/orders","retry_of":null,"error":null}
  ]
}
```

* **详情**：`GET /api/v1/exports/{job_id}` → 返回完整 ExportJob + 日志片段 `logs_tail`。
* **重试**：`POST /api/v1/exports/{job_id}/retry` → `{new_job_id}`。
* **取消**：`POST /api/v1/exports/{job_id}/cancel` → `{ok:true}`。
* **删除过期**：`POST /api/v1/exports/batch_delete_expired` → `{deleted: N}`。
* **错误码**：`400` 参数错误；`403` 权限不足或无下载权限；`404` 任务不存在；`409` 状态不允许的操作；`423` 任务被锁定；`500` 服务异常。

## 10. Mock 数据（≥3 条代表性）

* `mocks/exports/list.page1.json`（见上例）
* `mocks/exports/detail.ready.json`

```json
{"job_id":"E20251003002","type":"wallet_ledger","status":"ready","progress":100,"file_name":"wallet_ledger_202509.csv","file_type":"csv","file_size":10485760,"download_url":"https://mock/exports/E20251003002?sig=...","expires_at":"2025-10-04T10:00:00+08:00","params":{"start":"2025-09-01","end":"2025-09-30","dimension":"store"},"created_by":"U2001","created_at":"2025-10-03T09:30:00+08:00","finished_at":"2025-10-03T09:45:12+08:00","source":"/wallet/ledger","retry_of":null,"error":null,"logs_tail":"Generate CSV... done"}
```

* `mocks/exports/detail.failed.json`

```json
{"job_id":"E20251003003","type":"risk_hits","status":"failed","progress":80,"file_name":null,"file_type":"csv","file_size":null,"download_url":null,"expires_at":null,"params":{"start":"2025-09-28","end":"2025-10-03"},"created_by":"U3001","created_at":"2025-10-03T08:00:00+08:00","finished_at":"2025-10-03T08:20:00+08:00","source":"/risk/hits","retry_of":null,"error":{"code":"EXPORT_TIMEOUT","message":"Job exceeded 20m limit"},"logs_tail":"Chunk 7/10... timeout"}
```

## 11. 状态机与流程

* `queued → processing → ready|failed|canceled`；`ready → expired`（到期自动失效）。
* **重试**：从任意非 `processing` 状态发起 → 生成 `new_job_id` 并 `queued`。
* **取消**：仅 `queued/processing` 可取消 → `canceled`。
* **下载**：校验权限与签名有效期；下载成功写入下载日志。

## 12. 边界条件与异常场景

* **权限裁剪**：金额类导出仅 `finance/admin` 可下载；其余角色看到任务但无下载权限。
* **超大文件**：>5GB 显示分片下载/多文件压缩包；客户端给出断点续传建议。
* **过期文件**：展示“已过期”，支持重试生成；点击下载提示已失效。
* **并发限制**：同用户同时运行导出 ≤3 个；超过排队或拒绝。
* **频繁重试**：对同一失败任务 5 分钟内仅允许 1 次重试。
* **占位下载**：生成 download_url 但文件尚未落地时，返回 202 并提示稍后再试。

## 13. 交互细节

* 进度条显示百分比与阶段文案（排队/准备数据/写入文件/上传/完成）。
* 支持保存筛选为“我的任务视图”（例如：仅看我发起的、仅金额类等）。
* 详情抽屉内提供一键复制 `download_url` 与 `curl` 示例；展示最近 100 行日志。
* 列表支持列设置（显示/隐藏、顺序、宽度），并记忆偏好。
* 支持 WebSocket/Server-Sent Events 实时推送进度（可选）。

## 14. 可用性/无障碍要点

* 表格可键盘导航；Enter 打开详情；空格触发重试。
* 状态/进度使用颜色 + 图标 + 文案三重表达。
* 下载按钮需具备清晰的可用/不可用状态与原因 tooltip。

## 15. 性能与分页要求

* 列表接口 < 600ms；详情 < 400ms。
* 分页：默认 20，最大 200；支持按 `created_at/finished_at/file_size` 排序。
* 支持游标分页以优化深翻页；长列表懒加载。
* 任务状态轮询：默认 5s；ready 状态停止轮询。

## 16. 日志/审计点

* `export_job_create`（type, params_hash, user_id）。
* `export_job_status_change`（job_id, from, to）。
* `export_job_retry|cancel`（job_id, user_id）。
* `export_file_download`（job_id, user_id, ip, ua）。
* `export_job_delete_expired`（count, operator_id）。

## 17. 监控/埋点事件

* `page_view:exports`
* `filter_change:exports` {field, from, to}
* `job_retry_click` {job_id}
* `download_click` {job_id}
* `job_cancel_click` {job_id}

## 18. 验收标准（Checklist）

* [ ] 列表/详情显示准确，进度与日志更新正常。
* [ ] 下载权限裁剪严格，签名过期后不可下载。
* [ ] 重试/取消/批量删除过期操作正确并写入审计。
* [ ] 并发与频率限制生效。
* [ ] e2e：创建任务（从任一页面）→ 导出中心查看 → 等待就绪 → 下载 → 失败重试。

## 19. 交付物清单

* 设计稿：`exports-center.fig`。
* OpenAPI 片段：`openapi/exports.list.yaml`、`exports.detail.yaml`、`exports.retry.yaml`、`exports.cancel.yaml`、`exports.batch_delete_expired.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/exports-center.spec.ts`。
* 验收 checklist：`acceptance/exports-center-checklist.md`。

## 20. 签收（产品/运营/财务/QA/日期）

* Product：____  运营：____  财务：____  QA：____  日期：____
