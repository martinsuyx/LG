# 后台 Demo —— 页面规格（P1-10 任务管理 / Tasks）

## 1. 页面名称（中/英）

任务管理 / Tasks

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：活动与任务管理 → 任务管理
* 权限：`product`（新建/编辑草稿）、`operator`（只读）、`reviewer`（查看并使用审核规则模板）、`admin`（全部：发布、下架、复制、导出）

## 3. 目标与业务价值（1 句话）

以「任务」为载体，将表单 DSL、审核规则与风控策略进行组合配置并发布，驱动前台采集与后台审核的标准化落地。

## 4. 主要用户场景（2–3 个）

* 产品/运营创建任务：绑定表单 DSL、定义审核规则、设置提交/复核流程，发布供前线使用。
* 审核员依据任务的审核规则模板执行复核；异常时触发风控工单。
* 对已发布任务进行版本化管理、灰度发布与回滚。

## 5. 设计稿链接与断点

* 参考：高保真 V2（活动与任务管理 · 任务配置）、V3（审核流）。
* 断点：≥1280 双栏布局（左侧列表，右侧详情/编辑抽屉）；≤1024 单栏分步页。

## 6. 页面组件结构（信息架构）

* **筛选区**：关键词、状态（草稿/已发布/已下架/已废弃）、表单 DSL、风控模板、适用角色、有效期。
* **任务列表**：名称、任务码、状态、版本、表单 DSL 绑定、审核规则摘要、有效期、最近发布人/时间。
* **右侧详情/编辑抽屉**：

  1. 基本信息（名称、码、描述、有效期、适用范围、可见角色）
  2. 表单 DSL 绑定（选择/预览、字段映射校验）
  3. 审核规则配置（字段校验、阈值、必审/免审策略、人工复核触发条件）
  4. 风控策略绑定（命中后动作：拦截/降权/进入工单）
  5. 提交流程设置（单人/双人复核、SLA、超时提醒）
  6. 发布策略（立即/定时、灰度比例、回滚版本）
  7. 发布日志（版本列表与 diff 查看）
* **操作区**：新建、编辑、发布/下架、复制、导出。

## 7. 字段清单（字段名/类型/必填/校验/示例/控件）

* **基本信息**：

  * `task_id`(string, 只读)
  * `name`(string, 必填, 2–40)
  * `code`(string, 必填, 唯一, 大写字母数字 3–16)
  * `desc`(string, 选填 ≤200)
  * `status`(enum: draft|published|offline|deprecated)
  * `version`(int, 只读，自增)
  * `start_time`/`end_time`(datetime, 必填, `start<end`)
  * `visible_to_roles[]`(operator|promoter|store_owner|reviewer)
  * `scope`(companies[]|cities[]|stores[] 至少一类)
* **表单绑定 `form_dsl`**：

  * `form_dsl_id`(string, 必填)
  * `schema_version`(string, 只读)
  * `fields_map[]`：{`dsl_key`, `biz_key`, `required`(bool), `validation`(regex|enum|range)}
* **审核规则 `review_rules`**：

  * `auto_checks[]`：如 {`key`:`id_number`, `rule`:`regex_cn_id`, `level`:`error|warn`, `message`}
  * `thresholds[]`：如 {`key`:`amount`, `op`:`>=`, `value`:50, `action`:`manual_review`}
  * `sampling`：{`percent`: int [0,100], `seed`: string}（免审/抽审）
  * `double_review`(bool)：是否双人复核
  * `sla`(int, 分钟)：审核时限
* **风控策略 `risk_policy_id?`**：引用风控模板；命中后动作：`block|queue|flag`。
* **发布策略 `release`**：{`mode`:`immediate|scheduled`, `schedule_time`?, `gray_percent`?, `rollback_to_version`?}

## 8. 操作/按钮（权限/确认/提示）

* **新建任务**：`POST /api/v1/tasks`（初始 draft）。
* **编辑任务**：`PUT /api/v1/tasks/{id}`（仅 draft/offline 可编）。
* **发布**：`POST /api/v1/tasks/{id}/publish`（支持灰度）— 二次确认弹窗展示影响范围与 DSL 校验结果。
* **下架**：`POST /api/v1/tasks/{id}/offline`（需填写原因）。
* **复制**：`POST /api/v1/tasks/{id}/clone`（生成新 draft）。
* **查看发布日志**：右侧 tab 展示版本列表与 diff。
* **导出**：`POST /api/v1/exports/tasks`（带筛选）。

## 9. API 合约（方法/URL/参数/响应示例/错误码）

* **列表**：`GET /api/v1/tasks?status=published&form_dsl_id=F123&page=1&page_size=20`

```json
{
  "total": 36,
  "page": 1,
  "page_size": 20,
  "items": [
    {"task_id":"T20251003001","name":"实名开户提交","code":"OPENKYC","status":"published","version":7,"start_time":"2025-10-01T00:00:00+08:00","end_time":"2025-12-31T23:59:59+08:00","form_dsl_id":"F123","risk_policy_id":"R001","visible_to_roles":["operator","reviewer"],"scope":{"cities":["GZ"],"stores":[]}}
  ]
}
```

* **详情**：`GET /api/v1/tasks/{id}` → 返回基本信息、form_dsl 绑定、review_rules、risk_policy、release、versions。
* **新建/编辑**：`POST|PUT /api/v1/tasks{/{id}}` → 返回 `task_id`。
* **发布/下架/复制**：`POST /api/v1/tasks/{id}/publish|offline|clone`。
* **DSL 校验**：`POST /api/v1/tasks/{id}/validate` → 返回缺失字段、非法规则等。
* **发布日志**：`GET /api/v1/tasks/{id}/versions?page=1&page_size=20`

```json
{"total":7,"page":1,"page_size":20,"items":[{"version":7,"operator":"alice","time":"2025-10-03T10:00:00+08:00","changelog":"调整阈值 amount>=59"}]}
```

* **导出**：`POST /api/v1/exports/tasks` → `{export_id}`；`GET /api/v1/exports/{export_id}`。
* **错误码**：`400` 参数错误；`409` code 冲突；`422` DSL/规则校验失败；`403` 权限不足。

## 10. Mock 数据（≥3 条代表性）

* `mocks/tasks/list.page1.json`（见上例）
* `mocks/tasks/detail.json`

```json
{"task_id":"T20251003001","name":"实名开户提交","code":"OPENKYC","status":"draft","version":1,"start_time":"2025-10-05T00:00:00+08:00","end_time":"2025-12-31T23:59:59+08:00","form_dsl_id":"F123","form_dsl":{"schema_version":"1.4.2","fields":[{"key":"name","type":"text","required":true},{"key":"id_number","type":"text","required":true}]},"review_rules":{"auto_checks":[{"key":"id_number","rule":"regex_cn_id","level":"error","message":"证件号格式错误"}],"thresholds":[{"key":"amount","op":">=","value":59,"action":"manual_review"}],"sampling":{"percent":10,"seed":"202510"},"double_review":false,"sla":60},"risk_policy_id":"R001","release":{"mode":"immediate"},"visible_to_roles":["operator","reviewer"],"scope":{"cities":["GZ"]}}
```

* `mocks/tasks/validate.fail.json`

```json
{"ok":false,"missing_fields":["id_number"],"invalid_rules":[{"key":"amount","reason":"op not allowed for text"}]}
```

## 11. 状态机与流程

* `draft → published → offline → deprecated`。
* 复制：`any → clone → draft`。
* 发布：`immediate` 直接生效；`scheduled` 到时切换；`gray` 走灰度百分比，支持回滚到指定版本。

## 12. 边界条件与异常场景

* 表单 DSL 与审核规则字段不一致：发布阻断并给出差异报告。
* 有效期冲突：同范围同 code 在有效期内禁止重复发布。
* 灰度比例非法（>100% 或 <0%）：前端拦截。
* 下架原因缺失：阻断并提示。
* 历史版本回滚后需重新校验 DSL 与规则兼容性。

## 13. 交互细节

* 列表支持按状态、版本、时间排序；关键词搜索匹配 name/code。
* 编辑抽屉提供「校验并预览」按钮：生成字段映射对照表。
* 审核规则配置提供快捷模板与校验器（regex/枚举/范围）。
* 版本列表支持 diff：高亮展示变更的字段/规则/范围。
* 发布弹窗展示影响范围（城市/门店数量）与灰度计划。

## 14. 可用性/无障碍要点

* 表单与规则分步配置，避免一次性过载；每步有保存草稿。
* 键盘可操作 DSL 字段选择、上移/下移；Esc 关闭抽屉。
* 错误提示就近显示并提供修复建议链接（跳到对应字段）。

## 15. 性能与分页要求

* 列表接口目标 < 600ms；详情 < 500ms。
* 版本列表分页，每页 20 条。
* DSL/规则校验在后台执行并缓存 5 分钟（同一草稿版本）。

## 16. 日志/审计点

* `task_create|update|publish|offline|clone|rollback`（包含操作人、diff）。
* `task_validate`（结果、耗时、错误项）。

## 17. 监控/埋点事件

* `page_view:tasks`
* `filter_change:tasks` {field, from, to}
* `task_publish_click` {task_id, mode, gray_percent?}
* `task_validate_click` {task_id}
* `task_version_diff_view` {task_id, from, to}

## 18. 验收标准（Checklist）

* [ ] 新建/编辑/发布/下架/复制/回滚流程完整，状态机正确。
* [ ] DSL 绑定与字段映射校验通过；不一致时阻断并展示差异。
* [ ] 审核规则生效（含阈值/抽审/双人复核/SLA）。
* [ ] 版本日志完整可追溯，支持 diff。
* [ ] 权限裁剪正确（product 可编草稿、operator 只读、admin 全量）。
* [ ] e2e 覆盖：创建草稿 → 绑定 DSL → 校验 → 发布 → 下架 → 复制。

## 19. 交付物清单

* 设计稿：`tasks.fig`。
* OpenAPI 片段：`openapi/tasks.list.yaml`、`tasks.detail.yaml`、`tasks.create.yaml`、`tasks.update.yaml`、`tasks.publish.yaml`、`tasks.offline.yaml`、`tasks.clone.yaml`、`tasks.validate.yaml`、`tasks.versions.yaml`、`tasks.export.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/tasks.spec.ts`。
* 验收 checklist：`acceptance/tasks-checklist.md`。

## 20. 签收（产品/运营/QA/日期）

* Product：____  运营：____  QA：____  日期：____
