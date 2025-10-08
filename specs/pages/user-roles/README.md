# 后台 Demo —— 页面规格（P1-12 用户与角色 / Users & Roles / RBAC）

## 1. 页面名称（中/英）

用户与角色 / Users & Roles / RBAC

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：组织与用户管理 → 用户与角色
* 权限：`admin`（全部：创建/编辑用户与角色、分配权限）、`org_admin`（管理本公司用户与角色）、`team_lead`（仅查看团队成员与角色）、`operator`（仅查看自己权限）

## 3. 目标与业务价值（1 句话）

集中管理用户账户与角色权限，提供基于 RBAC 的权限分配与审计，保障系统安全与合规。

## 4. 主要用户场景（2–3 个）

* 系统管理员新建用户、分配角色与登录凭证。
* 组织管理员按部门/团队分配角色与权限范围。
* 审计人员查询用户操作日志，定位越权行为。

## 5. 设计稿链接与断点

* 参考：高保真 V5（组织与用户管理）。
* 断点：≥1440 左侧用户列表/角色列表 + 右侧详情/权限树；≤1024 单栏切换。

## 6. 页面组件结构（信息架构）

* **用户管理区**：用户列表、筛选（姓名、手机号、邮箱、角色、状态）、操作按钮（新建/冻结/重置密码/导出）。
* **用户详情抽屉**：基本信息、所属团队、角色列表、最近登录时间、状态、操作日志入口。
* **角色管理区**：角色列表、搜索框、操作按钮（新建/编辑/删除/导出）。
* **角色详情抽屉**：角色基本信息、权限树（菜单/接口）、绑定用户数、最近修改人/时间。
* **权限树控件**：层级展示模块-菜单-接口，支持全选/半选状态。

## 7. 字段清单

* **用户 User**：

  * `user_id`(string, 只读)、`name`(string)、`phone`(string)、`email`(string)、`role_ids[]`(string[])、`status`(enum: active|frozen|deleted)、`last_login_at`(datetime)、`teams[]`(string[])。
* **角色 Role**：

  * `role_id`(string, 只读)、`name`(string, 必填, 唯一)、`desc`(string, ≤200)、`permissions[]`(string[])、`status`(active|archived)、`created_at`、`updated_at`、`bound_users`(int)。
* **权限 Permission**：

  * `perm_id`(string)、`name`(string)、`type`(menu|api)、`path`(string)、`parent_id`(string|null)。

## 8. 操作/按钮

* **新建用户**：`POST /api/v1/users` → 输入基本信息、角色、初始密码。
* **编辑用户**：`PUT /api/v1/users/{id}`。
* **冻结/删除用户**：`POST /api/v1/users/{id}/freeze|delete`。
* **重置密码**：`POST /api/v1/users/{id}/reset_password` → 返回临时密码。
* **新建角色**：`POST /api/v1/roles`。
* **编辑角色**：`PUT /api/v1/roles/{id}`。
* **删除角色**：`DELETE /api/v1/roles/{id}`（需二次确认，若仍绑定用户则阻止）。
* **导出**：`POST /api/v1/exports/users|roles`。
* **权限树操作**：全选/半选/反选，保存至 `permissions[]`。

## 9. API 合约

* **用户列表**：`GET /api/v1/users?page=1&page_size=20&status=active&role_id=R01`

```json
{"total":230,"page":1,"page_size":20,"items":[{"user_id":"U1001","name":"张三","phone":"13800000000","email":"zhangsan@test.com","role_ids":["R01"],"status":"active","last_login_at":"2025-09-28T12:00:00+08:00","teams":["广州一区"]}]}
```

* **用户详情**：`GET /api/v1/users/{id}`。
* **新建/编辑用户**：`POST|PUT /api/v1/users{/{id}}`。
* **角色列表**：`GET /api/v1/roles?page=1&page_size=20`

```json
{"total":12,"items":[{"role_id":"R01","name":"审核员","desc":"可访问审核模块","permissions":["menu:orders","api:/orders/review"],"status":"active","bound_users":25}]}
```

* **角色详情**：`GET /api/v1/roles/{id}` → 返回角色基本信息与权限树。
* **权限树**：`GET /api/v1/permissions/tree` → 返回全部权限分层数据。
* **导出**：`POST /api/v1/exports/users|roles` → `{export_id}`。
* **错误码**：400 参数错误；403 权限不足；409 重名/冲突；422 仍绑定用户时删除角色失败。

## 10. Mock 数据

* `mocks/users/list.page1.json`（见上例）
* `mocks/users/detail.json`

```json
{"user_id":"U1001","name":"张三","phone":"13800000000","email":"zhangsan@test.com","role_ids":["R01","R02"],"status":"active","last_login_at":"2025-09-28T12:00:00+08:00","teams":["广州一区"]}
```

* `mocks/roles/detail.json`

```json
{"role_id":"R01","name":"审核员","desc":"可访问审核模块","permissions":["menu:orders","api:/orders/review"],"status":"active","created_at":"2025-01-01T09:00:00","updated_at":"2025-09-01T09:00:00","bound_users":25}
```

## 11. 状态机与流程

* 用户：`active ↔ frozen → deleted`。
* 角色：`active → archived`；删除需满足无绑定用户。
* 权限树：编辑后需保存并刷新缓存。

## 12. 边界条件与异常场景

* 创建用户时手机号/邮箱重复：返回 409。
* 删除角色时仍绑定用户：返回 422 并提示先解绑。
* 冻结用户：禁止登录，相关操作受限。
* 导出超量用户 >10w：自动走异步导出任务。
* 权限冲突：同用户多角色时合并去重。

## 13. 交互细节

* 用户列表支持搜索、按状态/角色/最近登录排序。
* 详情抽屉可直接修改用户角色并保存。
* 权限树可折叠展开，支持批量勾选。
* 删除角色需二次确认并输入角色名。
* 新建用户成功后可一键复制临时密码。

## 14. 可用性/无障碍要点

* 用户/角色列表可键盘操作，Enter 打开详情。
* 权限树节点半选态对屏幕阅读器友好（aria-checked="mixed"）。
* 高风险操作有明显提示与不可逆性说明。

## 15. 性能与分页要求

* 列表接口响应 < 500ms；角色树加载 < 800ms。
* 用户分页默认 20，最大 200。
* 导出走异步任务，轮询 2s。
* 权限树缓存 10 分钟。

## 16. 日志/审计点

* `user_create|update|freeze|delete|reset_password`。
* `role_create|update|delete|grant_permission`。
* `login_success|login_fail`（含用户 ID、IP、设备信息）。

## 17. 监控/埋点事件

* `page_view:users`
* `page_view:roles`
* `user_create_click` {user_id}
* `role_create_click` {role_id}
* `permission_change` {role_id, perm_count}

## 18. 验收标准（Checklist）

* [ ] 用户新建/编辑/冻结/删除/重置密码流程完整。
* [ ] 角色新建/编辑/删除正确，权限树保存生效。
* [ ] 权限冲突时合并去重逻辑正确。
* [ ] 列表/详情/搜索与导出符合预期。
* [ ] 权限裁剪正确：operator 仅能看自己权限。
* [ ] e2e 覆盖：创建用户 → 分配角色 → 冻结 → 删除 → 导出。

## 19. 交付物清单

* 设计稿：`users-roles.fig`。
* OpenAPI 片段：`openapi/users.list.yaml`、`users.detail.yaml`、`users.create.yaml`、`users.update.yaml`、`users.freeze.yaml`、`users.delete.yaml`、`users.reset_password.yaml`、`roles.list.yaml`、`roles.detail.yaml`、`roles.create.yaml`、`roles.update.yaml`、`roles.delete.yaml`、`permissions.tree.yaml`、`users.export.yaml`、`roles.export.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/users-roles.spec.ts`。
* 验收 checklist：`acceptance/users-roles-checklist.md`。

## 20. 签收（产品/运营/QA/日期）

* Product：____  运营：____  QA：____  日期：____
