订单匹配与有效性确认 / Order Matching & Validation（更新版）

本版更新要点：与「报表模板引擎」打通，支持模板自动识别 / 多文件批处理 / 差异增量匹配 / 候选消歧评分；匹配结果与有效性口径可追溯（记录模板与规则版本）。

1. 页面名称（中/英）

订单匹配与有效性确认 / Order Matching & Validation

2. 归属菜单（父菜单 / 权限 Role）

所属：订单与审核管理 → 订单匹配

角色：admin（全部）、reviewer（复核）、operator（导入/查看）、risk（异常复核）

3. 目标与业务价值（1 句话）

把甲方报表与平台线索（小程序录单/推广链接）进行高准确率匹配与有效性校验，通过模板与规则版本化保证可复现、可审计，为结算提供可靠订单集合。

4. 主要用户场景

上传甲方日报/周报/月报（单/多文件），系统自动识别模板并解析；

自动匹配（唯一推广ID）与手动匹配（手机号/证件号/订单号/产品键）并存；

对“多候选/未匹配/高风险/跨期/重复”进行人工复核与候选消歧；

导出匹配结果与问题清单，留档对账；

记录匹配时所用模板版本与匹配规则版本，便于后续结算追溯。

5. 设计稿链接与断点

高保真：V3 订单与审核管理 / 匹配工作台（模板引擎版）

断点：≥1440 三段式（上工具条 / 中结果卡+列表 / 右侧详情抽屉）；≤1024 抽屉分步

6. 页面组件结构（信息架构）

顶部工具条：

活动 ▼、周期（起止）

【上传报表】（Excel/CSV，多文件队列）

显示：模板识别结果（模板名 + 置信度 + 版本）/ 或「点击新建模板」

【字段映射】（只读展示来自 Step1 的模板与映射）

【导出结果】（成功/失败/异常清单；支持增量差异导出）

结果概览卡片：

报表订单数、已匹配、未匹配、歧义匹配、疑似重复、高风险

匹配成功率、有效率、增量变化（与上次导入相比）

匹配结果表（分页、筛选）：

筛选：matched|unmatched|ambiguous|invalid|risky|cross_period|duplicate、匹配方式（auto_id/manual_form）、增量（新增/更新/无变化）

列：报表订单号、产品键、手机号、推广ID、匹配方式、候选数、消歧评分（最高分）、匹配到的线索/订单、有效性、风险、模板版本、规则版本、操作

详情抽屉：两栏对照

左：报表原始字段（高亮关键字段）

右：平台线索/订单（录单信息、推广员/门店、活动/套餐）

操作：设为有效/设为无效/选择候选（消歧）、绑定线索、备注

7. 字段清单（核心）

字段

类型

必填

说明

task_id

string

-

导入任务ID（多文件）

report_row_id

string

✓

报表行ID（导入生成）

order_no

string

-

甲方订单号

product_key

string

-

甲方产品编码/关键字

phone

string

-

手机号（脱敏展示）

promoter_unique_id

string

-

推广唯一ID（auto_id 模式关键）

match_mode

enum

✓

`auto_id

manual_form`（从活动基础设置口径取）

match_status

enum

✓

`matched

unmatched

ambiguous

invalid

risky

duplicate

cross_period`

candidate_count

int

-

候选数（ambiguous>1）

candidate_top_score

number

-

最高候选消歧评分（0–1）

matched_order_id

string

-

关联平台订单ID（匹配成功）

valid

boolean

-

是否有效订单

risk_flags[]

string[]

-

风险标签（重复、黑名单、异常金额等）

template_id / template_version

string

✓

本次解析采用的模板及版本

matching_rule_version

string

✓

匹配规则版本号（审计）

delta

enum

-

`added

updated

unchanged`（相对上次导入）

note

string

-

备注

8. 操作/按钮

【上传报表】→ 多文件入队 → 自动识别模板（显示置信度与理由）→ 自动解析（异步）

列表行：

设为有效/无效（matched 行）

消歧（ambiguous 行 → 对话框展示候选列表：匹配分、关键字段命中、推广员/门店/订单创建时间 → 选择并绑定）

绑定线索（unmatched 行 → 搜索线索/订单并绑定）

标记/解除风险（添加/移除 risk flag）

批量操作：对勾选行设置有效/无效、导出当前筛选结果、清理重复

9. API 合约（Mock 阶段）

导入解析：

POST /api/v1/matching/import（multipart file, 支持多文件）→ {task_id}

GET /api/v1/matching/import/{task_id} → {status, progress, summary, template_id, template_version}

模板识别（如未提供模板）：POST /api/v1/report_templates/recognize（multipart）→ {template_id, score}

结果列表：

GET /api/v1/matching/results?campaign_id=&start=&end=&status=&delta=&mode=&page=&page_size=&q=

行详情与候选：

GET /api/v1/matching/results/{report_row_id}（含候选 candidates[] 和 scores[]）

行修改：

POST /api/v1/matching/results/{report_row_id}/resolve（绑定 order_id 或 lead_id）

POST /api/v1/matching/results/{report_row_id}/set_valid（{valid: true|false}）

POST /api/v1/matching/results/{report_row_id}/risk_flag（添加/移除）

导出：

POST /api/v1/matching/export → {export_id}；GET /api/v1/exports/{export_id}

返回示例（结果列表）

{
  "total": 1200,
  "page": 1,
  "page_size": 50,
  "items": [
    {"report_row_id":"R1001","order_no":"A-0001","product_key":"PROD_5G_59","phone":"138***0001","promoter_unique_id":"T-001","match_mode":"auto_id","match_status":"matched","candidate_count":1,"candidate_top_score":1.0,"matched_order_id":"O20251015001","valid":true,"risk_flags":[],"template_id":"TPL_CMCC_GZ_DAILY","template_version":"v2025.10.15","matching_rule_version":"mr-1.2.0","delta":"added"},
    {"report_row_id":"R1002","order_no":"A-0002","product_key":"PROD_WB_200M","phone":"138***0002","promoter_unique_id":null,"match_mode":"manual_form","match_status":"ambiguous","candidate_count":2,"candidate_top_score":0.74,"matched_order_id":null,"valid":false,"risk_flags":["duplicate"],"template_id":"TPL_CMCC_GZ_MONTHLY","template_version":"v2025.10.01","matching_rule_version":"mr-1.2.0","delta":"updated"}
  ]
}

10. Mock 数据

mocks/matching/import.accepted.json

mocks/matching/import.status.json

mocks/matching/results.page1.json

mocks/matching/detail.R1001.json（含 candidates+scores）

mocks/matching/resolve.success.json

mocks/matching/set_valid.success.json

mocks/report_templates/recognize.ok.json

11. 状态机与流程

导入任务：uploaded → recognizing(template) → parsing → matched|warning|error（附 summary：匹配率、异常数、模板版本）

行状态：

unmatched → 绑定线索 → matched

ambiguous → 消歧选择 → matched

risky → 复核后转 matched|invalid

matched → 设置有效性 valid=true|false → 写入订单域

增量：与上次导入比对生成 delta={added|updated|unchanged}，供筛选与导出

12. 匹配规则与有效性判定（口径说明，服务端实现）

自动匹配（auto_id）：优先 promoter_unique_id 直连 → 再按 order_no|product_key|phone 交叉校验；

手动匹配（manual_form）：按 phone|identity|order_no|product_key 逐级匹配，并与活动周期/渠道校验；

消歧评分：综合字段命中、近邻时间差、门店/团队历史相似度，归一到 0–1；

有效性：valid=true 需满足甲方口径（激活/未退订/满足金额阈值/未重复）与风控不过阈；

优先级：唯一ID > 多字段一致 > 单字段模糊；多候选即 ambiguous。

13. 交互细节

上传后显示模板识别结果（置信度与命中列）；

预检报告列出缺列/空值/类型异常，可下载问题清单 CSV；

列表 hover 显示命中详情与评分组成；

详情抽屉左/右对比，高亮命中字段（绿）与冲突字段（红）；

消歧对话框按评分降序展示候选；支持搜索与分页。

14. 可用性/无障碍要点

上传/筛选/分页/消歧均可键盘操作；

解析/识别状态采用 aria-live 提示；

文件过大时提示分批；支持取消当前任务。

15. 性能与分页要求

列表接口 < 800ms；

单任务解析 20MB 报表 < 10s 返回初步结果（Mock 固定返回）；

候选查询 < 500ms；批量操作（1000 行）< 3s；

多文件队列并发 2 个，超出排队。

16. 日志/审计点

matching_import_create|recognize|parse|export

matching_row_resolve|set_valid|risk_flag

记录 template_id/template_version 与 matching_rule_version，确保可复现。

17. 埋点事件

matching_view {campaign_id}

matching_import_submit {task_id, files}

matching_template_recognized {template_id, score}

matching_row_resolve {report_row_id, action, score}

18. 验收标准（Checklist）



19. 交付物清单

设计稿：V3 匹配工作台（模板引擎版）

OpenAPI：matching.import.yaml、matching.results.yaml、matching.detail.yaml、matching.resolve.yaml、matching.export.yaml、report_templates.recognize.yaml

Mock：mocks/matching/*、mocks/report_templates/*

e2e：tests/e2e/order-matching.spec.ts

20. 签收

Product：____  运营：____  QA：____  日期：____
