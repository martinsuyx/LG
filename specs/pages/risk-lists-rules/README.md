# 后台 Demo —— 页面规格（P2-15 黑白名单与规则 / Risk Lists & Rules）

## 1. 页面名称（中/英）

黑白名单与规则 / Risk Lists & Rules

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：风控与合规管理 → 黑白名单与规则
* 权限：`risk`（增删改、导入/导出、规则启停、仿真）、`admin`（全部，含回放与灰度）、`reviewer`（只读）

## 3. 目标与业务价值（1 句话）

以规模化名单（黑/白/灰）与可版本化规则组合成风控引擎输入，支持批量导入、索引优化、去重校验，以及规则的仿真测试、灰度发布与回放复盘。

## 4. 主要用户场景（2–3 个）

* 风控同事导入/维护黑白名单（手机号/证件/设备/门店等），快速生效并支持去重与冲突校验。
* 策略同学在规则编辑器里配置条件、权重、阈值，先用历史数据仿真，再灰度发布到线上。
* 值守人员查看规则命中趋势、回放历史，进行策略优化与回滚。

## 5. 设计稿链接与断点

* 参考：高保真 V4（风控与合规管理）。
* 断点：≥1440 三区布局（左侧列表、顶部统计卡/操作条、右侧编辑/详情抽屉）；≤1024 切页分步。

## 6. 页面组件结构（信息架构）

* **上部切换 Tab**：名单（Lists）、规则（Rules）。
* **名单页（Lists）**：

  * 筛选区：名单类型、主体类型、状态、来源、时间、关键词。
  * 列表：主体值、类型、状态（active/archived）、命中次数、来源、备注、有效期。
  * 操作条：新建、批量导入、批量归档、导出。
  * 右侧抽屉：名单条目详情、命中历史、冲突提示。
* **规则页（Rules）**：

  * 筛选区：状态、规则包、等级、更新时间、关键词。
  * 列表：规则编码、名称、等级、版本、状态、近 7 日命中、最后修改人/时间。
  * 右侧编辑器：

    1. 基本信息（编码、名称、等级、描述）
    2. 规则逻辑（条件编辑器、权重、阈值）
    3. 数据源映射（表单/订单/设备/地理等字段）
    4. 仿真测试（样本集选择、指标输出）
    5. 发布策略（灰度比例/范围、定时发布、回滚）
    6. 版本日志（diff 与注释）
  * 操作条：新建规则、保存草稿、仿真、发布/下线、复制、导出。

## 7. 字段清单（字段名/类型/必填/校验/示例/控件）

* **名单 ListItem**：

  * `list_id`(string, 只读)、`type`(enum: blacklist|whitelist|greylist, 必填)、`entity_type`(enum: phone|id_number|device|ip|store|user)、`entity_value`(string, 必填，按类型校验正则)、`status`(active|archived)、`source`(manual|import|api)、`expire_at?`(datetime)、`note?`(string ≤200)、`created_at`、`updated_at`、`hit_count`(int)。
* **导入任务 ImportTask**：

  * `task_id`、`file_name`、`rows_total`、`rows_valid`、`rows_invalid`、`status`(pending|processing|succeeded|failed)、`error_file?`。
* **规则 Rule**：

  * `rule_id`、`code`(唯一，必填)、`name`、`level`(low|medium|high|critical)、`status`(draft|published|offline|deprecated)、`version`(int)、`weight`(number, 默认 1.0)、`threshold`(number, 0–100)、`expr`(DSL/JSON)、`datasource_map`(object)、`package`(string，用于归组)、`changelog`(string)。
* **仿真与回放**：

  * `simulation_id`、`dataset`(last_7d|last_30d|custom_range|sample_file)、`metrics`(precision|recall|fpr|tpr|auc|coverage|hit_count)、`filters`、`result_url`。
  * `replay_id`、`range`、`before_rule_version`、`after_rule_version`、`delta_metrics`。

## 8. 操作/按钮（权限/确认/提示）

* **名单**：

  * 新建条目：`POST /api/v1/risk/lists`。
  * 批量导入：`POST /api/v1/risk/lists/import`（上传 CSV/XLSX，异步任务）。
  * 批量归档：`POST /api/v1/risk/lists/batch_archive`。
  * 导出：`POST /api/v1/exports/risk-lists`。
* **规则**：

  * 新建/保存草稿：`POST /api/v1/risk/rules` / `PUT /api/v1/risk/rules/{id}`。
  * 仿真：`POST /api/v1/risk/rules/{id}/simulate`（选择数据集/样本）。
  * 发布：`POST /api/v1/risk/rules/{id}/publish`（支持灰度：percent / 范围=城市/渠道/门店）。
  * 下线：`POST /api/v1/risk/rules/{id}/offline`。
  * 复制：`POST /api/v1/risk/rules/{id}/clone`。
  * 回放：`POST /api/v1/risk/rules/{id}/replay`（对历史窗口重放新版 vs 旧版）。

## 9. API 合约（方法/URL/参数/响应示例/错误码）

* **名单列表**：`GET /api/v1/risk/lists?type=blacklist&entity_type=phone&keyword=138&page=1&page_size=20`

```json
{
  "total": 1250000,
  "page": 1,
  "page_size": 20,
  "items": [
    {"list_id":"L202510030001","type":"blacklist","entity_type":"phone","entity_value":"13800000000","status":"active","source":"import","hit_count":42,"expire_at":"2026-10-03T00:00:00+08:00"}
  ]
}
```

* **导入**：`POST /api/v1/risk/lists/import` → `{task_id}`；`GET /api/v1/risk/lists/import/{task_id}` → `{status, rows_total, rows_valid, rows_invalid, error_file}`。
* **去重/冲突校验**：`POST /api/v1/risk/lists/dedup_preview` → 返回将被去重/冲突（白/黑同时存在）统计与样例。
* **规则列表**：`GET /api/v1/risk/rules?status=published&package=geo&page=1&page_size=20`

```json
{"total":12,"items":[{"rule_id":"R001","code":"GEOFENCE_OUT","name":"越界地理围栏","level":"high","status":"published","version":7,"weight":1.0,"threshold":80}]}
```

* **规则详情**：`GET /api/v1/risk/rules/{id}` → 基本信息、expr、datasource_map、versions、metrics 摘要。
* **仿真**：`POST /api/v1/risk/rules/{id}/simulate` → `{simulation_id, metrics:{precision:0.92, recall:0.78, coverage:0.35, hit_count:420}}`。
* **发布（灰度）**：`POST /api/v1/risk/rules/{id}/publish` body: {mode:"immediate|scheduled|gray", gray_percent?, scope?} → `{ok:true, new_status:"published", version:8}`。
* **回放**：`POST /api/v1/risk/rules/{id}/replay` body: {range:{start,end}, base_version, new_version} → `{replay_id, delta_metrics:{hit:+8%, fpr:-1.2pp}}`。
* **错误码**：`400` 参数错误；`409` 规则编码冲突/版本冲突；`413` 导入文件过大；`422` 名单校验失败/规则校验失败；`429` 频率限制；`500` 异常。

## 10. Mock 数据（≥3 条代表性）

* `mocks/risk-lists/list.page1.json`（见上例）
* `mocks/risk-rules/list.page1.json`（见上例）
* `mocks/risk-rules/simulate.success.json`

```json
{"simulation_id":"S20251003001","metrics":{"precision":0.915,"recall":0.742,"coverage":0.368,"hit_count":412}}
```

## 11. 状态机与流程

* **名单**：`active ↔ archived`；导入任务：`pending → processing → succeeded|failed`。
* **规则**：`draft → published → offline → deprecated`；复制：任意→`clone`→`draft`。
* **灰度**：`published(gray)` → 达标（指标门限/时长）→ 全量发布；不达标 → 回滚原版本。
* **回放**：选择时间窗口与版本对比 → 生成 delta 指标 → 归档报告。

## 12. 边界条件与异常场景

* 名单导入超 500k 行：强制异步 + 分片；校验失败生成错误文件（逐行原因）。
* 名单冲突（同主体在黑/白同时存在）：阻断并提示解决策略（优先级或二选一）。
* 规则 DSL 语法错误或引用未知字段：保存/发布阻断并给出定位。
* 仿真样本偏差：提示样本覆盖率不足。
* 灰度范围与比例非法/超限：前端拦截。
* 回放窗口过大：建议离线任务，产出报告链接。

## 13. 交互细节

* 名单导入支持模板下载；上传后显示解析进度与错误样例预览。
* 名单列表支持批量勾选归档/导出；详情抽屉显示近 30 天命中趋势。
* 规则编辑器：提供可视化条件块（AND/OR/NOT、比较运算、集合运算）；支持 JSON/DSL 双视图切换。
* 仿真结果以卡片 + 图表展示，支持与上一版本对比。
* 版本日志 diff：高亮 `expr/threshold/weight/scope` 变化；支持回滚按钮。

## 14. 可用性/无障碍要点

* 键盘操作覆盖列表/表单/条件块增删；提供快捷键（新增条件、分组、保存）。
* 对色盲用户提供等级与状态文字标签。
* 大段 JSON/DSL 支持格式化与语法高亮，错误定位可被屏幕阅读器读取。

## 15. 性能与分页要求

* 名单列表：支持服务端分页与索引（基于 `entity_type+entity_value` 复合索引）；单页 ≤ 200 条。
* 导入：后端分片批处理（建议 5k/批），去重与冲突校验走批量 SQL/索引查找；耗时指标上报。
* 规则仿真/回放：采用异步任务，结果缓存 24h；大样本场景限制并发。
* 接口 SLA：列表 < 600ms、详情 < 500ms、导入任务状态 < 300ms。

## 16. 日志/审计点

* 名单：`list_create|import|archive|export`（包含操作者、文件哈希、行数、失败率）。
* 规则：`rule_create|update|simulate|publish|offline|clone|rollback|replay`（包含版本号、diff 摘要）。

## 17. 监控/埋点事件

* `page_view:risk_lists` / `page_view:risk_rules`
* `import_click:risk_lists` {rows_estimate}
* `simulate_click:risk_rules` {rule_id, dataset}
* `publish_click:risk_rules` {rule_id, mode, gray_percent?}
* `rollback_click:risk_rules` {from_version, to_version}

## 18. 验收标准（Checklist）

* [ ] 名单导入模板、解析、去重、冲突校验完整，错误文件可下载。
* [ ] 名单列表筛选/分页/导出准确；命中趋势与详情一致。
* [ ] 规则编辑、仿真、发布（含灰度）全链路可用，并产出指标。
* [ ] 回放任务能对比前后版本并给出 delta 指标与报告。
* [ ] 权限裁剪正确（reviewer 只读、risk 可操作、admin 全量）。
* [ ] e2e 覆盖：名单导入 → 去重校验 → 规则编辑 → 仿真 → 灰度发布 → 回放。

## 19. 交付物清单

* 设计稿：`risk-lists-rules.fig`。
* OpenAPI 片段：

  * Lists：`openapi/risk.lists.list.yaml`、`risk.lists.create.yaml`、`risk.lists.import.yaml`、`risk.lists.batch_archive.yaml`、`risk.lists.export.yaml`、`risk.lists.dedup_preview.yaml`
  * Rules：`openapi/risk.rules.list.yaml`、`risk.rules.detail.yaml`、`risk.rules.create.yaml`、`risk.rules.update.yaml`、`risk.rules.simulate.yaml`、`risk.rules.publish.yaml`、`risk.rules.offline.yaml`、`risk.rules.clone.yaml`、`risk.rules.replay.yaml`、`risk.rules.export.yaml`
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/risk-lists-rules.spec.ts`。
* 验收 checklist：`acceptance/risk-lists-rules-checklist.md`。

## 20. 签收（产品/风控负责人/QA/日期）

* Product：____  风控负责人：____  QA：____  日期：____
