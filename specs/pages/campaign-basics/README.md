活动基础设置（谁的活动 + 推什么）/ Campaign Basics（更新版）

本版更新要点： 引入「报表模板引擎」，支持 模板自动识别 / 新建并保存模板 / 模板版本管理；Step 1 中完成匹配方式与模板映射的一次性配置，后续上传自动复用。

1. 页面名称（中/英）

活动基础设置（谁的活动 + 推什么） / Campaign Basics

2. 归属菜单（父菜单 / 权限 Role）

所属：活动与任务管理 → 活动管理 → 活动详情 → 基础设置

角色：admin（全部）、product（新建/编辑草稿）、operator（只读）

3. 目标与业务价值（1 句话）

确定活动的甲方归属、周期与渠道，并通过报表模板引擎完成匹配方式与字段映射，使后续导入可自动识别与解析。

4. 主要用户场景

运营创建/编辑：客户、活动名称/编码、周期、渠道；

选择匹配模式（自动ID/手动字段），并完成报表模板选择或新建；

通过示例文件测试解析，校验字段映射；保存为模板并版本化。

5. 设计稿链接与断点

高保真：V2 活动与任务管理 / 基础设置页（模板引擎版）

断点：≥1280 双栏（左表单 / 右模板卡与解析报告），≤1024 单列分步

6. 页面组件结构（信息架构）

顶部信息条：状态（草稿/发布/下架）｜负责人｜配置完成度（随必填+解析通过变化）

左侧表单：

甲方（客户）选择器（支持搜索）

活动名称/编码（唯一）、周期、渠道（wechat/h5/scan/api）

匹配方式：auto_id（唯一ID） / manual_form（phone/identity/order_no/product_key）

右侧卡片：

模板区：

「模板推荐」：基于客户历史与字段相似度自动推荐（显示置信度）

「选择模板」：下拉 + 搜索

「创建模板」：弹窗（从示例文件自动抽取列头 → 字段映射器）

「保存为模板」：将当前映射保存为新模板或新版本（记录备注）

解析区：上传示例文件 → 预览列头 → 自动映射建议 → 校验报告（缺列/类型）

底部：保存草稿｜测试解析｜下一步（跳“推广产品设置”）｜进入模板中心（管理所有模板）

7. 字段清单

字段

类型

必填

说明

client_id

string

✓

甲方公司

campaign_name

string

✓

2–40

code

string

✓

A-Z/0-9 3–16 唯一

start_time / end_time

datetime

✓

起止（end > start）

channels[]

enum[]

✓

wechat/h5/scan/api

matching_mode

enum

✓

auto_id / manual_form

match_keys[]

string[]

△

manual_form 时必选 ≥1：`phone

identity

order_no

product_key`

report_template_id

string

✓

报表模板

report_fields_map

object

✓

字段映射：{phone: '手机号', promoter_unique_id: '推广员编码', ...}

template_version

string

-

使用的模板版本（只读，解析通过后生成）

owner_user_id

string

✓

负责人

notes

string

-

备注

8. 操作/按钮

【保存草稿】保存左侧表单与映射，允许不完整；

【测试解析】上传示例 → 自动识别模板（若未选）→ 自动映射建议 → 报告问题清单；

【保存为模板】将当前映射保存为模板（或产生新版本）；

【下一步】必填项 + 解析通过（无阻断问题）后可用；

【进入模板中心】跳至模板管理页（版本对比/模板复用/审批）。

9. API 合约（Mock 阶段）

基础设置 CRUD：

GET /api/v1/campaigns/{id}/basics

PUT /api/v1/campaigns/{id}/basics

模板引擎：

推荐与列表：GET /api/v1/report_templates?client_id=&q=

模板详情：GET /api/v1/report_templates/{template_id}（含字段与版本）

自动识别：POST /api/v1/report_templates/recognize（multipart: file）→ {template_id, score}

解析示例：POST /api/v1/report_templates/{template_id}/parse_example（multipart: file）→ 校验报告

新建模板/版本：POST /api/v1/report_templates（body: 定义+映射+备注）→ {template_id, version}

解析报告（示例）

{
  "ok": true,
  "score": 0.93,
  "columns": [
    {"name":"手机号","suggest_map":"phone","sample":["138***0001","138***0002"],"required":true},
    {"name":"推广员编码","suggest_map":"promoter_unique_id","sample":["T-001"]}
  ],
  "issues": [
    {"type":"missing","field":"order_no","message":"缺少订单号列"},
    {"type":"type","field":"phone","message":"检测到非手机号格式"}
  ]
}

10. Mock 数据

mocks/campaigns/C1/basics.json

mocks/report_templates/list.json

mocks/report_templates/recommend.CMCC_GZ.json

mocks/report_templates/TPL_CMCC_GZ_DAILY/detail.json

mocks/report_templates/recognize.ok.json

mocks/report_templates/TPL_CMCC_GZ_DAILY/parse_example.ok.json

mocks/report_templates/TPL_CMCC_GZ_DAILY/parse_example.warn.json

11. 状态机与流程

基础设置：draft → ready（模板解析通过）→ published（活动发布）

模板：draft → active → deprecated（版本号递增）

识别：uploaded → recognized|unknown（unknown 时引导创建）

12. 边界条件与异常场景

auto_id 模式但模板不含 promoter_unique_id → 阻断并提示：切换 manual_form 或更换模板；

manual_form 模式但未选 match_keys[] → 阻断；

模板识别低置信度（<0.6） → 提示创建模板或手动选择；

模板保存为新版本须填写备注，支持回滚；

权限：仅 admin/product 可创建/版本化模板。

13. 交互细节

自动推荐展示置信度条与理由（命中字段列表）；

字段映射器支持“自动填充建议”与“重置为模板默认”；

解析报告可下载 CSV（问题清单）；

完成度条：必填项 + 解析通过 = 100%。

14. 可用性/无障碍要点

表单与映射器支持键盘导航；

文件上传控件可拖拽与回车触发；

解析报告使用 aria-live 提示致命问题；

颜色+图标双重提示映射状态（已映射/建议/缺失）。

15. 性能与分页要求

模板列表分页 50/页；

识别/解析 10MB 文件 < 5s 返回初步结果（Mock 阶段固定返回）；

保存/版本化 < 300ms。

16. 日志/审计点

campaign_basics_save|validate|next

template_recommend|recognize|parse_example|create|version_create|rollback

17. 埋点事件

campaign_basics_view {campaign_id}

report_template_recommended {template_id, score}

report_template_recognize_submit {file_size}

report_template_version_create {template_id, version}

18. 验收标准（Checklist）



19. 交付物清单

设计稿：V2 基础设置（模板引擎版）

OpenAPI：campaign.basics.yaml、report_templates.list.yaml、report_templates.detail.yaml、report_templates.recognize.yaml、report_templates.parse_example.yaml、report_templates.version.yaml

Mock：mocks/campaigns/*, mocks/report_templates/*

e2e：tests/e2e/campaign-basics.spec.ts

20. 签收

Product：____  运营：____  QA：____  日期：____

