# 后台 Demo —— 页面规格（P2-16 KYC 审核 Console / KYC Review Console）

## 1. 页面名称（中/英）

KYC 审核 Console / KYC Review Console

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：风控与合规管理 → KYC 审核
* 权限：`kyc_reviewer`（审核/复核）、`risk`（查看与联动）、`admin`（全部配置与回滚）、`operator`（无访问）

## 3. 目标与业务价值（1 句话）

对实名/证件材料进行标准化审核与回调联动，确保身份合规、降低欺诈与误审风险。

## 4. 主要用户场景（2–3 个）

* 审核员查看待审 KYC 案件，核对证件照与 OCR 结果，判定通过/拒绝/补充材料。
* 复核员二审高风险或抽检案件，确保一致性与合规。
* 系统对接第三方 KYC 服务（自动结果回传），与订单/风控命中联动。

## 5. 设计稿链接与断点

* 参考：高保真 V4（风控与合规管理 · KYC）。
* 断点：≥1440 三栏（筛选/案件列表/右侧详情），≤1024 双栏或分步。

## 6. 页面组件结构（信息架构）

* **筛选区**：时间范围、状态（待审/待补/已通过/已拒绝/回调异常）、风险等级、渠道、证件类型、来源（自动/人工）。
* **案件列表**：表格（支持分页、排序、多选）。
* **右侧详情抽屉**：左侧证件与活体/自拍大图、中部 OCR 字段与差异高亮、右侧操作面板（通过/拒绝/补充、备注）。
* **统计卡**：待审总数、今日处理、通过率、回调失败数。
* **操作区**：批量指派、批量通过/拒绝（受限）、导出。

## 7. 字段清单（字段名/类型/必填/校验/示例/控件）

* **案件 KycCase**：

  * `case_id`(string, 只读)、`created_at`(datetime)、`status`(pending|need_more|approved|rejected|callback_error)、`risk_level`(low|medium|high|critical)、`channel`、`source`(auto|manual)、`id_type`(cn_id|hkid|passport|other)、`order_id?`、`user_id?`、`assignee_id?`、`double_review`(bool)。
* **材料 Materials**：

  * `id_front_url`、`id_back_url?`、`selfie_url?`、`extra_images[]?`，`liveness_score?`、`psl_similarity?`（证照相似度）。
* **OCR 结果 Ocr**：

  * `name`、`id_number`、`birth_date`、`gender`、`address`、`issued_by?`、`valid_from`、`valid_to`、`confidence`。
* **表单/校验**：

  * `diffs[]`：{`key`, `ocr_value`, `form_value`, `confidence`, `mismatch`(bool)}。
  * `note`(string, 审核备注，拒绝/补充时必填≥5字)。

## 8. 操作/按钮（权限/确认/提示）

* **指派/改派**：`POST /api/v1/kyc/cases/{id}/assign` body: {assignee_id}。
* **通过**：`POST /api/v1/kyc/cases/{id}/approve`（可同时回写订单状态）。
* **拒绝**：`POST /api/v1/kyc/cases/{id}/reject`（需备注与拒绝原因码）。
* **补充材料**：`POST /api/v1/kyc/cases/{id}/request_more` body: {required_fields[], note}。
* **批量**：`POST /api/v1/kyc/cases/batch_assign|batch_approve|batch_reject`（批量通过/拒绝仅对低风险并开启“批量策略”时可用）。
* **导出**：`POST /api/v1/exports/kyc-cases`。
* **刷新回调**：`POST /api/v1/kyc/cases/{id}/sync_callback`（拉取三方最新结果）。

## 9. API 合约（方法/URL/参数/响应示例/错误码）

* **列表**：`GET /api/v1/kyc/cases?status=pending&risk_level=high&page=1&page_size=20`

```json
{
  "total": 260,
  "page": 1,
  "page_size": 20,
  "items": [
    {"case_id":"KYC20251003001","created_at":"2025-10-03T09:30:00+08:00","status":"pending","risk_level":"high","channel":"wechat","source":"auto","id_type":"cn_id","order_id":"O20251002001","assignee_id":null}
  ]
}
```

* **详情**：`GET /api/v1/kyc/cases/{id}` → KycCase + Materials + Ocr + diffs + actions。
* **审批动作**：`POST /api/v1/kyc/cases/{id}/approve|reject|request_more|assign` → `{ok:true,new_status}`。
* **批量动作**：`POST /api/v1/kyc/cases/batch_*` → `{ok:true,count}`。
* **导出**：`POST /api/v1/exports/kyc-cases` → `{export_id}`；`GET /api/v1/exports/{export_id}`。
* **第三方回调入口**（供 Provider 调用）：`POST /api/v1/kyc/callbacks/{provider}`（签名校验、重放保护、幂等）。
* **错误码**：`400` 参数错误；`403` 权限不足；`409` 状态冲突；`422` 必填缺失/拒绝原因非法；`500` 服务异常。

## 10. Mock 数据（≥3 条代表性）

* `mocks/kyc-cases/list.page1.json`（见上例）
* `mocks/kyc-cases/detail.json`

```json
{
  "case_id":"KYC20251003001",
  "created_at":"2025-10-03T09:30:00+08:00",
  "status":"pending",
  "risk_level":"high",
  "channel":"wechat",
  "source":"auto",
  "id_type":"cn_id",
  "order_id":"O20251002001",
  "materials": {"id_front_url":"/mock/id_front.jpg","selfie_url":"/mock/selfie.jpg","liveness_score":0.92,"psl_similarity":0.88},
  "ocr": {"name":"张三","id_number":"4401********1234","birth_date":"1995-06-18","gender":"M","valid_from":"2021-01-01","valid_to":"2031-01-01","confidence":0.94},
  "diffs": [{"key":"name","ocr_value":"张三","form_value":"张三","confidence":0.94,"mismatch":false},{"key":"id_number","ocr_value":"4401********1234","form_value":"4401********1234","confidence":0.92,"mismatch":false}]
}
```

* `mocks/kyc-cases/approve.success.json`

```json
{"ok":true,"new_status":"approved"}
```

## 11. 状态机与流程

* `pending → approved|rejected|need_more`；`need_more → pending`（收到补充后自动回到待审）。
* 第三方回调：`auto_pending → auto_approved/auto_rejected/auto_need_more`；人工可覆核并改判（记录二审）。
* 双人复核：`pending(first) → pending(second) → approved/rejected`。

## 12. 边界条件与异常场景

* 回调签名校验失败：写入 `callback_error`，需支持重放并记录请求体哈希。
* 材料缺失或图像损坏：禁止通过；提示重新上传。
* OCR 低置信度字段：高亮并要求人工确认。
* 重复证件号码在短期内多次提交：标记为高风险并联动风控命中。
* 并发处理：他人已处理则返回 409，前端刷新提示。

## 13. 交互细节

* 证件/自拍大图支持放大/旋转/比对对齐（并排查看）。
* 差异高亮：与订单/表单信息对比，支持一键“以 OCR 为准/以表单为准”。
* 审批动作需二次确认与强制备注（拒绝/补充）。
* 支持键盘快捷键：A=通过，R=拒绝，M=补充，J/K=上一条/下一条。

## 14. 可用性/无障碍要点

* 图片区域支持键盘操作与可见焦点；提供替代文本。
* 颜色与图标双重传达状态；提供屏幕阅读器友好标签。
* 弹窗与抽屉可被 Esc 关闭；焦点返回前一控件。

## 15. 性能与分页要求

* 列表 < 600ms；详情 < 500ms；图片懒加载与压缩。
* 大图使用 CDN/分辨率自适应；首屏加载骨架占位。
* 批量操作限 200 条；导出走异步任务。

## 16. 日志/审计点

* `kyc_assign|approve|reject|request_more|sync_callback|double_review_decision`（记录操作者、原始与新状态、备注）。
* 回调：记录 `callback_received|callback_verified|callback_failed`，含签名与 provider。
* 图片访问审计：`view_kyc_image`（含 case_id、image_key）。

## 17. 监控/埋点事件

* `page_view:kyc_console`
* `filter_change:kyc_console` {field, from, to}
* `kyc_action` {case_id, action}
* `callback_error` {provider}

## 18. 验收标准（Checklist）

* [ ] 待审/已审/需补/回调异常筛选准确。
* [ ] 详情抽屉展示 OCR/材料/差异与风险要点完整。
* [ ] 审批三动作与批量动作可用，状态与审计写入正确。
* [ ] 第三方回调签名校验与幂等生效；失败可重放。
* [ ] 双人复核流程生效，二审可改判并记录。
* [ ] e2e 覆盖：加载 → 查看详情 → 通过/拒绝/补充 → 回调重放。

## 19. 交付物清单

* 设计稿：`kyc-console.fig`。
* OpenAPI 片段：`openapi/kyc.cases.list.yaml`、`kyc.cases.detail.yaml`、`kyc.cases.assign.yaml`、`kyc.cases.approve.yaml`、`kyc.cases.reject.yaml`、`kyc.cases.request_more.yaml`、`kyc.cases.batch.yaml`、`kyc.cases.export.yaml`、`kyc.callbacks.provider.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/kyc-console.spec.ts`。
* 验收 checklist：`acceptance/kyc-console-checklist.md`。

## 20. 签收（产品/风控负责人/合规/QA/日期）

* Product：____  风控负责人：____  合规：____  QA：____  日期：____
