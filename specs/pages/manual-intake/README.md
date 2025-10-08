# 后台 Demo —— 页面规格（P0-4 手动录单 / Manual Intake）

## 1. 页面名称（中/英）

手动录单 / Manual Intake

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：订单与审核管理 → 手动录单
* 权限：`operator`（录入与提交）、`admin`（全部）；`reviewer`/`finance` 仅查看（默认无编辑权限）

## 3. 目标与业务价值（1 句话）

在 AI 不可用或解析失败时，以标准化表单快速、准确地录入订单，保证业务连续性。

## 4. 主要用户场景（2–3 个）

* 地推或运营人员直接输入用户信息/订单信息，提交生成订单。
* 承接 AI 录单失败的回退路径，改为人工录入。
* 线下批量单据中抽检少量手工录入验证数据质量。

## 5. 设计稿链接与断点

* 参考：高保真 V3（录单页 · 手动表单态）。
* 断点：≥1280 双栏布局（左基础信息，右附加信息与校验提示）；≤1024 单栏堆叠。

## 6. 页面组件结构（信息架构）

* **提示条**：展示录入规范与数据使用合规提示。
* **基础信息表单**（必填）：手机号、姓名、证件号、门店、活动、金额。
* **附加信息表单**（选填）：渠道、推荐人、备注、上传补充材料。
* **校验区**：实时校验与格式提示。
* **提交区**：提交按钮、重置、保存为草稿（可选）。

## 7. 字段清单（字段名/类型/必填/校验/示例/控件）

* `phone` (string, 必填)：^1\d{10}$；示例 13800000000；输入框+手机图标。
* `name` (string, 必填)：2–20 字；中文/英文；示例 张三。
* `id_number` (string, 必填)：大陆二代证/港澳台/护照格式；示例 4401********1234；下拉选择证件类型 + 输入框。
* `store_id` (string, 必填)：从门店下拉选择（可搜索）；无权限不可见所有门店。
* `campaign_id` (string, 必填)：活动选择（仅显示有效期内且对该门店开放的活动）。
* `amount` (decimal, 必填)：≥0；两位小数；示例 59.00。
* `channel` (enum, 选填)：`wechat|h5|scan|api|offline`；默认 `offline`。
* `promoter_id` (string, 选填)：选择推广人；自动带出团队/上级（只读）。
* `note` (string, 选填)：≤200 字。
* `attachments[]` (file, 选填)：≤3 张，单张 ≤5MB；jpg/png/pdf。
* **系统生成**（只读）：`order_id`、`created_at`。

## 8. 操作/按钮（权限/确认/提示）

* **提交**：`POST /api/v1/orders`，成功返回 `order_id` 并跳转订单详情。
* **保存草稿（可选）**：`POST /api/v1/orders/draft`，保留 24h；再次进入可继续编辑。
* **重置**：清空本页表单；需二次确认。
* **导入（可选）**：入口指向批量导入页。
* **AI 录单**：顶部切换按钮可跳转到 AI 录单。

## 9. API 合约（方法/URL/参数/响应示例/错误码）

* **创建订单**：`POST /api/v1/orders`

  * body：

```json
{
  "phone": "13800000000",
  "name": "张三",
  "id_type": "cn_id",
  "id_number": "4401********1234",
  "store_id": "S001",
  "campaign_id": "C001",
  "amount": 59.00,
  "channel": "offline",
  "promoter_id": "P1001",
  "note": "活动A线下录入",
  "attachments": [
    {"key": "orders/2025/10/03/uuid1.jpg"}
  ]
}
```

* response：`{"order_id":"O20251003001","status":"pending"}`
* 错误码：`400` 参数/校验错误；`403` 权限不足；`409` 幂等/重复；`422` 活动不在有效期；`500` 服务器异常。
* **保存草稿**：`POST /api/v1/orders/draft` → `{draft_id}`；`PUT /api/v1/orders/draft/{id}` 更新；`GET /api/v1/orders/draft/{id}` 读取。
* **上传策略**：`GET /api/v1/uploads/policy?biz=order_attachment&count=3` → 返回 STS/直传表单。

## 10. Mock 数据（≥3 条代表性）

* `mocks/manual-intake/create.success.json`

```json
{"order_id":"O20251003001","status":"pending"}
```

* `mocks/manual-intake/create.validation_error.json`

```json
{"error":"invalid_phone","field":"phone","message":"手机号格式不正确"}
```

* `mocks/manual-intake/draft.create.json`

```json
{"draft_id":"D20251003001"}
```

## 11. 状态机与流程

* **创建流程**：`editing → validating → submitting → pending`；失败回到 `editing`。
* **草稿**：`draft → editing → submitting`；草稿 24h 自动清理。

## 12. 边界条件与异常场景

* 活动失效/未对本门店开放：提交阻断，提示具体原因。
* 金额与活动档位不匹配：提示并引导选择正确套餐。
* 附件上传失败：允许重试/移除；提交前需全部成功或移除失败项。
* 权限不足：隐藏门店/活动；提交返回 403。
* 幂等：同一 `phone+campaign+date` 可选启用幂等键避免重复录入。

## 13. 交互细节

* 表单实时校验（onBlur/onChange）；错误提示贴近字段。
* 门店/活动下拉支持搜索与近期常用缓存。
* 金额输入支持「选择套餐」快捷填充；不匹配则醒目提示。
* 提交前需勾选「我已阅读并遵守数据合规提示」。

## 14. 可用性/无障碍要点

* 表单 Tab 顺序自然；Enter 提交；错误区域 ARIA 关联。
* 小屏下行动按钮吸底固定。
* 颜色对比度≥4.5:1。

## 15. 性能与分页要求

* 表单初始化 < 200ms；下拉远程检索每次返回 ≤ 50 项。
* 上传并行数≤3；策略缓存 5 分钟。
* 接口超时 5s，失败重试 1 次。

## 16. 日志/审计点

* `manual_create_order`（operator_id, store_id, campaign_id, amount）。
* `draft_saved`（draft_id）。
* `attachment_upload`（count, total_size）。

## 17. 监控/埋点事件

* `page_view:manual_intake`
* `field_error` {field, error}
* `select_store` {store_id} / `select_campaign` {campaign_id}
* `manual_intake_submit` {ok, order_id?}

## 18. 验收标准（Checklist）

* [ ] 必填/格式校验与提示完整；错误不可提交。
* [ ] 选择门店/活动受权限与有效期约束。
* [ ] 金额与活动档位联动校验。
* [ ] 附件上传/删除/重试流程可用。
* [ ] 成功返回 `order_id` 并跳转详情；失败保留用户输入。
* [ ] e2e 覆盖：完整提交流程与主要错误路径。

## 19. 交付物清单

* 设计稿：`manual-intake.fig`。
* OpenAPI 片段：`openapi/orders.create.yaml`、`orders.draft.yaml`、`uploads.policy.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/manual-intake.spec.ts`。
* 验收 checklist：`acceptance/manual-intake-checklist.md`。

## 20. 签收（产品/运营/QA/日期）

* Product：____  运营：____  QA：____  日期：____
