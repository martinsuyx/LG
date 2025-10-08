# 后台 Demo —— 页面规格（P0-6 钱包摘要 / Wallet Summary）

## 1. 页面名称（中/英）

钱包摘要 / Wallet Summary

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：资金与账户管理 → 钱包摘要
* 权限：`finance`（查看与导出）、`admin`（全部）、`operator`（只读，不见敏感维度可裁剪）

## 3. 目标与业务价值（1 句话）

以账户维度汇总展示余额、冻结、可提现与近期入出账，支撑财务对账与出款决策。

## 4. 主要用户场景（2–3 个）

* 财务每天查看平台钱包总体余额、冻结金额与可用余额，评估出款能力。
* 运营按公司/团队/门店/推广人维度聚合查看金额变化，定位异常。
* 需要导出当前视图以进行账务复核或报表沉淀。

## 5. 设计稿链接与断点

* 参考：高保真 V1（资金与账户管理）与 V6（报表与总览相关卡片）。
* 断点：≥1440 双栏（左汇总卡 + 右趋势卡；下方列表）；≤1024 单栏堆叠。

## 6. 页面组件结构（信息架构）

* **全局筛选条**：日期范围（统计口径）、公司、城市、账户维度（平台/公司/团队/门店/推广人）、账户状态（正常/冻结/关闭）。
* **汇总 KPI 区**：总余额、冻结金额、可用余额、可提现金额、近7日入账、近7日出账。
* **趋势图区**：余额趋势（面积图）、入出账柱状图。
* **账户汇总表**：按选择维度聚合的账户行（支持展开查看下钻）。
* **快捷入口**：提现管理、流水明细（Wallet Ledger）、导出中心。

## 7. 字段清单（字段名/类型/必填/校验/示例/控件）

* **筛选**：`start`, `end`(date, 必填), `company_id?`, `city?`, `dimension`(enum: platform|company|team|store|promoter), `status?`(enum)。
* **KPI 卡**：`total_balance`(decimal), `frozen`(decimal), `available`(decimal), `withdrawable`(decimal), `in_7d`(decimal), `out_7d`(decimal)。
* **趋势点**：`ts`(date/datetime), `balance`(decimal), `inflow`(decimal), `outflow`(decimal)。
* **表格列**：`entity_name`(string), `entity_id`(string), `balance`(decimal), `frozen`(decimal), `available`(decimal), `withdrawable`(decimal), `last_tx_time`(datetime), `status`(enum)。

## 8. 操作/按钮（权限/确认/提示）

* 切换维度/筛选 → 自动刷新数据。
* 下钻：点击某行 → 跳转钱包流水页并携带 entity_id 过滤。
* 导出当前视图：`POST /api/v1/exports/wallet-summary` → 生成导出任务。
* 跳转提现：若 `withdrawable>0` 显示“去提现”按钮。

## 9. API 合约（方法/URL/参数/响应示例/错误码）

* **汇总 KPI**：`GET /api/v1/wallet/summary/overview?start=...&end=...&dimension=company&company_id=...`

```json
{
  "total_balance": 1254321.55,
  "frozen": 23456.78,
  "available": 1230864.77,
  "withdrawable": 560000.00,
  "in_7d": 210345.66,
  "out_7d": 198765.43
}
```

* **趋势**：`GET /api/v1/wallet/summary/series?metric=balance|in_out&granularity=d&w&m`

```json
{"metric":"in_out","points":[{"ts":"2025-09-27","inflow":32500.00,"outflow":28000.00}]}
```

* **账户汇总表**：`GET /api/v1/wallet/summary/list?dimension=store&start=...&end=...&page=1&page_size=20`

```json
{
  "total": 315,
  "page": 1,
  "page_size": 20,
  "items": [
    {"entity_id":"S001","entity_name":"天河一店","balance":12500.50,"frozen":500.00,"available":12000.50,"withdrawable":8000.00,"last_tx_time":"2025-10-02T20:18:00+08:00","status":"normal"}
  ]
}
```

* **导出**：`POST /api/v1/exports/wallet-summary` → `{ "export_id": "E20251003001" }`；`GET /api/v1/exports/{export_id}` → `{ "status":"ready","download_url":"..." }`。
* **错误码**：400/401/403/429/500 通用，`403` 用于权限裁剪后的敏感字段访问。

## 10. Mock 数据（≥3 条代表性）

* `mocks/wallet-summary/overview.json`（见上示例值）
* `mocks/wallet-summary/series.balance.json`

```json
{"metric":"balance","points":[{"ts":"2025-09-28","balance":1210000.00},{"ts":"2025-09-29","balance":1213500.00}]}
```

* `mocks/wallet-summary/list.store.json`

```json
{"total":2,"page":1,"page_size":20,"items":[
 {"entity_id":"S001","entity_name":"天河一店","balance":12500.50,"frozen":500.00,"available":12000.50,"withdrawable":8000.00,"last_tx_time":"2025-10-02T20:18:00+08:00","status":"normal"},
 {"entity_id":"S002","entity_name":"海珠二店","balance":9900.00,"frozen":100.00,"available":9800.00,"withdrawable":6000.00,"last_tx_time":"2025-10-02T20:05:00+08:00","status":"normal"}
]}
```

## 11. 状态机与流程

* 数据加载：`idle → loading → success|error`。
* 导出任务：`requested → processing → ready|failed`。
* 下钻流程：`summary_row_click → navigate(wallet_ledger with filters)`。

## 12. 边界条件与异常场景

* **权限裁剪**：无 `finance` 角色隐藏金额型 KPI，仅显示趋势方向。
* **无数据**：展示空态与引导（切换维度/时间）。
* **超大聚合**：当 `dimension=promoter` 且数据量大时强制分页与搜索。
* **跨日对齐**：严格使用 `tz` 计算自然日；月周切换重算。
* **接口失败**：重试 2 次；失败展示错误卡片（含重试按钮）。

## 13. 交互细节

* KPI 卡点击跳转对应维度列表（自动携带筛选）。
* 表格支持列排序（balance/available/withdrawable/last_tx_time）。
* 支持固定列与横向滚动；表头吸顶。
* 余额数值带千分位与两位小数；过大数值自动 K/M 单位。
* 右上角“导出当前视图”按钮显示导出进度。

## 14. 可用性/无障碍要点

* 键盘导航可达表格与筛选；Enter 触发下钻。
* 对金额颜色使用同时配文案/图标，不仅靠颜色区分涨跌。
* 提供屏幕阅读器友好标签（aria-label）描述 KPI 卡含义。

## 15. 性能与分页要求

* 概览接口目标 < 300ms；列表接口 < 600ms。
* 列表默认 page_size=20，最大 200；维度 `promoter` 时建议上限 100。
* 服务端开启缓存（filters 哈希，TTL=300s），并支持 ETag/If-None-Match。
* 返回数据 ≤ 1MB/页；超出需强制导出。

## 16. 日志/审计点

* `view_wallet_summary`（filters_hash, user_id）。
* `export_wallet_summary`（filters_hash, user_id）。
* 下钻行为可仅埋点，不必写审计。

## 17. 监控/埋点事件

* `page_view:wallet_summary` {filters_hash}
* `filter_change:wallet_summary` {field, from, to}
* `kpi_click:wallet_summary` {kpi_key}
* `row_drill:wallet_summary` {dimension, entity_id}

## 18. 验收标准（Checklist）

* [ ] 权限裁剪正确（finance/admin 全量可见；operator 隐藏金额细节）。
* [ ] 切换维度/筛选后，KPI、趋势、列表保持一致。
* [ ] 表格排序与分页正确；下钻能带筛选跳转到流水页。
* [ ] 导出任务创建成功并在导出中心可见。
* [ ] 空态、错误态、加载骨架符合设计。
* [ ] e2e 覆盖：加载默认 → 切换维度 → 下钻 → 导出。

## 19. 交付物清单

* 设计稿：`wallet-summary.fig`。
* OpenAPI 片段：`openapi/wallet.summary.overview.yaml`、`wallet.summary.series.yaml`、`wallet.summary.list.yaml`、`wallet.summary.export.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/wallet-summary.spec.ts`。
* 验收 checklist：`acceptance/wallet-summary-checklist.md`。

## 20. 签收（产品/运营/QA/日期）

* Product：____  运营：____  QA：____  日期：____
