# 后台 Demo —— 页面规格（P0-2 订单详情 / Order Detail）

## 1. 页面名称（中/英）

订单详情 / Order Detail

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：订单与审核管理 → 订单详情
* 权限：`operator`（查看）、`reviewer`（复核操作）、`admin`（全部）、`finance`（查看结算信息）

## 3. 目标与业务价值（1 句话）

集中展示单笔订单的全量信息与流转，支持复核、补单、驳回等关键操作。

## 4. 主要用户场景（2–3 个）

* 审核员进入订单详情，查看材料、日志，执行通过或驳回。
* 运营/财务核实佣金结算金额及订单归属。
* 风控专员核对命中原因、追加备注或工单。

## 5. 设计稿链接与断点

* 参考：高保真 V3（订单详情页）。
* 断点：≥1280 桌面 2 栏布局；≤1024 单栏折叠。
* 特殊：大图预览需适配全屏 modal。

## 6. 页面组件结构（信息架构）

* 顶部操作栏：返回、订单状态 tag、操作按钮组。
* **基本信息卡**：订单号、提交时间、状态、金额、推广人、门店、活动。
* **用户与材料区**：用户姓名/手机号/证件号，上传材料列表（缩略图 + OCR 结果）。
* **结算信息卡**（权限 finance/admin）：佣金、冻结金额、实际入账。
* **风控信息卡**（权限 risk/admin）：命中规则、风险等级、处理工单入口。
* **流程日志（时间线）**：所有操作记录（提交、AI 解析、复核、结算、提现）。

## 7. 字段清单

* **基本信息**：`order_id`(string), `created_at`(datetime), `status`(enum), `amount`(decimal), `channel`(string), `store_id`(string), `campaign_id`(string)。
* **用户信息**：`user_id`(string), `name`(string), `phone`(string), `id_number`(string)。
* **材料**：`materials[]` → {`url`(string), `type`(enum:idcard|screenshot|other), `ocr`(object:fields), `uploaded_at`}。
* **结算**：`commission`(decimal), `settled_amount`(decimal|null), `frozen_amount`(decimal)。
* **风控**：`risk_hits[]` → {`rule_id`, `rule_name`, `level`, `desc`}。
* **日志**：`audits[]` → {`time`, `actor`, `action`, `note`}。

## 8. 操作/按钮

* **通过**：`POST /api/v1/orders/{id}/approve` → note 必填。
* **驳回**：`POST /api/v1/orders/{id}/reject` → note 必填。
* **补单**：`POST /api/v1/orders/{id}/supplement` → body: {fields}。
* **撤销**：`POST /api/v1/orders/{id}/revoke`。
* **导出单笔**：`POST /api/v1/exports/orders/{id}`。
* 权限提示：无权限操作的按钮置灰并显示 tooltip。

## 9. API 合约

* **获取详情**：`GET /api/v1/orders/{id}` → 返回订单全量信息。
* **审核操作**：如上 approve/reject/supplement/revoke。
* **日志**：包含在详情接口 response 中。
* **导出**：返回 export_id，轮询获取 download_url。

## 10. Mock 数据

```json
{
  "order_id": "O20251002001",
  "created_at": "2025-10-02T09:30:00+08:00",
  "status": "under_review",
  "amount": 59.00,
  "channel": "wechat",
  "store_id": "S001",
  "campaign_id": "C001",
  "user": {"id": "U1001", "name": "张三", "phone": "13800000000", "id_number": "4401..."},
  "materials": [
    {"url": "/mock/idcard.jpg", "type": "idcard", "ocr": {"name": "张三"}, "uploaded_at": "2025-10-02T09:31:00"}
  ],
  "commission": 10.00,
  "settled_amount": null,
  "frozen_amount": 10.00,
  "risk_hits": [
    {"rule_id": "R001", "rule_name": "同证件多单", "level": "warn", "desc": "同一身份证今日下单≥3 笔"}
  ],
  "audits": [
    {"time": "2025-10-02T09:30:00", "actor": "user:U1001", "action": "submit"},
    {"time": "2025-10-02T09:31:00", "actor": "system", "action": "ocr_parsed"}
  ]
}
```

## 11. 状态机与流程

* **状态流转**：`pending → under_review → approved/rejected → settled → payout`。
* **撤销**：`under_review → revoked`（记录 audit）。

## 12. 边界条件与异常场景

* 材料缺失：审核按钮置灰，提示“材料未齐全”。
* 重复提交：后端幂等，返回 409。
* 风控命中高危：需强制备注才能通过。
* 导出任务失败：展示错误提示并允许重试。

## 13. 交互细节

* 图片点击放大 + 滑动浏览；支持旋转/下载。
* 审核操作需二次确认 modal，输入备注。
* 日志按时间倒序显示；新动作实时追加。
* 权限不足的卡片显示“无权查看”。

## 14. 可用性/无障碍要点

* 大图预览支持键盘导航。
* 状态色 + 图标/文案双重区分。
* 表单校验即时提示。

## 15. 性能与分页要求

* 详情接口 TTFB < 500ms。
* 材料列表 ≤20 张；分页加载或懒加载。
* 日志按需分页加载（默认 20 条）。

## 16. 日志/审计点

* 审核操作（approve/reject/supplement/revoke）。
* 材料查看（记录 `view_material`）。
* 导出动作（记录 `export_order`）。

## 17. 监控/埋点事件

* `page_view:order_detail` {order_id}
* `action:order_review` {order_id, action, reviewer_id}
* `material_view` {order_id, material_type}
* `export_click` {order_id}

## 18. 验收标准（Checklist）

* [ ] 接口返回字段完整、与设计稿一致。
* [ ] 审核操作有二次确认；提交后状态与日志即时更新。
* [ ] 风控命中需强制备注。
* [ ] 图片预览功能正常。
* [ ] 权限裁剪正确：finance 可见结算；risk 可见风控。
* [ ] 导出任务能在导出中心出现。
* [ ] 空态（无材料/无日志）与错误提示符合设计。
* [ ] e2e 用例覆盖：加载详情 → 审核 → 查看材料 → 导出。

## 19. 交付物清单

* 设计稿：`order-detail.fig`。
* OpenAPI 片段：`openapi/orders.detail.yaml`、`orders.approve.yaml`、`orders.reject.yaml`、`orders.supplement.yaml`、`orders.revoke.yaml`、`orders.export.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/order-detail.spec.ts`。
* 验收 checklist：`acceptance/order-detail-checklist.md`。

## 20. 签收（产品/运营/QA/日期）

* Product：____  运营：____  QA：____  日期：____
