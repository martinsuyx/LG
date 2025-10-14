# 订单匹配与有效性确认 / Order Matching & Validation

> 本规格对应新流程 **Step 4：订单匹配与有效性确认**。目标是在统一界面完成：
> ① 甲方报表导入与解析 → ② 自动/手动匹配 → ③ 有效性校验 → ④ 异常复核与回退 → ⑤ 匹配结果写入订单域，驱动结算。

---

## 1. 页面名称（中/英）

订单匹配与有效性确认 / Order Matching & Validation

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：订单与审核管理 → 订单匹配
* 角色：`admin`（全部）、`reviewer`（复核）、`operator`（导入/查看）、`risk`（异常复核）

## 3. 目标与业务价值（1 句话）

把甲方报表与平台线索（小程序录单/推广链接）进行高准确率匹配与有效性校验，为后续结算提供可靠的订单集合。

## 4. 主要用户场景

* 运营导入甲方报表（Excel/CSV），系统自动解析并与平台线索匹配；
* 自动匹配（推广唯一ID）与手动匹配（手机号/证件号等关键字段）并存；
* 对“多重匹配/缺失/高风险”进行人工复核，最终确认有效订单；
* 导出匹配结果与问题清单，供甲方/内部复核对账。

## 5. 设计稿链接与断点

* 高保真：V3 订单与审核管理 / 匹配工作台
* 断点：≥1440 三段式（上工具条 / 中结果卡+列表 / 右侧详情抽屉）；≤1024 抽屉分步

## 6. 页面组件结构（信息架构）

* 顶部工具条：

  * 活动 ▼、周期（起止）
  * 【上传报表】（Excel/CSV）→ 解析任务
  * 【字段映射】（只读展示来自 Step1 的模板与映射）
  * 【导出结果】（成功/失败/异常清单）
* 结果概览卡片：

  * 报表订单数、已匹配、未匹配、歧义匹配、疑似重复、高风险
  * 匹配成功率、有效率
* 匹配结果表（分页、筛选）：

  * 状态筛选：`matched|unmatched|ambiguous|invalid|risky`
  * 列：报表订单号、产品键、手机号、推广ID、匹配方式（auto_id/manual_form）、匹配到的线索/订单、有效性、风险、操作
* 详情抽屉：两栏对照

  * 左：报表原始字段（高亮键字段）
  * 右：平台线索/订单（录单信息、推广员/门店、活动/套餐）
  * 操作：**设为有效/设为无效/选择目标**（消歧）、**绑定线索**、**备注**

## 7. 字段清单（核心）

| 字段                 | 类型       | 必填 | 说明                 |              |           |         |        |
| ------------------ | -------- | -- | ------------------ | ------------ | --------- | ------- | ------ |
| report_row_id      | string   | ✓  | 报表行ID（导入生成）        |              |           |         |        |
| order_no           | string   | -  | 甲方订单号              |              |           |         |        |
| product_key        | string   | -  | 甲方产品编码/关键字         |              |           |         |        |
| phone              | string   | -  | 手机号（脱敏展示）          |              |           |         |        |
| promoter_unique_id | string   | -  | 推广唯一ID（自动匹配模式必需）   |              |           |         |        |
| match_mode         | enum     | ✓  | `auto_id           | manual_form` |           |         |        |
| match_status       | enum     | ✓  | `matched           | unmatched    | ambiguous | invalid | risky` |
| candidate_count    | int      | -  | 候选线索/订单数量（歧义匹配>1）  |              |           |         |        |
| matched_order_id   | string   | -  | 关联平台订单ID（匹配成功）     |              |           |         |        |
| valid              | boolean  | -  | 是否有效订单             |              |           |         |        |
| risk_flags[]       | string[] | -  | 风险标签（重复、黑名单、异常金额等） |              |           |         |        |
| note               | string   | -  | 备注                 |              |           |         |        |

## 8. 操作/按钮

* 【上传报表】→ 选择文件 → 创建解析任务（展示进度与预检结果）
* 列表行操作：

  * **设为有效/无效**（matched 行快捷设置）
  * **消歧**（ambiguous 行 → 弹出候选列表 → 选择其一并绑定）
  * **绑定线索**（unmatched 行 → 搜索线索/订单并绑定）
  * **标记高风险**（添加/移除 risk flag）
* 批量操作：对勾选行设置有效/无效、导出当前筛选结果

## 9. API 合约（Mock 阶段）

* 导入解析：

  * `POST /api/v1/matching/import`（multipart file）→ `{task_id}`
  * `GET /api/v1/matching/import/{task_id}` → `{status, progress, summary}`
* 结果列表：

  * `GET /api/v1/matching/results?campaign_id=&start=&end=&status=&page=&page_size=&q=`
* 行详情与候选：

  * `GET /api/v1/matching/results/{report_row_id}`（含候选列表 `candidates[]`）
* 行修改：

  * `POST /api/v1/matching/results/{report_row_id}/resolve`（绑定 `order_id` 或 `lead_id`）
  * `POST /api/v1/matching/results/{report_row_id}/set_valid`（`{valid: true|false}`）
  * `POST /api/v1/matching/results/{report_row_id}/risk_flag`（添加/移除）
* 导出：

  * `POST /api/v1/matching/export` → `{export_id}`；`GET /api/v1/exports/{export_id}`

**返回示例（结果列表）**

```json
{
  "total": 1200,
  "page": 1,
  "page_size": 50,
  "items": [
    {"report_row_id":"R1001","order_no":"A-0001","product_key":"PROD_5G_59","phone":"138***0001","promoter_unique_id":"T-001","match_mode":"auto_id","match_status":"matched","candidate_count":1,"matched_order_id":"O20251015001","valid":true,"risk_flags":[]},
    {"report_row_id":"R1002","order_no":"A-0002","product_key":"PROD_WB_200M","phone":"138***0002","promoter_unique_id":null,"match_mode":"manual_form","match_status":"ambiguous","candidate_count":2,"matched_order_id":null,"valid":false,"risk_flags":["duplicate"]}
  ]
}
```

## 10. Mock 数据

* `mocks/matching/import.accepted.json`
* `mocks/matching/import.status.json`
* `mocks/matching/results.page1.json`
* `mocks/matching/detail.R1001.json`（含 candidates）
* `mocks/matching/resolve.success.json`
* `mocks/matching/set_valid.success.json`

## 11. 状态机与流程

* 导入任务：`uploaded → parsing → matched|warning|error`（附 summary：匹配率、异常数）
* 行状态：

  * `unmatched`（未匹配）→ 绑定线索 → `matched`
  * `ambiguous`（多候选）→ 消歧选择 → `matched`
  * `risky`（高风险）→ 复核后可转 `matched|invalid`
  * `matched` → 设置有效性 `valid=true|false` → 写入订单域

## 12. 匹配规则与有效性判定（前端只展示口径，服务端实现）

* **自动匹配（auto_id）**：优先用 `promoter_unique_id` 直连推广员/门店 → 再按 `order_no|product_key|phone` 交叉校验；
* **手动匹配（manual_form）**：按 `phone|identity|order_no|product_key` 逐级匹配，与活动周期/渠道一致性校验；
* **有效性**：满足甲方口径（例：激活成功/未退订/满足金额阈值/未重复）+ 风控不过阈 → 才标记 `valid=true`；
* **优先级**：唯一ID 匹配 > 多字段一致 > 单字段模糊；超 1 候选即 `ambiguous`。

## 13. 交互细节

* 上传后即时显示“预检报告”（缺列/空值/类型错误），可下载异常清单；
* 列表行 hover 显示关键字段比对结果（命中强度条）；
* 详情抽屉左/右对比，命中字段加绿色标注，不一致项红色标注；
* 消歧对话框按命中强度排序候选，显示推广员/门店/活动/创建时间等。

## 14. 可用性/无障碍要点

* 键盘可达：上传、筛选、分页、消歧选择；
* 读屏友好：对比区域和结果项有 aria 描述；
* 大文件上传提供进度与可取消。

## 15. 性能与分页要求

* 结果列表接口 < 800ms；
* 导入文件 ≤ 20MB；解析预检 < 10s 返回初步结果；
* 候选查询 < 500ms；批量操作（1000 行）< 3s。

## 16. 日志/审计点

* `matching_import_create|status|export`
* `matching_row_resolve|set_valid|risk_flag`
* `matching_rule_version`（记录本次使用的匹配规则版本号）

## 17. 埋点事件

* `matching_view` {campaign_id}
* `matching_import_submit` {task_id}
* `matching_row_open` {report_row_id}
* `matching_row_resolve` {report_row_id, action}

## 18. 验收标准（Checklist）

* [ ] 导入→解析→结果可视化完整；
* [ ] 自动匹配/手动匹配状态区分正确；
* [ ] 消歧/绑定线索/有效性设置可用；
* [ ] 导出结果包含匹配和异常清单；
* [ ] 性能与无障碍符合要求；
* [ ] 日志/埋点完整。

## 19. 交付物清单

* 设计稿：V3 匹配工作台
* OpenAPI：`matching.import.yaml`、`matching.results.yaml`、`matching.detail.yaml`、`matching.resolve.yaml`、`matching.export.yaml`
* Mock：`mocks/matching/*`
* e2e：`tests/e2e/order-matching.spec.ts`

## 20. 签收

* Product：____  运营：____  QA：____  日期：____
