订单列表页（Order List）完整页面规格

（你可以直接把下面内容放进 specs/pages/order-list.md 并交由前端/后端实现）

1) 页面名称

中文：订单列表

英文：Order List

2) 归属菜单

后台左侧菜单：订单与审核管理 → 订单列表

最小权限：role = operator（查看） / reviewer（审核相关操作） / admin（全部）

3) 目标与业务价值

快速检索与批量处理订单，覆盖从提交到审核、放行、驳回与导出对账的全部日常操作。

4) 主要用户场景

运营查看当日/历史订单并筛选未审核/异常订单。

审核员批量复核通过/驳回并填写备注。

财务导出指定时间段的结算明细做对账。

5) 设计稿

（插入 Figma 链接 / 设计路径；如无则标注：参考项目高保真 V3 订单模块）

6) 页面组件结构

顶部：筛选栏（日期范围 / 状态 / 渠道 / 门店 / 推广人 / 订单号 / 手机号）

主体：表格（列详见下）

每行操作列：查看详情 / 复核 / 导出单条 / 创建工单

底部：分页 + 批量操作（批量通过 / 批量驳回 / 批量导出）

7) 字段清单（表格列）
列名	key	类型	可编辑	备注
订单ID	order_id	string	否	点击跳详情
下单时间	created_at	datetime	否	支持范围排序
状态	status	enum	否	pending/auto_reject/under_review/approved/rejected/settled
渠道	channel	string	否	e.g., wechat/h5/scan
门店	store_name	string	否	支持模糊搜索
推广人	promoter_name	string	否	点击跳转 promoter profile
金额	amount	decimal	否	精确到分
实际入账	settled_amount	decimal	否	若未结算显示 "-"
操作	actions	actions	否	按钮组

筛选控件：date_range（start,end）, status[], channel, store_code, promoter_id, order_id (exact), phone (partial)

8) 操作与按钮

查看详情（跳转 /api/v1/orders/{id}）

审核（打开 modal -> 复核意见 -> submit -> 调用 POST /api/v1/orders/{id}/review）

权限：reviewer/admin

成功提示：复核已提交，并在行内更新状态

批量通过 / 批量驳回（多选后出现 toolbar）

请求：POST /api/v1/orders/batch_review body: {ids:[], action: 'approve'|'reject', note}

导出（当前筛选条件） -> 触发异步导出任务 POST /api/v1/exports/orders 返回 export_id -> poll GET /api/v1/exports/{export_id} 获取 download_url

9) API 合约（示例）

列表（分页/筛选）：

GET /api/v1/orders?start=2025-09-01&end=2025-09-30&status=under_review&page=1&page_size=20

response:

{
  "total": 1234,
  "page": 1,
  "page_size": 20,
  "items": [
    {"order_id":"O20250901001","created_at":"2025-09-01T10:10:10+08:00","status":"pending","channel":"wechat","store_name":"A店","promoter_name":"张三","amount":59.00,"settled_amount":null}
  ]
}


单条 review：

POST /api/v1/orders/{id}/review

body: {"action":"approve","reviewer_id":"u1001","note":"核对资料完整"}

response: { "ok": true, "new_status": "approved" }

批量 review：

POST /api/v1/orders/batch_review

body: {"ids":["O1","O2"],"action":"reject","note":"证件不符"}

导出任务：

POST /api/v1/exports/orders -> body: filters object -> response: { "export_id": "E123" }

GET /api/v1/exports/{export_id} -> response: { "status":"ready","download_url":"..." }

10) Mock 数据（至少 3 条）

提供给前端用的 fixtures（略 — 可在 repo/mocks/order-list.json 中放三条不同状态的数据）

11) 状态机（简略）

pending -> auto_check -> under_review -> approved -> settled

pending -> auto_reject -> rejected

under_review -> rejected/approved

12) 边界条件与异常

重复提交（前端按钮防重/后端幂等以 order_id）

网络超时导致导出任务重复发起（导出接口要可幂等）

大量筛选（性能）：当 total > 100k，后端应限制 page_size <= 1000 或改用异步导出

权限不足：返回 403

13) 交互细节

筛选后默认回到 page=1

排序项：created_at, amount, status

批量操作需要二次确认 modal（列出被选中的 order_ids 前 3 条）

14) 可用性 / 无障碍

表格需支持键盘导航（行聚焦 + 回车查看详情）

颜色对比符合 AA 标准（状态色不可仅用颜色区分）

15) 性能要求

默认 page_size = 20；最大 page_size = 200（后端限制）；列表接口响应 < 1MB（含 20 条）

16) 审计点

查看详情（log view_order）

审核动作（log review_order, 包含 reviewer_id, note, before_status, after_status）

批量导出（log export_orders）

17) 监控事件埋点

page_view:order_list

action:order_review {order_id, action, reviewer_id}

export_requested {filters_hash, user_id}

18) 验收 checklist（QA 必检）

 筛选条件任意组合能返回正确结果（与 Mock 数据比对）

 审核 modal 提交后行内状态即时更新且审计日志写入

 批量操作安全（多选超过 200 条给出提示）

 导出任务能创建并返回 download_url（mock）

 权限校验：普通 operator 不能看到 reviewer-only 操作

 前端对空状态/异常状态展示良好（空表、网络错误）

 单元/集成测试覆盖：列表接口/单条审核/批量审核/导出

19) 交付文件（要上传到 specs/pages/order-list/）

order-list.fig（或 figma 链接）

openapi/fragments/orders.list.yaml（用于后端合并）

mocks/order-list.json

tests/e2e/order-list.spec.ts（Playwright 或 Cypress）

acceptance/order-list-checklist.md（QA 打勾清单）

20) 签收

Product: ______

QA: ______

Dev: ______
