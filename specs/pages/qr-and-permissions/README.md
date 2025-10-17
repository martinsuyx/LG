# 团队 / 门店二维码与权限 / QR Codes & Permissions

> 本规格定义了团队、门店、推广网络的二维码生成与扫码入网逻辑，覆盖成员加入、门店绑定、推广权限发放、佣金继承与安全审计机制。

---

## 1. 页面名称（中/英）

团队 / 门店二维码与权限 / QR Codes & Permissions

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：组织与用户管理 → 团队与人员
* 角色：`admin`（全部）、`org_admin`（公司级）、`team_lead`（团队领队）、`store_owner`（店主）

## 3. 目标与业务价值（1 句话）

通过二维码实现团队、门店、推广网络的快速入网、成员招募与权限发放，支持分层自治与可追溯审计，降低人工维护成本。

## 4. 主要用户场景

* 领队创建团队并生成“入队二维码”；
* 队员扫码加入团队；
* 领队创建下级团队并指定新领队；
* 店主生成“加入门店二维码”；
* 领队/队员生成“加入推广活动二维码”，门店或队员扫码获得推广权限；
* 店主设置店员佣金；
* 系统记录每次扫码事件与关系变更审计。

## 5. 设计稿链接与断点

* 高保真：V5 组织与用户管理 / 团队二维码与权限页
* 断点：≥1280 双栏（左团队结构 / 右二维码与权限配置）；≤1024 抽屉分步

## 6. 页面组件结构

* 顶部工具条：团队名、领队、成员数、二维码有效期 ▼、扫码次数限制 ▼、刷新按钮
* 左列：团队/门店树（可展开子团队与门店）
* 右列卡片区：

  * 入队二维码（Join-Team）
  * 加店二维码（Join-Store）
  * 推广网络二维码（Join-Campaign）
  * 佣金继承与覆盖配置摘要
  * 操作日志与二维码失效记录
* 弹窗：

  * 新建子团队（名称、指定领队、复制父团队佣金）
  * 更换领队（选择成员）
  * 生成二维码参数配置（有效期、次数上限、适用活动、套餐）

## 7. 字段清单（核心）

| 字段              | 类型       | 必填 | 说明                                              |
| --------------- | -------- | -- | ----------------------------------------------- |
| qr_id           | string   | ✓  | 二维码唯一ID                                         |
| type            | enum     | ✓  | join_team / join_store / join_campaign          |
| issuer_id       | string   | ✓  | 发起人（领队/店主/系统）                                   |
| scope           | object   | ✓  | 作用范围：team_id / store_id / campaign_id / plan_id |
| ttl             | integer  | ✓  | 有效期（秒）                                          |
| max_scans       | integer  | ✓  | 最大扫码次数                                          |
| used_count      | integer  | -  | 已扫码次数                                           |
| sig             | string   | ✓  | 签名（防篡改）                                         |
| status          | enum     | ✓  | active / expired / revoked                      |
| created_at      | datetime | ✓  | 生成时间                                            |
| last_scanned_at | datetime | -  | 最近一次扫码                                          |
| audit_log_id    | string   | -  | 审计记录ID                                          |

## 8. 操作/按钮

* 【生成入队码】→ POST `/teams/{id}/qr` → 返回二维码URL（带签名）
* 【生成加店码】→ POST `/stores/{id}/qr`
* 【生成推广码】→ POST `/campaigns/{id}/join_qr`（可选活动/套餐）
* 【更换领队】→ POST `/teams/{id}/leader_change`
* 【新建子团队】→ POST `/teams/{id}/sub_team`
* 【二维码失效】→ POST `/qr/{qr_id}/revoke`
* 【查看审计日志】→ GET `/audit/qr_logs?team_id=&store_id=`

## 9. API 合约（Mock 阶段）

* 二维码生成：

  * `POST /api/v1/teams/{id}/qr`、`/stores/{id}/qr`、`/campaigns/{id}/join_qr`
* 扫码入网：

  * `POST /api/v1/qr/scan`（参数：`qr_id`、扫码人token、位置等）→ 返回 `{ok:true, action:'join_team', target_id:'T001'}`
* 领队变更：

  * `POST /api/v1/teams/{id}/leader_change`
* 子团队创建：

  * `POST /api/v1/teams/{id}/sub_team`
* 店员加入门店：

  * `POST /api/v1/stores/{id}/staff_join`
* 审计日志：

  * `GET /api/v1/audit/qr_logs?team_id=&store_id=&campaign_id=`

**扫码入网返回示例**

```json
{
  "ok": true,
  "action": "join_team",
  "target_id": "T001",
  "team_name": "广州一区",
  "leader_id": "U1001",
  "role_assigned": "promoter",
  "message": "入队成功，已加入广州一区团队"
}
```

## 10. Mock 数据

* `mocks/qr/team.join.json`
* `mocks/qr/store.join.json`
* `mocks/qr/campaign.join.json`
* `mocks/qr/scan.result.json`
* `mocks/teams/leader_change.success.json`
* `mocks/teams/sub_team.success.json`
* `mocks/audit/qr_logs.page1.json`

## 11. 状态机与流程

* 二维码：`active → expired|revoked`
* 扫码：`pending_validation → validated → success|blocked`
* 领队变更：`leader_old → leader_new`（触发团队树更新）
* 团队：`active ↔ archived`
* 审计：每次扫码、生成、失效、领队更换均生成记录

## 12. 权限与限制

* 领队仅可创建本团队及下属团队二维码；
* 店主仅可创建本门店二维码；
* 同人同类型二维码 24h 仅限生成 3 次（防刷）；
* 二维码有效期默认 7 天（可调整 1–30 天）；
* 同手机号重复扫码：第二次提示“已在团队中”；
* 领队变更或团队冻结后，旧二维码自动失效。

## 13. 交互细节

* 右列卡片显示：二维码预览 + 文案说明 + [复制链接] [下载] [刷新]
* 扫码结果页（小程序端）展示：入队成功 / 门店加入成功 / 获取推广权限成功；
* 失效二维码展示“二维码已过期，请联系领队重新生成”；
* 生成成功后 toast + 自动更新右列记录。

## 14. 可用性/无障碍要点

* 键盘可达：生成/复制/刷新按钮；
* QR 预览支持屏幕阅读描述（aria-label=type+scope）；
* 二维码图片含 alt 文本；
* 小程序扫码结果有语音提示（可选）。

## 15. 性能与安全

* 二维码生成接口 < 300ms；扫码校验 < 500ms；
* 所有二维码带签名（sig），签名验证失败拒绝；
* 服务器记录 IP、设备、位置，用于风控；
* 同用户 1 分钟内最多扫码 3 次；
* 所有敏感操作写审计日志。

## 16. 日志/审计点

* `qr_create|qr_scan|qr_revoke|qr_expire|leader_change|sub_team_create`
* 记录 issuer_id、team_id/store_id/campaign_id、扫码人、时间、位置、设备、结果。

## 17. 埋点事件

* `qr_generate_click` {type, scope}
* `qr_scan_success` {type, issuer_id, target_id}
* `qr_scan_fail` {reason}
* `leader_change_submit` {team_id, old_leader, new_leader}
* `sub_team_create` {parent_team, leader_id}

## 18. 验收标准（Checklist）

* [ ] 三类二维码生成与扫码入网链路可用；
* [ ] 入队 / 加店 / 加入活动网络后关系树实时更新；
* [ ] 领队更换、二维码失效逻辑生效；
* [ ] 审计日志完整；
* [ ] 安全与防刷策略符合预期；
* [ ] 视觉与交互符合设计稿，键盘可操作。

## 19. 交付物清单

* 设计稿：V5 团队二维码与权限页
* OpenAPI：`qr.create.yaml`、`qr.scan.yaml`、`teams.leader_change.yaml`、`teams.sub_team.yaml`、`audit.qr_logs.yaml`
* Mock：`mocks/qr/*`、`mocks/teams/*`、`mocks/audit/*`
* e2e：`tests/e2e/qr-and-permissions.spec.ts`

## 20. 签收

* Product：____  运营：____  QA：____  日期：____

* Product：____  运营：____  QA：____  日期：____
