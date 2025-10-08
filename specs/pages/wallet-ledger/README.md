# 后台 Demo —— 页面规格（P0-7 钱包流水 / Wallet Ledger）

## 1. 页面名称（中/英）

钱包流水 / Wallet Ledger

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：资金与账户管理 → 钱包流水
* 权限：`finance`（全量查看、导出）、`admin`（全部）、`operator`（仅查看本人/团队相关流水，金额字段可裁剪）

## 3. 目标与业务价值（1 句话）

提供逐笔资金流动明细，支持多维度筛选、追溯和对账。

## 4. 主要用户场景（2–3 个）

* 财务导出门店/推广人资金流水进行账务核对。
* 运营定位某笔订单对应的佣金入账。
* 审核人员追踪冻结、解冻、提现等关键资金操作。

## 5. 设计稿链接与断点

* 参考：高保真 V1（资金与账户管理流水页）。
* 断点：≥1440 双栏（左筛选、右表格）；≤1024 单栏折叠。

## 6. 页面组件结构（信息架构）

* **全局筛选条**：日期范围、账户维度（平台/公司/团队/门店/推广人/个人）、交易类型、状态、最小/最大金额、订单号/流水号。
* **统计卡**：本次筛选范围的入账总额、出账总额、净额。
* **流水表格**：逐条流水记录，支持分页、排序、导出。
* **快捷入口**：跳转提现管理、钱包摘要。

## 7. 字段清单（字段名/类型/必填/校验/示例/控件）

* **筛选**：`start`, `end`(date, 必填), `dimension`(enum), `entity_id?`, `tx_type?`(enum: order_settlement|freeze|unfreeze|withdraw|adjustment), `status?`(enum: success|pending|failed), `min_amount?`, `max_amount?`, `order_id?`, `tx_id?`。
* **统计卡**：`in_total`(decimal), `out_total`(decimal), `net`(decimal)。
* **表格列**：

  * `tx_id`(string)：流水号。
  * `created_at`(datetime)：发生时间。
  * `entity_name`(string)：账户主体名称。
  * `tx_type`(enum)：交易类型。
  * `order_id`(string|null)：关联订单号。
  * `amount`(decimal)：金额。
  * `balance_after`(decimal)：交易后余额。
  * `status`(enum)：成功/失败/处理中。
  * `note`(string)：备注。

## 8. 操作/按钮（权限/确认/提示）

* 切换筛选条件 → 自动刷新数据。
* 点击流水号 → 打开详情弹窗（显示关联订单、风控工单）。
* 导出当前筛选 → `POST /api/v1/exports/wallet-ledger`。
* 点击订单号 → 跳转订单详情。

## 9. API 合约

* **获取流水**：`GET /api/v1/wallet/ledger?start=...&end=...&dimension=store&entity_id=S001&page=1&page_size=20`

```json
{
  "total": 2350,
  "page": 1,
  "page_size": 20,
  "items": [
    {"tx_id":"T20251003001","created_at":"2025-10-03T10:00:00+08:00","entity_name":"天河一店","tx_type":"order_settlement","order_id":"O20251003001","amount":59.00,"balance_after":12059.00,"status":"success","note":"订单佣金入账"}
  ]
}
```

* **统计卡**：`GET /api/v1/wallet/ledger/stats?start=...&end=...` → `{in_total:..., out_total:..., net:...}`
* **导出**：`POST /api/v1/exports/wallet-ledger` → `{export_id}`；`GET /api/v1/exports/{id}` → `{status, download_url}`
* **错误码**：400/401/403/429/500，另：404 tx_id 不存在。

## 10. Mock 数据（≥3 条代表性）

* `mocks/wallet-ledger/list.page1.json`（见上例）。
* `mocks/wallet-ledger/stats.json`

```json
{"in_total": 52340.00, "out_total": 38900.00, "net": 13440.00}
```

* `mocks/wallet-ledger/list.page2.json`

```json
{"total": 2350, "page": 2, "page_size": 20, "items": [
 {"tx_id":"T20251003021","created_at":"2025-10-03T11:00:00+08:00","entity_name":"海珠二店","tx_type":"withdraw","order_id":null,"amount":-5000.00,"balance_after":9800.00,"status":"success","note":"提现成功"}
]}
```

## 11. 状态机与流程

* 流水加载：`idle → loading → success|error`。
* 导出任务：`requested → processing → ready|failed`。
* 单条流水详情：`collapsed → expanded`。

## 12. 边界条件与异常场景

* 金额筛选 min>max：提示并阻断请求。
* 跨月查询跨度过大：提示使用导出。
* 权限不足：金额字段置灰或不展示。
* 无数据：展示空表与指引。
* 导出失败：允许重试。

## 13. 交互细节

* 表格支持列排序（amount、created_at）。
* 点击流水号弹窗详情；支持复制流水号。
* 导出时显示进度条，完成后可下载。
* 统计卡点击 → 自动应用筛选并刷新。
* 支持分页快速跳转与每页数量切换。

## 14. 可用性/无障碍要点

* 表格可用键盘方向键导航；Enter 打开详情。
* 金额正数绿色、负数红色，并附符号；对色盲提供图标/文字说明。
* 分页控件可被屏幕阅读器识别。

## 15. 性能与分页要求

* 接口响应目标 < 600ms/页。
* 支持分页最多 200 条/页。
* 查询跨度上限 90 天；更大区间需强制导出。
* 接口返回数据 ≤1MB。
* 支持服务端游标分页。

## 16. 日志/审计点

* `view_wallet_ledger`（filters, user_id）。
* `export_wallet_ledger`（filters, user_id）。
* `view_tx_detail`（tx_id, user_id）。

## 17. 监控/埋点事件

* `page_view:wallet_ledger` {filters_hash}
* `filter_change:wallet_ledger` {field, from, to}
* `tx_click` {tx_id}
* `export_click:wallet_ledger` {filters_hash}

## 18. 验收标准（Checklist）

* [ ] 筛选条件生效正确，统计卡与表格数据一致。
* [ ] 单条流水详情展示完整。
* [ ] 金额正负显示与颜色/符号正确。
* [ ] 权限裁剪正确（operator 不可见敏感字段）。
* [ ] 导出任务生成并在导出中心可见。
* [ ] 空态/错误态/加载态符合设计。
* [ ] e2e 覆盖：筛选 → 查看详情 → 导出。

## 19. 交付物清单

* 设计稿：`wallet-ledger.fig`。
* OpenAPI 片段：`openapi/wallet.ledger.list.yaml`、`wallet.ledger.stats.yaml`、`wallet.ledger.export.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/wallet-ledger.spec.ts`。
* 验收 checklist：`acceptance/wallet-ledger-checklist.md`。

## 20. 签收（产品/运营/QA/日期）

* Product：____  运营：____  QA：____  日期：____
