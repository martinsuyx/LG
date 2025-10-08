P0-1 仪表盘 / 总览（Dashboard / Overview）

页面名称（中/英）：仪表盘 / Dashboard

归属菜单（父菜单 / 权限 Role）：顶级菜单「总览」→「Dashboard」。最小可见权限：operator；含敏感金额维度（GMV/结算）需 finance；风险卡片需 risk；全部可见为 admin。

目标与业务价值（1 句话）：以“一屏尽览”的方式呈现核心经营与运行健康度，并提供到关键工作台的 1 次点击直达路径。

主要用户场景（2–3 个）：

每日早会：管理员 9:30 查看昨日/本周 KPI、订单趋势、异常提醒，决定今日审核与外呼重点。

运营值守：监控实时（或近实时）异常命中、待审核量，快速跳转处理。

财务对账：当日结算/提现进度心中有数，必要时从快捷入口进入导出中心。

设计稿链接与断点：

参考：高保真 V6（报表与总览）。

断点：≥1440（桌面宽屏布局，3 列卡片）、1280（2 列卡片）、≤1024（单列堆叠）。

主题：跟随系统明/暗色；数值卡高对比呈现。

页面组件结构（信息架构）：

全局筛选条（固定在顶端）：日期范围（today / 7d / 30d / 自定义）、粒度（d/w/m）、公司、城市、渠道。

KPI 指标区（4–6 张卡片）：今日订单数、今日结算金额、待审核订单、异常命中、提现处理中、通过率（%）。

趋势图区（2 张）：

订单量趋势（折线 / 面积，支持同比环比线）；

结算金额趋势（折线）。

分析卡（可切换）：活动转化率（展示 曝光→提交→审核通过→结算 的漏斗或柱状对比）。

TopN 列表：门店 Top10（按订单量/结算额切换），推广人 Top10。

快捷入口区：待审核工作台、导出中心、风控命中、提现管理、活动管理。

异常提醒条（可折叠）：规则命中数>阈值、失败回调、导出任务失败等。

字段清单（字段名/类型/必填/校验/示例/控件）：

全局筛选：

start/end(date, 必填)：ISO 日期；校验 start≤end；示例 2025-10-01。

granularity(enum: d|w|m, 必填)：默认 d。

company_id(string, 选填)：未选则汇总；有权限控制。

city(string, 选填)：城市码。

channel(string[], 选填)：wechat|h5|scan|api 多选。

KPI 卡片（每卡统一结构）：

key(string)：orders_today|settlement_today|pending_reviews|risk_hits|payout_processing|approval_rate。

value(number)：主数值；金额单位元，保留 2 位；比率保留 1 位%。

delta(number, 选填)：与昨日/上周同日的差值或差率。

trend(enum: up|down|flat, 选填)。

unit(string)：笔/元/%。

drill_link(string)：点击跳转 URL（带当前筛选）。

趋势图数据点：ts(ISO datetime), value(number), baseline_yesterday(number, 选填), baseline_lastweek(number, 选填)。

TopN 列表：rank(int), name(string), id(string), metric(number), metric_name(string)。

异常提醒：type(enum: risk|callback|export|payout), level(info|warn|error), title(string), desc(string), action_link(string)。

操作/按钮（权限/确认/提示）：

筛选：选择时间/公司/城市/渠道 → 自动刷新；提供「重置」按钮。

卡片点击：跳转至相应列表页，并携带当前筛选（例如 orders_today → 订单列表页，状态=全部，日期=所选范围）。

图表交互：hover 显示 tooltip；框选（brush）缩放；点击某天 → 跳转带日期过滤的订单列表。

导出：右上角「导出当前视图」→ POST /dashboard/export，完成后提示“已生成导出任务”。

刷新：右上角手动刷新；自动刷新（可选）每 5 分钟。

API 合约（方法/URL/参数/响应示例/错误码）：

KPI 概览：GET /api/v1/dashboard/overview

参数：start,end,granularity,company_id,city,channel[],tz（默认 Asia/Shanghai）。

响应：

{
  "kpis": [
    {"key":"orders_today","value":123,"delta":+18,"trend":"up","unit":"笔","drill_link":"/orders?start=2025-10-01&end=2025-10-01"},
    {"key":"settlement_today","value":4567.89,"delta":-230.11,"trend":"down","unit":"元","drill_link":"/wallet/ledger?..."},
    {"key":"pending_reviews","value":34,"unit":"笔","drill_link":"/review"},
    {"key":"risk_hits","value":5,"unit":"笔","drill_link":"/risk/hits"},
    {"key":"payout_processing","value":7,"unit":"笔","drill_link":"/payouts?status=processing"},
    {"key":"approval_rate","value":88.6,"unit":"%","delta":+2.1,"trend":"up","drill_link":"/orders?status=approved"}
  ]
}

时间序列：GET /api/v1/dashboard/series

参数：metric=orders|gmv|approval_rate + 通用筛选。

响应：{"metric":"orders","points":[{"ts":"2025-09-28","value":120,"baseline_yesterday":110,"baseline_lastweek":98}]}

TopN：GET /api/v1/dashboard/top

参数：dimension=store|promoter&metric=orders|gmv&limit=10 + 通用筛选。

响应：{"dimension":"store","metric":"orders","items":[{"rank":1,"name":"天河一店","id":"s001","metric":230}]}

活动转化：GET /api/v1/dashboard/funnel

参数：campaign_id? + 通用筛选。

响应：{"stages":[{"key":"impression","value":12000},{"key":"submitted","value":600},{"key":"approved","value":420},{"key":"settled","value":360}]}

异常提醒：GET /api/v1/dashboard/alerts → [{"type":"risk","level":"warn","title":"风控命中上升","desc":"近一小时+35%","action_link":"/risk/hits"}]

导出：POST /api/v1/dashboard/export → { "export_id": "E20251002001" }; GET /api/v1/exports/{export_id} → { "status":"ready","download_url":"..." }

错误码：400 参数错误；401/403 鉴权或权限不足；429 频率限制；500 服务器异常。

Mock 数据（≥3 条代表性）：

mocks/dashboard/overview.json

{"kpis":[
 {"key":"orders_today","value":128,"delta":12,"trend":"up","unit":"笔","drill_link":"/orders?..."},
 {"key":"settlement_today","value":5234.90,"delta":-120.50,"trend":"down","unit":"元","drill_link":"/wallet/ledger?..."},
 {"key":"pending_reviews","value":41,"unit":"笔","drill_link":"/review"},
 {"key":"risk_hits","value":3,"unit":"笔","drill_link":"/risk/hits"},
 {"key":"payout_processing","value":5,"unit":"笔","drill_link":"/payouts?status=processing"},
 {"key":"approval_rate","value":86.4,"delta":1.8,"trend":"up","unit":"%","drill_link":"/orders?status=approved"}
]}

mocks/dashboard/series.orders.json

{"metric":"orders","points":[
 {"ts":"2025-09-26","value":96,"baseline_yesterday":92,"baseline_lastweek":80},
 {"ts":"2025-09-27","value":110,"baseline_yesterday":96,"baseline_lastweek":85},
 {"ts":"2025-09-28","value":120,"baseline_yesterday":110,"baseline_lastweek":98}
]}

mocks/dashboard/top.store.json

{"dimension":"store","metric":"orders","items":[
 {"rank":1,"name":"天河一店","id":"s001","metric":230},
 {"rank":2,"name":"海珠二店","id":"s002","metric":200},
 {"rank":3,"name":"越秀三店","id":"s003","metric":180}
]}

状态机与流程：

数据刷新状态：idle → loading → success|error；开启自动刷新时进入周期性 loading。

告警确认（可选）：new → acknowledged → resolved（仅做前端状态，不落库亦可）。

边界条件与异常场景：

无数据：展示空态与引导（去创建活动 / 去导入订单）。

权限裁剪：无 finance 角色隐藏金额相关 KPI；无 risk 隐藏风险区块。

时区：以 tz 计算自然日；跨日切换即时刷新；支持夏令时地区。

极端值：数值超大使用单位缩写（万/百万）；图表自动适配 Y 轴。

接口超时/失败：重试 2 次；展示错误提示与“重试”按钮。

并发筛选：切换筛选期间取消上一次请求（避免竞态）。

交互细节：

全局筛选栏吸顶；切换任何筛选项即刻刷新。

卡片 hover 显示对比（与昨日同比/环比）；支持复制数值。

图表：可切换「绝对值/百分比」视图；支持图例点击开关序列；提供“下载 PNG”。

TopN 支持按 orders/gmv 切换与搜索。

快捷入口右上角显示待处理计数徽标（最多 99+）。

可用性/无障碍要点：

键盘导航：Tab 遍历卡片与图表；Enter 进入 drill。

颜色：状态色具备 ≥4.5:1 对比度；同时提供图标/文字，不仅靠颜色区分。

触控：点击区域≥44×44；tooltip 支持键盘触发。

性能与分页要求：

KPI/趋势接口目标 TTFB < 300ms，整体 < 1s；后端启用缓存（键：filters 哈希，TTL=300s）。

返回点位上限：series ≤ 400 点；超过则后端降采样或前端抽稀。

使用 ETag/Last-Modified；开启 gzip/br；分页仅用于 TopN（limit ≤ 50）。

日志/审计点：

导出动作：export_dashboard_data（包含 filters, user_id）。

权限失败：记录 forbidden_dashboard_block（block_key, user_id）。

其余浏览类动作无需审计（可仅埋点）。

监控/埋点事件（事件名 + 属性）：

page_view:dashboard {filters_hash}

filter_change:dashboard {field, from, to}

kpi_click {kpi_key}

chart_brush {metric, from_ts, to_ts}

quicklink_click {target}

export_click {filters_hash}

验收标准（Checklist）：



交付物清单：

设计：dashboard.fig / Figma 链接；状态注释（空/加载/错误）。

OpenAPI 片段：openapi/dashboard.overview.yaml、dashboard.series.yaml、dashboard.top.yaml、dashboard.funnel.yaml、dashboard.alerts.yaml、dashboard.export.yaml。

Mocks：见第 10 条的 3 个 JSON；补充 alerts.json、funnel.json。

e2e：tests/e2e/dashboard.spec.ts（加载/筛选/跳转/导出）。

接口对齐表：specs/pages/dashboard/mapping.md（drill-link 指向的目标页）。

签收（产品/运营/QA/日期）：

Product：____  运营：____  QA：____  日期：____