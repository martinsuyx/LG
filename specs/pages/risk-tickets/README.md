# 后台 Demo —— 页面规格（P2-14 风控工单 / Risk Tickets · Case Management）

## 1. 页面名称（中/英）

风控工单 / Risk Tickets (Case Management)

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：风控与合规管理 → 风控工单
* 权限：`risk`（创建/指派/处置/备注）、`admin`（全部与配置）、`reviewer`（只读或被指派可处置），`operator` 无访问

## 3. 目标与业务价值（1 句话）

将风险命中转化为“案件”进行闭环管理（分配→调查→处置→归档），可审计、可追踪、可统计。

## 4. 主要用户场景（2–3 个）

* 风控专员从命中列表批量生成工单并分配给审核员处理。
* 审核员处理工单：核对证据、补充材料、与订单联动做放行/拒绝。
* 风控负责人查看队列与 SLA，分析积压与关闭率。

## 5. 设计稿链接与断点

* 参考：高保真 V4（风控与合规管理 · 工单队列/详情）。
* 断点：≥1440 三栏（筛选/列表/详情抽屉），≤1024 双栏或单栏分步。

## 6. 页面组件结构（信息架构）

* **筛选区**：时间范围、优先级、状态、规则、被指派人、渠道、来源（命中/手工）、SLA（是否超时）、标签。
* **工单列表**：表格多选，支持排序、固定列与批量操作。
* **右侧详情抽屉**：工单概览（优先级/状态/SLA）、关联命中与订单、证据、处理记录、内部备注、附件、操作按钮。
* **统计卡**：待处理、进行中、超时、今日关闭数。
* **操作区**：新建工单、批量指派、批量关闭、导出。

## 7. 字段清单（字段名/类型/必填/校验/示例/控件）

* **Ticket 核心**：

  * `ticket_id`(string, 只读)、`created_at`(datetime)、`updated_at`(datetime)、`priority`(enum: low|normal|high|critical, 必填)、`status`(enum: new|assigned|investigating|pending_info|resolved|rejected|closed)、`severity`(enum)、`assignee_id`(string|null)、`creator_id`(string)、`source`(enum: hit|manual)、`rule_id?`、`sla_minutes`(int)、`due_at`(datetime, 自动=created_at+sla)。
* **关联**：`hit_ids[]`、`order_ids[]`、`entities[]`(phone|device|user|store)。
* **内容**：`title`(string, 必填 6–60)、`desc`(string ≤2000)、`tags[]`(string[])、`attachments[]`(files ≤10, 单个 ≤10MB)。
* **处理记录**：`actions[]` → {time, actor, action, note, to_status?}。

## 8. 操作/按钮（权限/确认/提示）

* **新建工单**：`POST /api/v1/risk/tickets`（可从命中列表批量生成）。
* **指派/改派**：`POST /api/v1/risk/tickets/{id}/assign` body: {assignee_id, note?}。
* **状态流转**：

  * 进入调查：`POST /api/v1/risk/tickets/{id}/start`（to `investigating`）。
  * 待补资料：`POST /api/v1/risk/tickets/{id}/pend`（to `pending_info`，需备注与期望资料项）。
  * 处置：`POST /api/v1/risk/tickets/{id}/resolve`（to `resolved`，可同时回写订单审核动作）。
  * 拒绝：`POST /api/v1/risk/tickets/{id}/reject`（to `rejected`）。
  * 关闭：`POST /api/v1/risk/tickets/{id}/close`（终态）。
* **批量**：`POST /api/v1/risk/tickets/batch_assign|batch_close`。
* **备注**：`POST /api/v1/risk/tickets/{id}/comment`，支持 @ 成员与引用其他工单。
* **上传附件**：经 `GET /uploads/policy` 获取策略后直传。
* **导出**：`POST /api/v1/exports/risk-tickets`。

## 9. API 合约（方法/URL/参数/响应示例/错误码）

* **列表**：`GET /api/v1/risk/tickets?status=investigating&assignee_id=U2001&page=1&page_size=20`

```json
{
  "total": 88,
  "page": 1,
  "page_size": 20,
  "items": [
    {"ticket_id":"K20251003001","created_at":"2025-10-03T09:10:00+08:00","priority":"high","status":"investigating","severity":"high","assignee_id":"U2001","source":"hit","rule_id":"GEOFENCE_OUT","title":"越界地理围栏(高) O20251003001","due_at":"2025-10-03T10:10:00+08:00","sla_minutes":60}
  ]
}
```

* **详情**：`GET /api/v1/risk/tickets/{id}` → ticket 核心 + 关联 + actions。
* **状态流转**：`POST /api/v1/risk/tickets/{id}/assign|start|pend|resolve|reject|close` → `{ok:true, new_status}`。
* **评论**：`POST /api/v1/risk/tickets/{id}/comment` → `{comment_id}`。
* **批量**：`POST /api/v1/risk/tickets/batch_assign|batch_close` → `{ok:true, count}`。
* **导出**：`POST /api/v1/exports/risk-tickets` → `{export_id}`；`GET /api/v1/exports/{export_id}`。
* **错误码**：`400` 参数错误；`403` 权限不足；`409` 状态冲突；`422` 缺少必填（如 title/assignee）；`500` 异常。

## 10. Mock 数据（≥3 条代表性）

* `mocks/risk-tickets/list.page1.json`（见上例）
* `mocks/risk-tickets/detail.json`

```json
{
  "ticket_id":"K20251003001",
  "created_at":"2025-10-03T09:10:00+08:00",
  "priority":"high",
  "status":"investigating",
  "severity":"high",
  "assignee_id":"U2001",
  "source":"hit",
  "rule_id":"GEOFENCE_OUT",
  "title":"越界地理围栏(高) O20251003001",
  "desc":"位置与门店距离>10km，且同设备 24h 5 笔。",
  "hit_ids":["H202510030001"],
  "order_ids":["O20251003001"],
  "entities":[{"type":"device","id":"d-9a7..."},{"type":"phone","id":"138****0000"}],
  "actions":[
    {"time":"2025-10-03T09:12:00+08:00","actor":"U2001","action":"assign","note":"指派给自己","to_status":"assigned"},
    {"time":"2025-10-03T09:13:00+08:00","actor":"U2001","action":"start","note":"开始调查","to_status":"investigating"}
  ],
  "attachments":[{"name":"map.png","url":"/mock/map.png"}],
  "due_at":"2025-10-03T10:10:00+08:00",
  "sla_minutes":60
}
```

* `mocks/risk-tickets/resolve.success.json`

```json
{"ok":true,"new_status":"resolved"}
```

## 11. 状态机与流程

* `new → assigned → investigating → (pending_info) → resolved|rejected → closed`。
* 从 `resolved` 到 `closed` 由复核或自动任务完成；关闭时对关联命中写回 `resolved`。
* SLA：若 `now > due_at` 标记 `overdue`，统计卡增加“超时”。

## 12. 边界条件与异常场景

* 指派对象无处理权限：返回 403。
* 状态竞态：他人已关闭 → 当前操作返回 409 并刷新。
* 批量关闭需统一原因或为每条填写备注；超过 200 条需分批。
* 附件违规类型/超限：前端拦截并提示；服务器进行二次校验。

## 13. 交互细节

* 列表支持保存视图（我的待办/本周超时）。
* 详情抽屉内：快捷动作按钮置顶；必填备注未填禁止提交。
* 可在评论中 @ 某人并触发通知；支持引用命中/订单链接。
* 支持在抽屉内直接发起关联订单的“二次审核”。

## 14. 可用性/无障碍要点

* 键盘导航：上下切换工单、Enter 打开详情、Ctrl+Enter 提交动作。
* 状态与优先级采用标签+图标+文本三重指示；色盲友好。
* 长文本描述支持折叠/展开与搜索高亮。

## 15. 性能与分页要求

* 列表接口 < 600ms，详情 < 400ms。
* 分页最大 200 条；提供游标分页以优化深翻页。
* 批量操作走后台任务队列并返回 task_id（用于超大批量关闭/指派）。

## 16. 日志/审计点

* `ticket_create|assign|start|pend|resolve|reject|close|comment|attach`（记录操作者、时间、差异）。
* 关联写回：`hit_resolved_from_ticket`、`order_review_from_ticket`（含关联 ID）。

## 17. 监控/埋点事件

* `page_view:risk_tickets`
* `filter_change:risk_tickets` {field, from, to}
* `ticket_action` {ticket_id, action}
* `batch_assign_click` {count} / `batch_close_click` {count}

## 18. 验收标准（Checklist）

* [ ] 工单创建/指派/处置/关闭全链路通畅，状态机正确。
* [ ] 详情抽屉展示关联命中/订单/证据/历史动作完整。
* [ ] 与命中列表、订单详情的跳转与回写联动生效。
* [ ] 批量操作安全且有二次确认；SLA 超时标识与统计正确。
* [ ] 导出任务生成并在导出中心可见。
* [ ] 权限裁剪与校验完善；并发冲突友好提示。
* [ ] e2e：创建 → 指派 → 调查 → 处置 → 关闭。

## 19. 交付物清单

* 设计稿：`risk-tickets.fig`。
* OpenAPI 片段：`openapi/risk.tickets.list.yaml`、`risk.tickets.detail.yaml`、`risk.tickets.assign.yaml`、`risk.tickets.start.yaml`、`risk.tickets.pend.yaml`、`risk.tickets.resolve.yaml`、`risk.tickets.reject.yaml`、`risk.tickets.close.yaml`、`risk.tickets.batch.yaml`、`risk.tickets.export.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/risk-tickets.spec.ts`。
* 验收 checklist：`acceptance/risk-tickets-checklist.md`。

## 20. 签收（产品/风控负责人/QA/日期）

* Product：____  风控负责人：____  QA：____  日期：____
