# 后台 Demo —— 页面规格（P0-5 审核/复核工作台 / Review Workbench）

## 1. 页面名称（中/英）

审核/复核工作台 / Review Workbench

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：订单与审核管理 → 审核工作台
* 权限：`reviewer`（复核操作）、`admin`（全部）、`operator`（仅查看）

## 3. 目标与业务价值（1 句话）

集中化处理待审核订单，提高复核效率并确保合规与准确性。

## 4. 主要用户场景（2–3 个）

* 审核员进入工作台，批量查看待审核订单并快速处理。
* 审核员查看风控命中详情，决定放行或驳回。
* 主管对比审核通过率、平均耗时，优化审核流程。

## 5. 设计稿链接与断点

* 参考：高保真 V3（审核列表 + 审核详情弹窗）。
* 断点：≥1440 三栏布局（筛选栏/列表/详情预览）；≤1024 双栏或单栏折叠。

## 6. 页面组件结构（信息架构）

* **全局筛选区**：日期范围、状态、渠道、门店、活动、风控命中标签。
* **待审核列表**：表格形式，支持批量勾选。
* **右侧详情预览面板**：选中订单 → 在侧边栏显示详细信息。
* **操作区**：批量通过/驳回、单条操作按钮、备注输入框。
* **统计卡**：顶部展示待审核总数、今日已处理、平均处理时长。

## 7. 字段清单（字段名/类型/必填/校验/示例/控件）

* **筛选**：`date_range`, `status`(pending|under_review), `channel[]`, `store_id`, `campaign_id`, `risk_tag[]`。
* **列表列**：`order_id`(string), `created_at`(datetime), `user_name`(string), `phone`(string), `store_name`(string), `campaign_name`(string), `amount`(decimal), `status`(enum), `risk_flag`(bool)。
* **详情区字段**：与订单详情一致（参考 P0-2），额外显示风控命中标签。
* **操作输入**：`note`(string, 必填 ≥5 字)。

## 8. 操作/按钮（权限/确认/提示）

* **单条通过**：`POST /api/v1/orders/{id}/approve` → note 必填。
* **单条驳回**：`POST /api/v1/orders/{id}/reject` → note 必填。
* **批量通过**：`POST /api/v1/orders/batch_review` body: {ids:[], action:"approve", note}。
* **批量驳回**：同上，action="reject"。
* **导出待审核列表**：`POST /api/v1/exports/review`。
* **详情预览**：点击订单行 → 打开右侧详情。
* **快捷键**：支持键盘操作（上下切换订单，空格通过，Esc 关闭）。

## 9. API 合约

* **获取待审核列表**：`GET /api/v1/review/orders` → 支持分页/筛选。
* **单条审核**：`POST /api/v1/orders/{id}/approve|reject`。
* **批量审核**：`POST /api/v1/orders/batch_review`。
* **导出**：`POST /api/v1/exports/review` → {export_id}。
* **统计卡**：`GET /api/v1/review/stats?date_range=...`。

## 10. Mock 数据

```json
{
  "stats": {"pending_total": 120, "processed_today": 45, "avg_time_sec": 95},
  "orders": [
    {"order_id": "O20251003001", "created_at": "2025-10-03T09:00:00", "user_name": "张三", "phone": "13800000000", "store_name": "天河一店", "campaign_name": "活动A", "amount": 59.00, "status": "under_review", "risk_flag": true},
    {"order_id": "O20251003002", "created_at": "2025-10-03T09:05:00", "user_name": "李四", "phone": "13900000000", "store_name": "海珠二店", "campaign_name": "活动B", "amount": 39.00, "status": "pending", "risk_flag": false}
  ]
}
```

## 11. 状态机与流程

* 列表加载：`idle → loading → success|error`。
* 审核流转：`under_review → approved/rejected`；批量操作同时更新多条。
* 导出任务：`requested → processing → ready|failed`。

## 12. 边界条件与异常场景

* note 未填或少于 5 字：禁止提交。
* 批量操作超过 200 条：前端提示分批执行。
* 权限不足：操作按钮置灰，后端返回 403。
* 接口超时：允许重试，列表保持选中项。
* 风控高危：弹窗二次确认，需输入额外说明。

## 13. 交互细节

* 表格多选支持 shift 连选。
* 详情预览与列表保持同步；上下箭头切换行时右侧刷新详情。
* 审核操作完成后，行高亮淡出并从列表移除。
* 支持“仅显示风控命中订单”开关。
* 批量通过/驳回前需二次确认 modal。

## 14. 可用性/无障碍要点

* 键盘快捷键操作可替代鼠标点击。
* 高对比度风控标识。
* Tooltip 提示审核原因输入要求。

## 15. 性能与分页要求

* 默认 page_size = 20，最大 200。
* 列表接口 TTFB < 500ms；批量操作支持一次处理 ≤200 条。
* 并发请求取消机制，避免旧结果覆盖。

## 16. 日志/审计点

* `review_action`（order_ids, reviewer_id, action, note）。
* `batch_review`（count, reviewer_id）。
* `export_review_list`（filters, user_id）。

## 17. 监控/埋点事件

* `page_view:review_workbench`
* `filter_change:review` {field, from, to}
* `review_single` {order_id, action}
* `review_batch` {count, action}
* `export_click:review` {filters_hash}

## 18. 验收标准（Checklist）

* [ ] 列表加载/筛选正常，数据与统计卡一致。
* [ ] 单条与批量操作均需备注且更新状态即时。
* [ ] 风控命中订单需二次确认。
* [ ] 批量操作超过上限时提示。
* [ ] 权限裁剪正确（operator 无法操作）。
* [ ] e2e 覆盖：加载 → 筛选 → 单条审核 → 批量审核 → 导出。

## 19. 交付物清单

* 设计稿：`review-workbench.fig`。
* OpenAPI 片段：`openapi/review.orders.yaml`、`orders.batch_review.yaml`、`review.stats.yaml`、`review.export.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/review-workbench.spec.ts`。
* 验收 checklist：`acceptance/review-workbench-checklist.md`。

## 20. 签收（产品/运营/QA/日期）

* Product：____  运营：____  QA：____  日期：____
