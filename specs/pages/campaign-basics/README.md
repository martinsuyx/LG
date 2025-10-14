# 活动基础设置（谁的活动 + 推什么）/ Campaign Basics

> 本规格用于**取代原“新建活动流程”的 Step 1**，将“甲方（客户）+ 基础信息 + 匹配方式 + 报表模板与字段映射”整合为一个可单独维护的页面；既可嵌入向导，也可独立进入编辑。

---

## 1. 页面名称（中/英）

活动基础设置（谁的活动 + 推什么） / Campaign Basics

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：活动与任务管理 → 活动管理 → 活动详情 → 基础设置
* 角色：`admin`（全部）、`product`（新建/编辑草稿）、`operator`（只读）

## 3. 目标与业务价值（1 句话）

确定活动的甲方归属、目标周期与渠道，并定义**订单匹配方式与报表模板映射**，为后续产品/佣金/结算奠定统一口径。

## 4. 主要用户场景

* 运营创建或编辑活动基本信息（客户、名称、编码、时间、渠道）；
* 配置**匹配方式**：自动（推广唯一ID）/ 手动（手机号等关键字段）；
* 选择**报表模板**并完成字段映射（示例数据校验通过后方可下一步）。

## 5. 设计稿链接与断点

* 高保真：V2 活动与任务管理 / 基础设置页
* 断点：≥1280 双栏（左：表单；右：模板映射与示例验证），≤1024 单列分步

## 6. 页面组件结构（信息架构）

* 顶部信息条：活动状态（草稿/发布/下架）、配置完成度、负责人、最后修改时间
* 左侧表单：

  1. 甲方（客户）选择器
  2. 活动名称 & 编码
  3. 活动周期（起止）& 渠道（wechat/h5/scan/api）
  4. 匹配方式（自动ID / 手动字段）
* 右侧卡片：

  * 报表模板选择 + 字段映射编辑器（示例文件解析区、字段预览、校验报告）
  * 匹配关键字段预览：自动ID / 手机号 / 证件号 / 订单号 / 产品键 等
* 底部操作：保存草稿、测试解析、下一步（跳转“推广产品设置”/或返回活动列表）

## 7. 字段清单

| 字段                 | 类型       | 必填 | 说明                                                         |
| ------------------ | -------- | -- | ---------------------------------------------------------- |
| client_id          | string   | ✓  | 甲方公司（从客户库选择）                                               |
| client_name        | string   | -  | 回填显示                                                       |
| campaign_name      | string   | ✓  | 2–40 字                                                     |
| code               | string   | ✓  | 大写字母数字 3–16，唯一                                             |
| start_time         | datetime | ✓  | 活动开始                                                       |
| end_time           | datetime | ✓  | 活动结束（> start）                                              |
| channels[]         | enum[]   | ✓  | wechat/h5/scan/api                                         |
| matching_mode      | enum     | ✓  | `auto_id`（自动唯一ID）/ `manual_form`（前端表单字段）                   |
| match_keys[]       | string[] | -  | 当 manual_form 时，至少选择一个：phone/identity/order_no/product_key |
| report_template_id | string   | ✓  | 报表模板（决定字段名/类型）                                             |
| report_fields_map  | object   | ✓  | 将甲方报表字段映射为系统字段（例如：`phone` ← `用户手机号`）                       |
| owner_user_id      | string   | ✓  | 活动负责人                                                      |
| kpi_targets        | object   | -  | 可选目标：订单量、匹配率、有效率                                           |
| notes              | string   | -  | 备注                                                         |

## 8. 操作/按钮

* 【保存草稿】保存当前表单与映射，不做严格校验；
* 【测试解析】上传示例报表（Excel）→ 用模板与映射解析 → 返回字段预览与校验报告（匹配率、缺失列、数据类型异常等）；
* 【下一步】当“必填字段 + 模板校验通过”后可用，跳转“推广产品设置”。

## 9. API 合约（Mock 阶段）

* 读取/保存基础设置：

  * `GET /api/v1/campaigns/{id}/basics`
  * `PUT /api/v1/campaigns/{id}/basics` → 保存草稿/更新
* 报表模板：

  * `GET /api/v1/report_templates`（列表）
  * `GET /api/v1/report_templates/{template_id}`（字段定义）
* 模板测试解析：

  * `POST /api/v1/report_templates/{template_id}/parse_example`（multipart: file）→ 返回字段映射预览与校验报告

**返回示例（测试解析）**

```json
{
  "ok": true,
  "columns": [
    {"name":"手机号","suggest_map":"phone","sample":["138***0001","138***0002"]},
    {"name":"推广ID","suggest_map":"promoter_unique_id","sample":["T-001","T-002"]},
    {"name":"产品编码","suggest_map":"product_key","sample":["PROD_WB_200M"]}
  ],
  "issues": [{"type":"missing","field":"order_no","message":"报表中缺少订单号列"}]
}
```

## 10. Mock 数据

* `mocks/campaigns/C1/basics.json`
* `mocks/report_templates/list.json`
* `mocks/report_templates/TPL_CMCC_5G/detail.json`
* `mocks/report_templates/TPL_CMCC_5G/parse_example.ok.json`
* `mocks/report_templates/TPL_CMCC_5G/parse_example.warn.json`

## 11. 状态机与流程

* 基础设置：`draft → ready`（通过模板校验与必填校验）→ `published`（活动整体发布时）
* 模板解析：`uploaded → parsing → ok|warn|error`

## 12. 边界条件与异常场景

* `auto_id` 模式但报表缺少 `promoter_unique_id`：提示需切换为 `manual_form` 或更换模板；
* `manual_form` 模式但未选择 `match_keys`：阻断；
* 时间冲突：`end_time <= start_time` 阻断；
* 代码重复：`code` 与现有活动冲突 → 409；
* 模板/映射缺失必填字段：阻断下一步。

## 13. 交互细节

* 客户选择后自动过滤模板列表（只显示该客户历史模板优先，其他模板可搜索）；
* 模板字段映射器：左侧为报表字段，右侧为系统字段下拉；提供“自动建议映射”，支持手动调整；
* 测试解析结果以卡片列出问题清单（缺列/类型/空值比例），提供一键定位映射项；
* 顶部显示“配置完成度”，随必填项与解析通过动态变化。

## 14. 可用性/无障碍要点

* 表单次序合理，键盘 Tab 可线性完成；
* 映射器支持键盘上下选与搜索；
* 解析报告的错误项提供 aria-live 提示；
* 文件选择框支持拖拽与回车触发。

## 15. 性能与分页要求

* 模板列表分页 50/页；
* 测试解析 10MB 内文件在 5s 内返回（Mock 阶段固定返回）；
* 保存操作 < 300ms。

## 16. 日志/审计点

* `campaign_basics_save|campaign_basics_validate|campaign_basics_next`
* `report_template_select|report_template_parse_example`

## 17. 埋点事件

* `campaign_basics_view` {campaign_id}
* `matching_mode_change` {from, to}
* `report_template_selected` {template_id}
* `parse_example_submit` {template_id}

## 18. 验收标准（Checklist）

* [ ] 必填校验完整；`code` 唯一；时间合法；
* [ ] 模板选择与映射保存成功；
* [ ] 测试解析能返回字段建议与问题清单；
* [ ] `auto_id`/`manual_form` 下的匹配字段与说明正确显示；
* [ ] 下一步按钮仅在校验通过时可用；
* [ ] 视觉与交互符合设计，键盘可操作。

## 19. 交付物清单

* 设计稿：V2 活动基础设置页
* OpenAPI：`campaign.basics.yaml`、`report_templates.list.yaml`、`report_templates.detail.yaml`、`report_templates.parse_example.yaml`
* Mock：`mocks/campaigns/*`, `mocks/report_templates/*`
* e2e：`tests/e2e/campaign-basics.spec.ts`

## 20. 签收

* Product：____  运营：____  QA：____  日期：____
