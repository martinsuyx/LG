# 后台 Demo —— 页面规格（P0-8 提现管理 / Withdraw Management）

## 1. 页面名称（中/英）

提现管理 / Withdraw Management

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：资金与账户管理 → 提现管理
* 权限：`finance`（审核、出款）、`admin`（全部）、`operator`（仅查看本人或所属门店提现记录）

## 3. 目标与业务价值（1 句话）

集中管理并处理提现申请，支持财务审核、批量出款与状态追踪，确保资金流转安全合规。

## 4. 主要用户场景（2–3 个）

* 财务人员每日审核并发放提现请求。
* 运营或门店主查看提现进度和历史。
* 管理员统计提现情况，追踪失败/异常并导出报表。

## 5. 设计稿链接与断点

* 参考：高保真 V1（资金与账户管理提现流程）。
* 断点：≥1440 双栏（筛选区 + 列表 + 详情弹窗）；≤1024 单栏折叠。

## 6. 页面组件结构（信息架构）

* **全局筛选条**：日期范围、状态、提现渠道、账户维度（公司/门店/推广人）、最小/最大金额。
* **统计卡**：待处理总额、今日已出款、失败笔数。
* **提现申请列表**：表格，支持多选、批量操作。
* **详情弹窗**：点击单条申请查看收款账户、历史记录、操作日志。
* **操作区**：批量审核、批量出款、驳回。
* **快捷入口**：导出中心、钱包流水。

## 7. 字段清单（字段名/类型/必填/校验/示例/控件）

* **筛选**：`start`, `end`(date), `status?`(enum: pending|processing|succeeded|failed|rejected), `channel?`(enum: bank|alipay|wechat), `dimension`(enum), `entity_id?`, `min_amount?`, `max_amount?`。
* **统计卡**：`pending_total`(decimal), `paid_today`(decimal), `failed_count`(int)。
* **表格列**：

  * `withdraw_id`(string)：提现申请号。
  * `created_at`(datetime)：申请时间。
  * `entity_name`(string)：申请主体（公司/门店/推广人）。
  * `amount`(decimal)：申请金额。
  * `channel`(enum)：提现渠道。
  * `account_info`(string)：收款账号信息。
  * `status`(enum)：pending/processing/succeeded/failed/rejected。
  * `note`(string)：备注。
* **详情弹窗字段**：`withdraw_id`, `entity_info`, `bank_account`, `audit_logs[]`。

## 8. 操作/按钮（权限/确认/提示）

* **单条审核通过**：`POST /api/v1/withdraws/{id}/approve`。
* **单条驳回**：`POST /api/v1/withdraws/{id}/reject`，需备注。
* **批量通过**：`POST /api/v1/withdraws/batch_approve` body: {ids:[], note}。
* **批量驳回**：`POST /api/v1/withdraws/batch_reject`。
* **发起出款**：`POST /api/v1/withdraws/{id}/payout`。
* **批量出款**：`POST /api/v1/withdraws/batch_payout`。
* **导出**：`POST /api/v1/exports/withdraws`。
* 权限提示：无权限时按钮置灰并显示 tooltip。

## 9. API 合约

* **获取列表**：`GET /api/v1/withdraws?start=...&end=...&status=pending&page=1&page_size=20`

```json
{
  "total": 120,
  "page": 1,
  "page_size": 20,
  "items": [
    {"withdraw_id":"W20251003001","created_at":"2025-10-03T09:00:00","entity_name":"天河一店","amount":5000.00,"channel":"bank","account_info":"中国银行(1234)","status":"pending","note":""}
  ]
}
```

* **审核/驳回**：`POST /api/v1/withdraws/{id}/approve|reject` → {ok: true, new_status}。
* **出款**：`POST /api/v1/withdraws/{id}/payout` → {ok: true, payout_id, status: processing}。
* **导出**：`POST /api/v1/exports/withdraws` → {export_id}。
* **统计卡**：`GET /api/v1/withdraws/stats?start=...&end=...` → {pending_total, paid_today, failed_count}。

## 10. Mock 数据（≥3 条代表性）

* `mocks/withdraws/list.page1.json`（见上例）。
* `mocks/withdraws/stats.json`

```json
{"pending_total":100000.00,"paid_today":50000.00,"failed_count":2}
```

* `mocks/withdraws/detail.json`

```json
{"withdraw_id":"W20251003001","entity_info":{"id":"S001","name":"天河一店"},"amount":5000.00,"channel":"bank","account_info":"中国银行(1234)","status":"pending","audit_logs":[{"time":"2025-10-03T09:00:00","actor":"user:U1001","action":"submit"}]}
```

## 11. 状态机与流程

* **状态流转**：`pending → approved → processing → succeeded/failed`；`pending → rejected`。
* **批量操作**：同上，多条同时更新。
* **异常补救**：`failed → retry_payout`（新建任务）。

## 12. 边界条件与异常场景

* 金额低于最低提现门槛：前端拦截并提示。
* 审核未通过：不可进入出款。
* 批量出款超过 200 条：提示分批执行。
* 第三方渠道失败：记录失败原因，允许重试。
* 权限不足：仅可查看本人/门店提现。

## 13. 交互细节

* 表格多选支持 shift 连选。
* 点击行 → 打开详情弹窗，展示收款信息。
* 批量审核/出款均需二次确认 modal + 输入备注。
* 状态列使用标签颜色区分：pending=灰，processing=蓝，succeeded=绿，failed=红，rejected=橙。
* 导出时右上角展示进度。

## 14. 可用性/无障碍要点

* 键盘导航：Tab 遍历行与操作按钮；Enter 打开详情。
* 提示语清晰说明驳回原因输入要求。
* 状态颜色对比度 ≥4.5:1，并辅以图标。
* 金额字段带货币符号与千分位。

## 15. 性能与分页要求

* 列表接口目标 <600ms。
* 分页默认 20，最大 200。
* 支持服务端排序（created_at, amount, status）。
* 批量操作 ≤200 条/次。
* 查询跨度上限 90 天。

## 16. 日志/审计点

* `withdraw_request`（withdraw_id, user_id, amount）。
* `withdraw_review`（withdraw_id, reviewer_id, action, note）。
* `withdraw_payout`（withdraw_id, payout_id, status）。
* `export_withdraws`（filters, user_id）。

## 17. 监控/埋点事件

* `page_view:withdraws` {filters_hash}
* `filter_change:withdraws` {field, from, to}
* `withdraw_review_action` {withdraw_id, action}
* `withdraw_payout_action` {withdraw_id, status}
* `export_click:withdraws` {filters_hash}

## 18. 验收标准（Checklist）

* [ ] 待处理列表与统计卡数据一致。
* [ ] 单条与批量审核操作正确更新状态。
* [ ] 出款操作生成 payout 任务并追踪状态。
* [ ] 驳回需填写备注。
* [ ] 权限裁剪正确（operator 仅能看本人/门店）。
* [ ] 导出任务生成并在导出中心可见。
* [ ] e2e 覆盖：加载列表 → 单条审核 → 批量出款 → 导出。

## 19. 交付物清单

* 设计稿：`withdraws.fig`。
* OpenAPI 片段：`openapi/withdraws.list.yaml`、`withdraws.approve.yaml`、`withdraws.reject.yaml`、`withdraws.payout.yaml`、`withdraws.export.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/withdraws.spec.ts`。
* 验收 checklist：`acceptance/withdraws-checklist.md`。

## 20. 签收（产品/运营/QA/日期）

* Product：____  运营：____  QA：____  日期：____
