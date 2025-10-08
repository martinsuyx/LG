# 后台 Demo —— 页面规格（P1-11 团队树与人员 / Team Tree & Members）

## 1. 页面名称（中/英）

团队树与人员 / Team Tree & Members

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：组织与用户管理 → 团队与人员
* 权限：`org_admin`（增删改、转移、导入/导出、权限分配）、`team_lead`（管理本团队及下级）、`operator`（只读） 、`admin`（全部）

## 3. 目标与业务价值（1 句话）

构建统一的推广团队树（多森林），支持跨公司复用、层级管理、成员邀请与权限边界控制，保证活动/任务可按团队范围精准下发与计佣。

## 4. 主要用户场景（2–3 个）

* 组织管理员创建或导入团队结构，指定团队负责人，进行成员批量邀请。
* 团队负责人查看下属结构，进行人员转移、离职处理与权限授予。
* 运营/活动配置在「选择范围」时按团队维度精准下发。

## 5. 设计稿链接与断点

* 参考：高保真 V5（组织与用户管理）。
* 断点：≥1440 左树右表双栏布局；≤1024 单栏切换树/表。

## 6. 页面组件结构（信息架构）

* **左侧团队树**：多棵树（Forest），节点类型=团队；支持搜索、展开/折叠、收藏常用节点。
* **右侧成员表格**：展示当前选中团队下的人员；支持分页、筛选、批量操作。
* **顶部操作区**：新建团队、批量导入、批量邀请、批量转移、导出。
* **侧边抽屉**：团队详情（负责人、上级、标签、统计）、成员详情（基本信息、权限、业绩摘要）。
* **安全提示条**：高风险操作（跨团队转移/解散团队）需二次确认。

## 7. 字段清单（字段名/类型/必填/校验/示例/控件）

* **团队 Team**：

  * `team_id`(string, 只读)、`name`(string, 必填 2–40)、`parent_id`(string|null)、`lead_user_id`(string)、`tags[]`(string)、`company_bindings[]`(string, 公司 ID 列表，可多公司绑定)、`status`(enum: active|archived)。
  * `created_at`(datetime)、`members_count`(int)、`stores_count`(int)。
* **成员 Member**：

  * `user_id`(string, 只读)、`name`(string)、`phone`(string)、`role`(enum: promoter|store_owner|staff|lead|viewer)、`email?`、`id_number?`、`status`(active|frozen|left)、`joined_at`(datetime)、`parent_user_id`(string|null)。
  * `team_path`(string[])（从根到当前团队的路径）。
* **邀请 Invite**：`invite_code`(string)、`expires_at`(datetime)、`target_team_id`(string)、`quota`(int)。

## 8. 操作/按钮（权限/确认/提示）

* 团队：**新建** `POST /api/v1/teams`、**重命名** `PUT /api/v1/teams/{id}`、**调整上级** `PUT /api/v1/teams/{id}/move`、**解散** `POST /api/v1/teams/{id}/archive`（需确认移交/清退策略）。
* 成员：**新增** `POST /api/v1/teams/{id}/members`、**批量导入** `POST /api/v1/members/import`、**批量邀请** `POST /api/v1/invites`、**转移团队** `POST /api/v1/members/batch_move`、**冻结/离职** `POST /api/v1/members/{id}/freeze|leave`。
* 权限：**授予角色** `POST /api/v1/members/{id}/role`、**授予团队管理权** `POST /api/v1/teams/{id}/grant`。
* 导出：`POST /api/v1/exports/teams`、`POST /api/v1/exports/members`。

## 9. API 合约（方法/URL/参数/响应示例/错误码）

* **获取团队树**：`GET /api/v1/teams/tree?company_id=...`

```json
{"trees":[{"team_id":"T001","name":"华南大区","parent_id":null,"children":[{"team_id":"T001A","name":"广州一区","parent_id":"T001"}]}]}
```

* **团队详情**：`GET /api/v1/teams/{id}` → 基本信息、统计、绑定公司。
* **成员列表**：`GET /api/v1/teams/{id}/members?page=1&page_size=20&status=active&role=promoter`

```json
{"total":120,"page":1,"page_size":20,"items":[{"user_id":"U1001","name":"张三","phone":"13800000000","role":"promoter","status":"active","joined_at":"2025-09-01T10:00:00+08:00"}]}
```

* **批量邀请**：`POST /api/v1/invites` body: {target_team_id, quota, expires_at} → `{invite_code}`
* **批量导入**：`POST /api/v1/members/import` → `{task_id}`（异步任务）
* **成员转移**：`POST /api/v1/members/batch_move` body: {user_ids:[], target_team_id} → `{ok:true,count}`
* **导出**：`POST /api/v1/exports/teams|members` → `{export_id}`
* **错误码**：`400` 参数错误；`403` 权限不足；`409` 环路/重复；`422` 导入校验失败；`423` 团队被锁定处理中。

## 10. Mock 数据（≥3 条代表性）

* `mocks/teams/tree.json`（见上例）
* `mocks/teams/{id}.json`（团队详情）

```json
{"team_id":"T001A","name":"广州一区","parent_id":"T001","lead_user_id":"U2001","tags":["GZ","5G"],"company_bindings":["C01"],"status":"active","created_at":"2024-05-01T10:00:00+08:00","members_count":68,"stores_count":35}
```

* `mocks/teams/members.page1.json`（见上例）

## 11. 状态机与流程

* 团队：`active → archived`（解散）；解散需指定成员处理策略：`move_to=<target_team>` 或 `set_left`。
* 成员：`active ↔ frozen → left`；`left` 不可恢复仅可重新邀请。
* 邀请：`created → sent → accepted|expired`。

## 12. 边界条件与异常场景

* **环路检测**：禁止将父节点移动到其子孙下（后端校验 409）。
* **跨公司**：允许团队绑定多个公司；成员转移到未绑定公司的团队时需提示并允许一并绑定。
* **批量导入**：CSV/XLSX 校验失败返回行级错误；超过 5k 行走异步任务。
* **并发修改**：使用版本号/ETag 乐观锁，冲突提示“已被他人更新”。
* **冻结成员**：其登录与结算均受限；展示影响提示。

## 13. 交互细节

* 左树支持拖拽变更上级（仅有权限节点可拖拽）；支持搜索与高亮。
* 右表支持列展示切换、保存列宽偏好、快速筛选（点击角色/状态徽标）。
* 批量操作前置校验与预估影响（例如：影响 N 个下级成员/门店）。
* 成员详情抽屉展示近 30 天业绩摘要与最近登录时间。
* 高风险操作（转移/解散）需输入团队名确认。

## 14. 可用性/无障碍要点

* 树节点与表格均支持键盘导航；Enter 展开/进入详情。
* 对色盲用户提供角色/状态的文字标签。
* 大数据量下提供加载骨架与渐进加载。

## 15. 性能与分页要求

* 团队树采用按需加载（懒加载子节点）；初次加载 ≤ 500ms。
* 成员列表分页默认 20，最大 200；支持服务端排序。
* 大规模导入走异步任务，状态轮询 2s；导出任务统一到导出中心。
* 缓存：热门节点与其直接子节点缓存 5 分钟。

## 16. 日志/审计点

* 团队：`team_create|rename|move|archive|grant`（记录操作者与前后差异）。
* 成员：`member_add|move|freeze|leave|role_change`。
* 邀请/导入/导出：`invite_create|member_import|team_export|member_export`。

## 17. 监控/埋点事件

* `page_view:team_members`
* `tree_search` {keyword}
* `node_select` {team_id}
* `batch_move_click` {count}
* `member_detail_view` {user_id}

## 18. 验收标准（Checklist）

* [ ] 团队树加载与懒加载正常，搜索与展开收起可用。
* [ ] 成员列表筛选/排序正确，与树节点联动。
* [ ] 批量导入/邀请/转移/冻结/离职等操作链路可用，权限控制严格。
* [ ] 环路与并发冲突能被及时阻断与提示。
* [ ] 导出任务生成并在导出中心可见。
* [ ] e2e 覆盖：选择节点 → 查看成员 → 批量转移 → 导出。

## 19. 交付物清单

* 设计稿：`team-members.fig`。
* OpenAPI 片段：`openapi/teams.tree.yaml`、`teams.detail.yaml`、`teams.create.yaml`、`teams.update.yaml`、`teams.move.yaml`、`teams.archive.yaml`、`teams.members.yaml`、`members.import.yaml`、`invites.create.yaml`、`members.batch_move.yaml`、`teams.export.yaml`、`members.export.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/team-members.spec.ts`。
* 验收 checklist：`acceptance/team-members-checklist.md`。

## 20. 签收（产品/运营/QA/日期）

* Product：____  运营：____  QA：____  日期：____
