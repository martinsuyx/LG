# 后台 Demo —— 页面规格（P0-3 AI 录单 / AI Intake）

## 1. 页面名称（中/英）

AI 录单 / AI Intake

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：订单与审核管理 → AI 录单
* 权限：`operator`（上传与提交）、`admin`（全部）

## 3. 目标与业务价值（1 句话）

利用 AI OCR 自动识别证件/资料，快速录入订单，减少人工成本与错误。

## 4. 主要用户场景（2–3 个）

* 地推人员上传身份证/资料照片 → AI 解析 → 自动预填表单 → 确认提交。
* 审核员在后台查看 AI 解析结果，确认是否需人工修正。
* 出现识别失败时，转为人工录单流程。

## 5. 设计稿链接与断点

* 参考：高保真 V3（录单页 AI 流程）。
* 断点：≥1280 桌面展示双栏（左：上传预览，右：表单结果），≤1024 单栏折叠。

## 6. 页面组件结构（信息架构）

* **上传区**：拖拽/点击上传图片（多文件），展示缩略图与上传进度。
* **解析进度条**：展示 AI 解析状态（等待/进行中/完成/失败）。
* **预填表单**：AI 输出的字段（姓名、身份证号、手机号、门店、活动…）。
* **编辑区**：用户可修改 AI 结果。
* **提交区**：确认提交按钮，展示成功/失败提示。

## 7. 字段清单

* **上传**：`image[]` → {`url`, `status`(uploading|done|error), `size`}。
* **AI 解析结果**：`fields[]` → {`key`(string), `value`(string), `confidence`(0–1), `editable`(bool)}。
* **订单字段**：`name`, `phone`, `id_number`, `store_id`, `campaign_id`, `amount`。
* **状态**：`job_id`(string), `status`(uploaded|parsing|parsed|failed|submitted)。

## 8. 操作/按钮

* 上传图片：触发 `POST /uploads`。
* 解析：自动触发 `POST /orders/ai-intake`，返回 `job_id`。
* 确认提交：`POST /orders` with final fields。
* 重新解析：失败时可点击重试。
* 删除图片：移除已上传项。

## 9. API 合约

* **发起解析**：`POST /api/v1/orders/ai-intake` body: {images[]} → response: {job_id}。
* **轮询结果**：`GET /api/v1/orders/ai-intake/{job_id}` → {status, fields[]}。
* **提交订单**：`POST /api/v1/orders` body: {confirmed_fields} → {order_id, status}。
* **上传文件**：`POST /api/v1/uploads`（调用上传策略接口获取 STS）。

## 10. Mock 数据

```json
{
  "job_id": "J20251003001",
  "status": "parsed",
  "fields": [
    {"key": "name", "value": "张三", "confidence": 0.95, "editable": true},
    {"key": "id_number", "value": "4401********1234", "confidence": 0.90, "editable": true},
    {"key": "phone", "value": "13800000000", "confidence": 0.88, "editable": true}
  ]
}
```

## 11. 状态机与流程

* `uploaded → parsing → parsed → confirmed → submitted`。
* 失败流程：`parsing → failed → retry` 或 `failed → manual_intake`。

## 12. 边界条件与异常场景

* 图片过大/格式不符：前端拦截并提示。
* AI 识别失败：转人工录单。
* 低置信度字段：标红并提示用户检查。
* 上传超时：显示错误并允许重传。

## 13. 交互细节

* 上传图片支持拖拽、批量选择。
* 解析中展示 Loading 动画 + 百分比。
* 字段编辑时即时校验（手机号正则、身份证格式）。
* 确认提交前需勾选“已核对信息”。

## 14. 可用性/无障碍要点

* 键盘 Tab 顺序覆盖上传、表单、提交按钮。
* 错误字段高亮，支持 screen reader。
* 进度条带 aria 属性。

## 15. 性能与分页要求

* 上传单张 ≤5MB，最多 5 张。
* AI 解析接口目标响应 <2s。
* 轮询间隔 2s，超时 30s 提示失败。

## 16. 日志/审计点

* 上传动作：记录上传人、时间、文件名。
* 解析结果：记录 job_id 与状态。
* 提交订单：写入 audit log（operator_id, order_id）。

## 17. 监控/埋点事件

* `page_view:ai_intake`
* `upload_image` {file_size, count}
* `ai_parse_start` {job_id}
* `ai_parse_result` {job_id, success, fields_count}
* `ai_intake_submit` {order_id}

## 18. 验收标准（Checklist）

* [ ] 支持多图上传与预览。
* [ ] AI 解析结果能回显在表单，可编辑。
* [ ] 低置信度字段标红。
* [ ] 提交后返回 order_id 并跳转订单详情。
* [ ] 失败场景能切换到手动录单页。
* [ ] e2e 覆盖：上传 → 解析 → 编辑 → 提交。

## 19. 交付物清单

* 设计稿：`ai-intake.fig`。
* OpenAPI 片段：`openapi/orders.ai-intake.yaml`、`orders.submit.yaml`、`uploads.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/ai-intake.spec.ts`。
* 验收 checklist：`acceptance/ai-intake-checklist.md`。

## 20. 签收（产品/运营/QA/日期）

* Product：____  运营：____  QA：____  日期：____
