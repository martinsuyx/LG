# 后台 Demo —— 页面规格（P3-1 报表总览 / Reports Overview）

## 1. 页面名称（中/英）

报表总览 / Reports Overview

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：报表与总览 → 报表总览
* 权限：`finance`（金额类指标全量可见、可导出）、`admin`（全部）、`operator`（只读且金额脱敏）、`risk`（可见风险相关指标区块）

## 3. 目标与业务价值（1 句话）

以“报表入口 + 指标卡 + 多维对比图”的方式，提供经营与合规关键指标的一站式概览与下钻导航。

## 4. 主要用户场景（2–3 个）

* 财务或经营负责人查看本周/月核心指标与同比环比，下载固定模板报表。
* 运营对比活动、渠道、地区的转化差异，定位异常并下钻。
* 风控查看命中与工单指标趋势，评估规则效果。

## 5. 设计稿链接与断点

* 参考：高保真 V6（报表与总览）。
* 断点：≥1440（三行指标卡 + 双图 + 表格），≤1024 单列折叠，顶部吸顶筛选。

## 6. 页面组件结构（信息架构）

* **全局筛选条**：日期范围（当日/7天/30天/自定义）、粒度（d/w/m）、公司、城市、渠道、维度（活动/门店/推广人）。
* **指标卡分组**：

  * 经营：订单数、GMV、结算金额、提现金额、客单价、通过率。
  * 合规：风控命中、工单关闭率、KYC 通过率。
* **趋势/对比图区**：

  * 趋势图（订单/结算/提现三选一）
  * 维度对比（柱状：按活动/门店/推广人 TopN）
* **报表入口区**：常用报表卡片（销售日报、渠道周报、活动效果月报、风控周报、财务对账报表等），可一键下载或跳转至报表明细。
* **底部明细表**：按当前筛选展示聚合表（可导出）。

## 7. 字段清单（字段名/类型/必填/校验/示例/控件）

* **筛选**：`start`, `end`(date, 必填), `granularity`(enum d|w|m), `company_id?`, `city?`, `channel?`, `dimension?`(campaign|store|promoter)。
* **指标卡**：`kpis[]` → {`key`, `value`(number), `delta?`(number), `trend?`(up|down|flat), `unit`(笔|元|%), `drill_link`}。
* **趋势点**：`ts`(date/datetime), `value`(number), `baseline_yesterday?`, `baseline_lastweek?`。
* **对比项**：`items[]` → {`name`, `id`, `metric`(number)}。
* **报表卡**：`report_key`、`title`、`desc`、`download_link?`、`route?`、`schedule?`（若支持订阅）。

## 8. 操作/按钮（权限/确认/提示）

* 切换指标与维度 → 自动刷新图表与明细。
* KPI/图表点击 → 下钻到相应列表/明细报表，携带筛选。
* 立即下载报表：`POST /api/v1/reports/export`（当前视图）→ 导出任务。
* 订阅（可选）：创建报表订阅 `POST /api/v1/reports/subscriptions`。
* 固定视图保存：保存常用筛选为“我的视图”。

## 9. API 合约（方法/URL/参数/响应示例/错误码）

* **KPI 概览**：`GET /api/v1/reports/overview?kpi_set=ops|risk&start=...&end=...&granularity=d`

```json
{"kpis":[{"key":"orders","value":1280,"delta":12,"trend":"up","unit":"笔","drill_link":"/orders?..."},{"key":"gmv","value":65890.55,"delta":-3.5,"trend":"down","unit":"元"}]}
```

* **趋势**：`GET /api/v1/reports/series?metric=orders|gmv|settlement|withdraw&granularity=d`

```json
{"metric":"settlement","points":[{"ts":"2025-09-28","value":12345.67},{"ts":"2025-09-29","value":15678.00}]}
```

* **维度对比**：`GET /api/v1/reports/compare?dimension=campaign&metric=orders&limit=10`

```json
{"dimension":"campaign","metric":"orders","items":[{"id":"C001","name":"活动A","metric":320},{"id":"C002","name":"活动B","metric":280}]}
```

* **明细表**：`GET /api/v1/reports/table?dimension=store&metric=settlement&page=1&page_size=20`

```json
{"total":85,"page":1,"page_size":20,"items":[{"id":"S001","name":"天河一店","orders":230,"gmv":12590.00,"settlement":9200.00,"withdraw":6000.00,"approval_rate":0.86}]}
```

* **导出任务**：`POST /api/v1/reports/export` → `{export_id}`；`GET /api/v1/exports/{export_id}` → `{status, download_url}`
* **错误码**：400/401/403/429/500 通用；金额权限不足返回 403 并触发脱敏展示。

## 10. Mock 数据（≥3 条代表性）

* `mocks/reports/overview.json`（见 KPI 示例）
* `mocks/reports/series.settlement.json`（见趋势示例）
* `mocks/reports/compare.campaign.json`（见对比示例）

## 11. 状态机与流程

* 数据加载：`idle → loading → success|error`；保存视图：`editing → saved`。
* 导出任务：`requested → processing → ready|failed`。

## 12. 边界条件与异常场景

* 权限裁剪：无 `finance` 角色金额脱敏（显示区间或*）。
* 数据跨度超限：提示改用导出；趋势上限 400 点。
* 无数据：空态与引导文案。
* 接口失败：重试 2 次并显示错误卡片。

## 13. 交互细节

* KPI 卡 hover 显示同比/环比细节；点击下钻。
* 趋势图支持 brush 缩放、图例开关、导出图片。
* 对比图支持切换 metric 与排序。
* 明细表支持列选择、固定列与 CSV 直接导出（调用导出任务）。

## 14. 可用性/无障碍要点

* 指标卡/图表/表格均可键盘操作；提供 aria-label。
* 颜色 + 图标双重表达；对金额采用千分位与单位。
* 吸顶筛选条在小屏下折叠为两行。

## 15. 性能与分页要求

* KPI/趋势接口目标 < 500ms；明细表 < 800ms。
* 后端缓存 filters 哈希（TTL 300s）；ETag 与 gzip 开启。
* 明细表分页 20/页，最大 200；导出走后台任务。

## 16. 日志/审计点

* `view_reports_overview`（filters_hash, user_id）。
* `export_reports_overview`（filters_hash, user_id）。

## 17. 监控/埋点事件

* `page_view:reports_overview`
* `filter_change:reports_overview` {field, from, to}
* `kpi_click:reports_overview` {kpi_key}
* `chart_brush:reports_overview` {metric, from_ts, to_ts}

## 18. 验收标准（Checklist）

* [ ] 权限裁剪正确（金额脱敏策略生效）。
* [ ] KPI/趋势/对比与明细表一致，切换筛选联动无误。
* [ ] 下钻跳转准确携带筛选参数。
* [ ] 导出任务生成并在导出中心可见。
* [ ] 空态、错误态、加载骨架符合设计。
* [ ] e2e：加载 → 切换维度 → 下钻 → 导出。

## 19. 交付物清单

* 设计稿：`reports-overview.fig`。
* OpenAPI 片段：`openapi/reports.overview.yaml`、`reports.series.yaml`、`reports.compare.yaml`、`reports.table.yaml`、`reports.export.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/reports-overview.spec.ts`。
* 验收 checklist：`acceptance/reports-overview-checklist.md`。

## 20. 签收（产品/运营/财务/QA/日期）

* Product：____  运营：____  财务：____  QA：____  日期：____
