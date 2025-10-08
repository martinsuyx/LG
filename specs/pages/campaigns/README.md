# 后台 Demo —— 页面规格（P1-9 活动管理 / Campaigns）

## 1. 页面名称（中/英）

活动管理 / Campaigns

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：活动与任务管理 → 活动管理
* 权限：`operator`（只读）、`product`（新建/编辑草稿）、`admin`（全部：发布、下架、复制、导出）

## 3. 目标与业务价值（1 句话）

统一配置并运营活动（套餐、有效期、适用范围、计佣规则），支撑前台拉新转化与后端结算对齐。

## 4. 主要用户场景（2–3 个）

* 产品/运营创建或复制活动，配置套餐与门店范围，上架发布。
* 运营按状态/门店/时间筛选活动，查看转化指标并导出。
* 出现配置错误时，快速下架并修订为新版本。

## 5. 设计稿链接与断点

* 参考：高保真 V2（活动与任务管理）。
* 断点：≥1280 双栏（左列表，右详情/编辑面板）；≤1024 单栏切页。

## 6. 页面组件结构（信息架构）

* **筛选区**：关键词、状态（草稿/已发布/已下架/已结束）、城市、门店、适用渠道、有效期。
* **活动列表**（卡片或表格）：名称、活动码、状态、有效期、适用范围、转化指标。
* **右侧详情/编辑面板**（抽屉）：基本信息、套餐配置、适用范围、计佣规则、风控/审核策略（引用任务/表单 DSL）、预览。
* **操作区**：新建、编辑、发布/下架、复制、导出。

## 7. 字段清单（字段名/类型/必填/校验/示例/控件）

* **基本信息**：

  * `campaign_id`(string, 只读)
  * `name`(string, 必填, 2–40)
  * `code`(string, 必填, 唯一, 大写字母数字, 3–16)
  * `desc`(string, 选填 ≤200)
  * `status`(enum: draft|published|offline|ended)
  * `start_time`/`end_time`(datetime, 必填, `start<end`)
  * `channels[]`(enum: wechat|h5|scan|api)
* **套餐配置 `plans[]`**：

  * `plan_id`(string, 只读)
  * `name`(string, 必填)
  * `price`(decimal, 必填, ≥0)
  * `commission_scheme`(object)：`type`(fixed|percent|tier), `value`(number), `tiers[]?`
  * `constraints`(object)：例如新用户专享/每证件限购等
* **适用范围 `scope`**：

  * `companies[]`/`cities[]`/`stores[]`（多选，二选一或组合；至少指定一个维度）
* **审核/表单 `form_dsl_id`**：关联任务/表单 DSL（外键）。
* **风控策略 `risk_policy_id?`**：引用风控模板。
* **可见性**：`visible_to_roles[]`(operator|promoter|store_owner)、`require_invite`(bool)。

## 8. 操作/按钮（权限/确认/提示）

* **新建活动**：`POST /api/v1/campaigns`（初始为 draft）。
* **编辑**：`PUT /api/v1/campaigns/{id}`（仅 draft/offline 可编辑）。
* **发布**：`POST /api/v1/campaigns/{id}/publish`（校验必填、时间与范围、套餐合法性）。
* **下架**：`POST /api/v1/campaigns/{id}/offline`（需备注原因）。
* **复制**：`POST /api/v1/campaigns/{id}/clone`（生成新 draft）。
* **导出**：`POST /api/v1/exports/campaigns`（带筛选条件）。

## 9. API 合约（方法/URL/参数/响应示例/错误码）

* **列表**：`GET /api/v1/campaigns?status=published&city=GZ&keyword=5G&page=1&page_size=20`

```json
{
  "total": 58,
  "page": 1,
  "page_size": 20,
  "items": [
    {"campaign_id":"C20251003001","name":"5G 新装 59 元套餐","code":"5G59","status":"published","start_time":"2025-10-01T00:00:00+08:00","end_time":"2025-10-31T23:59:59+08:00","channels":["wechat","scan"],"scope":{"cities":["GZ"],"stores":[]},"metrics":{"impressions":12000,"submitted":640,"approved":480,"settled":420}}
  ]
}
```

* **详情**：`GET /api/v1/campaigns/{id}` → 返回基本信息、plans、scope、form_dsl、risk_policy、metrics 摘要。
* **新建/编辑**：`POST|PUT /api/v1/campaigns{/{id}}` → 返回 `campaign_id`。
* **发布/下架/复制**：`POST /api/v1/campaigns/{id}/publish|offline|clone`。
* **导出**：`POST /api/v1/exports/campaigns` → `{export_id}`；`GET /api/v1/exports/{export_id}`。
* **错误码**：`400` 参数错误；`409` code 冲突/时间重叠；`422` 范围为空或套餐非法；`403` 权限不足。

## 10. Mock 数据（≥3 条代表性）

* `mocks/campaigns/list.page1.json`（见上例）。
* `mocks/campaigns/detail.json`

```json
{"campaign_id":"C20251003001","name":"5G 新装 59 元套餐","code":"5G59","status":"draft","start_time":"2025-10-05T00:00:00+08:00","end_time":"2025-11-05T23:59:59+08:00","channels":["wechat","scan"],"plans":[{"plan_id":"P1","name":"59 元档","price":59.00,"commission_scheme":{"type":"fixed","value":10.00},"constraints":{"new_user_only":true}}],"scope":{"cities":["GZ"],"stores":[]},"form_dsl_id":"F123","risk_policy_id":"R001","visible_to_roles":["operator","promoter"],"require_invite":true}
```

* `mocks/campaigns/publish.success.json`

```json
{"ok":true,"new_status":"published"}
```

## 11. 状态机与流程

* `draft → published → offline → ended`。
* 复制：`any → clone → draft`。
* 时间边界：到 `end_time` 自动进入 `ended`（不可再上架）。

## 12. 边界条件与异常场景

* 有效期与门店范围为空：禁止发布。
* 套餐价格或计佣不合法：阻断，并高亮错误字段。
* code 重复或与历史活动冲突：返回 409。
* 正在发布期的活动禁止编辑关键字段（时间/范围/计佣）。
* 范围过大导致性能风险：前端提示改用“城市/公司”维度而非单店全量勾选。

## 13. 交互细节

* 列表支持按状态/有效期/创建时间排序；支持批量下架（多选）。
* 右侧编辑面板分步：基本信息 → 套餐 → 范围 → 规则 → 预览 → 校验通过才能保存。
* `plans[]` 支持增删改、上移下移；支持「从模板创建」。
* scope 选择器支持“按城市全选门店”。
* 发布需二次确认 modal（展示影响范围统计）。

## 14. 可用性/无障碍要点

* 表单分组清晰、实时校验、错误信息就近显示。
* 键盘导航覆盖全部控件；支持 Enter 保存、Esc 关闭抽屉。
* 对色盲用户提供状态文字+图标双重标识。

## 15. 性能与分页要求

* 列表接口目标 < 600ms；详情 < 400ms。
* 每页最多 200 条；`scope` 选择时采用分页/搜索。
* 频繁保存草稿走乐观更新；服务端 debounce/乐观锁版本号。
* 导出走后台任务（分页合并）。

## 16. 日志/审计点

* `campaign_create|update|publish|offline|clone`（包含操作人、diff 摘要）。
* `plan_change`（计划项增删改）。
* `scope_change`（范围调整，记录数量级）。

## 17. 监控/埋点事件

* `page_view:campaigns`
* `filter_change:campaigns` {field, from, to}
* `campaign_publish_click` {campaign_id}
* `campaign_offline_click` {campaign_id}
* `campaign_clone_click` {campaign_id}

## 18. 验收标准（Checklist）

* [ ] 新建/编辑/发布/下架/复制流程可走通，状态机正确。
* [ ] 必填与合法性校验完整（时间/范围/套餐/计佣）。
* [ ] 列表/详情字段与设计一致，排序与筛选准确。
* [ ] 导出任务生成并在导出中心可见。
* [ ] 权限裁剪正确（operator 只读，product 可编辑草稿）。
* [ ] e2e 覆盖：新建草稿 → 发布 → 下架 → 复制。

## 19. 交付物清单

* 设计稿：`campaigns.fig`。
* OpenAPI 片段：`openapi/campaigns.list.yaml`、`campaigns.detail.yaml`、`campaigns.create.yaml`、`campaigns.update.yaml`、`campaigns.publish.yaml`、`campaigns.offline.yaml`、`campaigns.clone.yaml`、`campaigns.export.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/campaigns.spec.ts`。
* 验收 checklist：`acceptance/campaigns-checklist.md`。

## 20. 签收（产品/运营/QA/日期）

* Product：____  运营：____  QA：____  日期：____
