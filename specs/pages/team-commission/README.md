# 团队佣金配置 / Team Commission Configuration

> 本规格定义“团队级佣金配置”页面：支持**领队在权限范围内**对本团队成员进行批量/按人配置各活动产品（套餐）的佣金；同时支持 Excel 批量导入/导出、上限规则校验、差异高亮与完成度统计。

---

## 1. 页面名称（中/英）

团队佣金配置 / Team Commission

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：组织与用户管理 → 团队与人员 → 进入某团队详情/工具页
* 角色：

  * `admin`：查看/编辑所有团队、审批越权请求、配置上限规则
  * `org_admin`：查看/编辑本组织团队、审批本组织内请求
  * `team_lead`：仅可编辑“本人团队”及其下属成员的佣金，且**不得超过上限**
  * `operator`：只读

## 3. 目标与业务价值（1 句话）

以“批量+模板+继承”的方式，高效、安全地完成成千上人的佣金配置，同时保持越权防护与审计可追溯。

## 4. 主要用户场景

* 领队为某活动的多个**套餐**一次性设置全团队成员佣金；
* 使用 **Excel 模板** 批量导入更新上千名成员的佣金；
* 复制上期/其他地区规则为本团队快速初始化；
* 查看“配置完成度”和“差异高亮”，补齐未配置成员；
* 越权时触发**审批流**或立刻阻断。

## 5. 设计稿链接与断点

* 高保真：V5 组织与用户管理 / 团队佣金工具页
* 断点：≥1440 三区域（左团队树 / 中套餐与规则区 / 右成员表）；≤1024 抽屉堆叠

## 6. 页面组件结构（信息架构）

* **顶部筛选条**：活动（campaign）▼、套餐（plan）▼、搜索成员（姓名/ID/手机号）
* **套餐区**：当前套餐卡片（默认佣金、上限、是否允许覆盖、分成规则摘要）
* **工具条**：

  * 【批量设置】（对列表勾选成员统一设置佣金）
  * 【导入Excel】（模板下载 / 上传 / 预校验 / 提交任务）
  * 【导出当前配置】（供复核）
  * 【复制规则】（复制自：上期活动/其他团队/模板库）
* **成员表（分页）**：成员 | 职位 | 当前佣金 | 默认佣金 | 上限 | 覆盖来源 | 操作（设置/清除）
* **佣金编辑抽屉**：复用 CommissionField（fixed/percent/tier），展示“默认/上级/当前有效”
* **导入任务抽屉**：上传→预检报告→提交→任务进度（成功/失败行导出）
* **完成度与差异高亮**：表头右上角显示完成度 %；差异行以橙色标识

## 7. 字段清单（核心）

| 字段                   | 类型     | 必填 | 说明                                          |
| -------------------- | ------ | -- | ------------------------------------------- |
| campaign_id          | string | ✓  | 选择的活动ID                                     |
| plan_id              | string | ✓  | 选择的套餐ID                                     |
| rule_caps            | object | ✓  | 上限规则（max/min、是否允许覆盖等）                       |
| member_id            | string | ✓  | 成员ID                                        |
| commission_default   | object | ✓  | 默认佣金（fixed/percent/tier）                    |
| commission_effective | object | ✓  | 当前有效佣金（计算后）                                 |
| commission_override  | object | -  | 成员级/团队级覆盖（若存在）                              |
| override_source      | enum   | -  | 来源：promoter/store/team/city/company/default |

## 8. 操作/按钮

* 成员行【设置】→ 打开抽屉 → 编辑覆盖佣金 → 保存
* 成员行【清除】→ 删除覆盖 → 恢复默认/上级
* 勾选多行【批量设置】→ 统一应用一个佣金值（或按 Excel 导入）
* 【导入Excel】→ 下载模板 → 上传文件（本团队范围）→ 预检 → 提交任务 → 查看进度与结果
* 【导出当前配置】→ 下载当前团队的佣金配置明细
* 【复制规则】→ 选择来源（历史活动/其他团队/模板库）→ 一键应用 → 差异预览 → 保存

## 9. API 合约（Mock 阶段）

* 获取团队成员列表（含默认/有效/上限）：

  * `GET /api/v1/teams/{team_id}/commissions?campaign_id=&plan_id=&page=&page_size=&q=`
* 编辑成员佣金覆盖：

  * `POST /api/v1/commission/override`（entity_type=promoter, entity_id=Uxx）
  * `DELETE /api/v1/commission/override?campaign_id=&plan_id=&entity_type=promoter&entity_id=`
* 批量设置：

  * `POST /api/v1/commission/batch_override`

    ```json
    {"campaign_id":"C1","plan_id":"P1","entity_type":"promoter","items":[{"entity_id":"U1","commission":{"type":"percent","value":10}},{"entity_id":"U2","commission":{"type":"percent","value":9}}]}
    ```
* Excel 导入：

  * `POST /api/v1/commission/import`（multipart）→ `{task_id}`
  * `GET /api/v1/commission/import/{task_id}` → 任务状态 & 预检/失败文件下载链接
* 复制规则：

  * `POST /api/v1/commission/copy_from` → 从指定来源复制

> 说明：`commission.override.yaml` 与 `members.commissions.yaml` 的 Commission schema 复用，Mock 阶段返回固定结构即可。

## 10. Mock 数据

* `mocks/teams/{team_id}/commissions.page1.json`
* `mocks/commission/batch_override.success.json`
* `mocks/commission/import.accepted.json`
* `mocks/commission/import.result.json`（成功/失败行统计 + 失败CSV下载）

## 11. 状态机与流程

* 覆盖：`none → overridden → cleared`
* 导入任务：`uploaded → validating → accepted → processing → succeeded|failed`
* 复制规则：`select_source → preview_delta → applied`

## 12. 边界条件与异常场景

* **越权**：当设置值 > 上限或 < 下限 → 阻断并提示；开启审批时转入 `pending_approval`。
* **冲突**：同一成员多次导入冲突 → 以“最后一次提交成功”为准，并在报告中标红。
* **范围**：非本团队成员数据不得导入（系统校验并拒绝）。
* **规模**：单次导入上限 5 万行；超限需分批或走异步大任务。

## 13. 交互细节

* 完成度 =（已设置覆盖或继承默认的成员数 ÷ 总成员数）；
* 差异高亮：与默认/上级不同的列标橙；
* Excel 模板字段有示例与合法值说明（commission_type、percent 范围等）；
* 批量设置支持“套用默认/清空覆盖”。

## 14. 可用性/无障碍要点

* 表格可键盘导航；批量勾选支持 Shift；
* 抽屉字段具 aria-label 与即时错误提示；
* 导入流程对色盲用户提供图标+文字双重反馈。

## 15. 性能与分页要求

* 成员表分页默认 50/页，最大 200；
* 导入预检在 60s 内返回初步结果；
* 列表接口 < 600ms；批量覆盖单次最多 2000 人。

## 16. 日志/审计点

* `commission_override_team_create|update|delete`（操作者、团队ID、变更前后摘要）
* `commission_batch_override`（总行数、成功/失败数、导入任务ID）
* `commission_copy_from`（来源、差异量）

## 17. 埋点事件

* `team_commission_view` {team_id, campaign_id, plan_id}
* `team_commission_bulk_open` {count}
* `team_commission_import_submit` {task_id}
* `team_commission_apply_rule` {template_id|source}

## 18. 验收标准（Checklist）

* [ ] 选择活动/套餐后，成员列表加载正确；
* [ ] 单人编辑/清除覆盖可用且校验上限；
* [ ] 批量设置对勾选成员生效，日志落表；
* [ ] 导入：模板下载→上传→预检→提交→进度→结果回执完整；
* [ ] 复制规则：预览差异并一键应用；
* [ ] 完成度与差异高亮计算正确；
* [ ] 无障碍与性能符合要求。

## 19. 交付物清单

* 设计稿：V5 团队佣金工具页
* OpenAPI：`teams.commissions.list.yaml`, `commission.batch_override.yaml`, `commission.import.yaml`, `commission.copy_from.yaml`
* Mock：`mocks/teams/*`, `mocks/commission/*`
* e2e：`tests/e2e/team-commission.spec.ts`

## 20. 签收

* Product：____  运营：____  QA：____  日期：____
