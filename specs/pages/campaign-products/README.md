# 推广产品设置（甲方产品 + 套餐 + 计佣）/ Campaign Products & Plans

> 本规格用于 **取代原“新建活动流程”中的 Step 2**，将“甲方产品 → 套餐 → 计佣”做成可独立维护的页面（既可在活动向导中嵌入，也可单独进入维护）。

---

## 1. 页面名称（中/英）

推广产品设置（甲方产品 + 套餐 + 计佣） / Campaign Products & Plans

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：活动与任务管理 → 活动管理 → 活动详情 → 推广产品设置
* 角色：`admin`（全部）、`product`（新建/编辑草稿）、`operator`（只读）

## 3. 目标与业务价值（1 句话）

统一管理某活动下的甲方产品与套餐，并给每个套餐定义**默认计佣**与**上限规则**，支持批量导入与复制模板。

## 4. 主要用户场景

* 运营新增甲方产品（与甲方报表字段对齐），为其配置一到多个套餐；
* 为每个套餐设置**默认佣金**（固定/比例/阶梯）与上限规则；
* 批量导入甲方产品与套餐；从历史活动/模板复制规则。

## 5. 设计稿链接与断点

* 高保真：V2 活动与任务管理 / 推广产品设置页
* 断点：≥1440 两列（左：产品/套餐树；右：套餐编辑卡片），≤1024 单列折叠

## 6. 页面组件结构（信息架构）

* 顶部：活动信息条（活动名称、时间、状态、匹配方式）
* 左列：产品与套餐树（产品节点 → 套餐节点，可搜索/展开/排序）
* 工具区：

  * 【新增产品】、【新增套餐】、【复制模板】、【批量导入】、【导出】
* 右侧：编辑区（随选中节点变化）

  * 产品卡：产品基础信息（对齐甲方报表）
  * 套餐卡：价格、默认计佣、上限规则、备注
  * 计佣组件：CommissionField（fixed/percent/tier）

## 7. 字段清单

### 7.1 产品（Product）

| 字段           | 类型       | 必填 | 说明                   |
| ------------ | -------- | -- | -------------------- |
| product_id   | string   | ✓  | 系统生成或导入提供，与甲方报表字段做映射 |
| product_name | string   | ✓  | 甲方产品名（用于匹配）          |
| external_key | string   | -  | 甲方报表中可用于匹配的唯一字段（可多选） |
| keywords     | string[] | -  | 关键字匹配（模糊匹配字段）        |
| category     | string   | -  | 产品分类（可选）             |
| remark       | string   | -  | 备注                   |

### 7.2 套餐（Plan）

| 字段                 | 类型      | 必填 | 说明                                                                          |
| ------------------ | ------- | -- | --------------------------------------------------------------------------- |
| plan_id            | string  | ✓  | 套餐ID（系统生成）                                                                  |
| plan_name          | string  | ✓  | 套餐名称（如“59 元套餐”）                                                             |
| price              | number  | ✓  | 价格（≥0，2 位小数）                                                                |
| commission_default | object  | ✓  | 默认计佣：fixed/percent/tier（详见 CommissionField）                                 |
| caps               | object  | ✓  | 上限规则：`max_commission`、`min_commission`、`allow_override`、`approval_required` |
| share_rules        | object  | -  | 多层分成：如 `{promoter:0.7, leader:0.2, city_head:0.1}`                          |
| enabled            | boolean | ✓  | 是否启用                                                                        |
| remark             | string  | -  | 备注                                                                          |

## 8. 操作/按钮

* 左列：

  * 【新增产品】→ 弹窗：product_name、external_key、keywords、category
  * 产品节点【新增套餐】→ 弹窗：plan_name、price、commission_default、caps
  * 拖拽排序、重命名、归档/恢复
* 右侧套餐卡：

  * 计佣编辑（fixed/percent/tier）
  * 上限规则编辑：max/min、allow_override、approval_threshold
  * 【保存】、【复制到…】、【禁用/启用】
* 工具条：

  * 【复制模板】（从历史活动/模板库复制某产品/套餐或整套规则）
  * 【批量导入】（Excel 模板导入产品+套餐+计佣）
  * 【导出】（当前活动的产品与套餐配置）

## 9. API 合约（Mock 阶段）

* 产品树：`GET /api/v1/campaigns/{id}/products_tree`
* 新增/更新/归档：`POST /api/v1/campaigns/{id}/products`、`PUT /api/v1/campaigns/{id}/products/{product_id}`、`POST /api/v1/campaigns/{id}/products/{product_id}/archive`
* 新增套餐：`POST /api/v1/campaigns/{id}/products/{product_id}/plans`
* 更新套餐：`PUT /api/v1/campaigns/{id}/plans/{plan_id}`
* 复制模板：`POST /api/v1/campaigns/{id}/products/copy_from`
* Excel 导入：`POST /api/v1/campaigns/{id}/products/import` → `{task_id}`；`GET /api/v1/campaigns/{id}/products/import/{task_id}`

> 计佣的 `Commission` schema 复用：`commission.override.yaml` 中的定义，类型：fixed/percent/tier。

## 10. Mock 数据

* `mocks/campaigns/C1/products_tree.json`
* `mocks/campaigns/C1/products.import.accepted.json`
* `mocks/campaigns/C1/products.import.result.json`

## 11. 状态机与流程

* 产品：`active ↔ archived`
* 套餐：`enabled ↔ disabled`
* 导入：`uploaded → validating → accepted → processing → succeeded|failed`
* 复制模板：`select_source → preview_delta → applied`

## 12. 边界条件与异常场景

* 甲方报表匹配冲突：同一 external_key 映射到多个产品 → 阻断并提示手动确认；
* 套餐计佣冲突：同一套餐内阶梯 `threshold` 必须递增；
* 上限冲突：`max_commission < min_commission` → 阻断；
* 导入越权：非活动编辑者无权导入或覆盖 → 返回 403。

## 13. 交互细节

* 左列产品/套餐节点支持搜索与关键字高亮；
* 套餐卡右上角显示“被分配推广人数、匹配成功订单数”；
* 计佣编辑时实时显示预估佣金（比例按 price×%）；
* 复制到…：可选择当前活动中的其他产品或勾选多个套餐；
* 保存后 toast 与局部刷新；
* 导入前下载模板；导入后显示预检错误与回执链接。

## 14. 可用性/无障碍要点

* 左列树节点支持键盘上下移动并回车选中；
* 表单字段与按钮具 aria-label；
* 错误提示就近显示；
* 颜色+图标双重表达启用/禁用状态。

## 15. 性能与分页要求

* 产品/套餐树懒加载；卡片编辑保存 < 400ms；
* 导入预检 < 60s 返回初步结果；
* 支持并行 3 个导入任务（超出排队）。

## 16. 日志/审计点

* `product_create|update|archive|restore`
* `plan_create|update|enable|disable`
* `plan_commission_update|caps_update`
* `products_import_task|products_copy_from`

## 17. 埋点事件

* `products_tree_view` {campaign_id}
* `plan_edit_open` {product_id, plan_id}
* `plan_commission_save` {plan_id, type}
* `products_import_submit` {task_id}
* `products_copy_apply` {source, target_count}

## 18. 验收标准（Checklist）

* [ ] 新增/编辑产品与套餐可用，计佣校验正确；
* [ ] 复制模板成功，预览差异与应用结果准确；
* [ ] 批量导入从模板→上传→预检→结果可回执；
* [ ] 与甲方报表映射字段保存并生效；
* [ ] 视觉与交互符合设计，键盘可操作；
* [ ] 性能达标，日志/埋点完整。

## 19. 交付物清单

* 设计稿：V2 推广产品设置页
* OpenAPI：`campaign.products_tree.yaml`、`campaign.products.crud.yaml`、`campaign.products.copy_from.yaml`、`campaign.products.import.yaml`
* Mock：`mocks/campaigns/*`
* e2e：`tests/e2e/campaign-products.spec.ts`

## 20. 签收

* Product：____  运营：____  QA：____  日期：____
