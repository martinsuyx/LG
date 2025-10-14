# 结算与发佣 / Settlement & Payout

> 本规格对应新流程 **Step 5：结算与发佣**。目标是在统一界面完成：
> ① 选择活动周期与范围 → ② 计算结算（含多级分成）→ ③ 生成钱包流水（冻结/解冻）→ ④ 发起出款 → ⑤ 异常调整 & 对账导出。

---

## 1. 页面名称（中/英）

结算与发佣 / Settlement & Payout

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：资金与账户管理 → 结算与发佣
* 角色：`admin`（全部） / `finance`（计算、审核、出款） / `operator`（只读） / `auditor`（只读、导出）

## 3. 目标与业务价值（1 句话）

把“有效订单”转化为可追溯、可复核的**结算批次**，自动完成多级分成与发放，降低财务对账与人工作业成本。

## 4. 主要用户场景

* 财务选择活动与结算区间，创建结算批次，查看**结算预览**与差异；
* 系统根据**多级分成规则**（推广员/领队/门店/城市负责人）计算各主体应发；
* 生成钱包流水（冻结→解冻/入账），并发起**提现/出款**；
* 对异常单据进行**调账/回退/补结算**，并输出对账报表。

## 5. 设计稿链接与断点

* 高保真：V6 资金与账户管理 / 结算与发佣
* 断点：≥1440 三段式（上工具条 / 中批次卡 + 列表 / 右侧详情抽屉）；≤1024 抽屉分步

## 6. 页面组件结构（信息架构）

* 顶部筛选/工具条：

  * 活动 ▼、结算周期（起止）、范围（公司/城市/门店/团队）、渠道
  * 【创建结算批次】（会生成 `batch_id`）
  * 【导出对账】（导出应发明细/异常清单/凭证）
* 批次概览卡：

  * 批次数、待审核、已出款、异常；合计应发、实际出款、费用（手续费/税/补差）
* 批次列表（分页、筛选：状态 `draft|preview|ready|locked|paid|failed|reversed`）：

  * 批次号、活动、周期、订单数、应发合计、分成摘要、创建人、状态、操作（预览/锁定/生成流水/发起出款/回退/导出）
* 详情抽屉：

  * ① 概览（批次信息、计算时间、规则版本、差异摘要）
  * ② 明细（按主体聚合：推广员/门店/团队；支持下钻订单级）
  * ③ 异常（重复/黑名单/跨期/已发放）
  * ④ 操作记录（时间线）

## 7. 字段清单（核心）

### 7.1 结算批次（Batch）

| 字段                        | 类型      | 必填 | 说明                                                 |         |       |        |      |        |           |
| ------------------------- | ------- | -- | -------------------------------------------------- | ------- | ----- | ------ | ---- | ------ | --------- |
| batch_id                  | string  | ✓  | 结算批次编号                                             |         |       |        |      |        |           |
| campaign_id               | string  | ✓  | 活动ID                                               |         |       |        |      |        |           |
| period_start / period_end | date    | ✓  | 结算周期                                               |         |       |        |      |        |           |
| scope                     | object  | -  | 范围：company/city/store/team                         |         |       |        |      |        |           |
| orders_count              | integer | ✓  | 涉及订单数                                              |         |       |        |      |        |           |
| amount_gross              | number  | ✓  | 应发合计（分成前）                                          |         |       |        |      |        |           |
| amount_net                | number  | ✓  | 应发合计（分成后、含费用）                                      |         |       |        |      |        |           |
| share_rules               | object  | ✓  | 分成规则快照 `{promoter:0.7, leader:0.2, city_head:0.1}` |         |       |        |      |        |           |
| rule_version              | string  | ✓  | 计算规则版本（审计）                                         |         |       |        |      |        |           |
| status                    | enum    | ✓  | `draft                                             | preview | ready | locked | paid | failed | reversed` |
| created_by                | string  | ✓  | 创建人                                                |         |       |        |      |        |           |

### 7.2 主体应发（PayoutItem）

| 字段          | 类型      | 必填 | 说明                                   |
| ----------- | ------- | -- | ------------------------------------ |
| entity_type | enum    | ✓  | promoter / store / team / city_head  |
| entity_id   | string  | ✓  | 主体ID                                 |
| amount      | number  | ✓  | 应发金额                                 |
| orders      | integer | ✓  | 覆盖订单数                                |
| details     | array   | -  | 订单级明细 `[ {order_id, amount, note} ]` |
| fee_tax     | number  | -  | 税费合计                                 |
| adjustments | number  | -  | 调整合计（正/负）                            |

## 8. 操作/按钮

* 【创建结算批次】→ 生成 `batch_id`，进入 `preview`
* 在批次行/详情：

  * 【计算预览】→ 后端计算分成与应发，显示差异摘要；
  * 【锁定批次】→ 状态 `ready`，禁止再次更改计算口径（除非回退）
  * 【生成流水】→ 写入钱包冻结流水（账期内首次冻结）
  * 【发起出款】→ 为主体创建提现单（合并小额策略可配置），进入提现管理流程
  * 【回退】→ 回 `draft` 重新计算；【冲正/补结算】→ 进入调整流程
  * 【导出】→ 应发明细、主体汇总、订单清单、异常清单

## 9. API 合约（Mock 阶段）

* 批次创建 / 查询 / 列表：

  * `POST /api/v1/settlement/batches`（body：campaign_id、period、scope、channel）→ `{batch_id}`
  * `GET /api/v1/settlement/batches?campaign_id=&status=&page=&page_size=`
  * `GET /api/v1/settlement/batches/{batch_id}`（含明细/异常/记录）
* 计算预览 / 锁定 / 生成流水 / 回退：

  * `POST /api/v1/settlement/batches/{batch_id}/preview`
  * `POST /api/v1/settlement/batches/{batch_id}/lock`
  * `POST /api/v1/settlement/batches/{batch_id}/generate_wallet`
  * `POST /api/v1/settlement/batches/{batch_id}/revert`
* 发起出款（对接提现域）：

  * `POST /api/v1/settlement/batches/{batch_id}/payouts` → 返回若干 `withdraw_id`
* 调整与补结算：

  * `POST /api/v1/settlement/batches/{batch_id}/adjustments`（正负、原因、主体）
* 导出：

  * `POST /api/v1/settlement/batches/{batch_id}/export` → `{export_id}`；`GET /api/v1/exports/{export_id}`

**预览返回示例**

```json
{
  "batch_id":"B20251015001",
  "orders_count": 1245,
  "amount_gross": 235678.50,
  "amount_net": 198765.40,
  "share_rules": {"promoter":0.7,"leader":0.2,"city_head":0.1},
  "summary": {
    "promoter": {"count": 1023, "amount": 139135.78},
    "leader":   {"count":  840, "amount":  39753.08},
    "city_head":{"count":  320, "amount":  19976.54}
  },
  "exceptions": {
    "duplicate_orders": 12,
    "blacklist": 3,
    "cross_period": 8,
    "already_paid": 5
  }
}
```

## 10. Mock 数据

* `mocks/settlement/batches.page1.json`
* `mocks/settlement/batch.B20251015001.json`
* `mocks/settlement/batch.B20251015001.preview.json`
* `mocks/settlement/batch.B20251015001.wallet.json`
* `mocks/settlement/batch.B20251015001.payouts.json`
* `mocks/settlement/batch.B20251015001.export.json`

## 11. 状态机与流程

* 批次：`draft → preview → ready(lock) → paid|failed → reversed`；
* 钱包：`freeze → unfreeze/settled`（按出款结果）；
* 提现：`pending → approved → processing → succeeded|failed`；
* 调整：对锁定前批次可直接重算；锁定后需“回退”或走“补结算”。

## 12. 计算与分成（口径说明，服务端实现）

* 订单范围：来自 Step4 标记 `valid=true` 的订单（且未结算/未跨期）；
* 计佣：按活动套餐 `commission_default` / 覆盖（优先级：个人>门店>团队>城市>公司>默认）；
* 分成：按 `share_rules` 拆分到各主体，支持“合并小额”（小于阈值自动合并至下期）；
* 费用：手续费、税金、调账在 `amount_net` 中反映；
* 审计：记录 `rule_version` 与 `commission_override` 快照，保证可复现。

## 13. 交互细节

* 预览页展示“差异摘要”（与上期/上批比较：金额、订单数、异常数）；
* 详情可按主体下钻到订单级；
* 锁定后所有计算入口置灰，仅开放“回退/导出”；
* 发起出款时支持“按主体合并付款/逐笔付款”选项；
* 支持“试算模式”与“正式批次”开关。

## 14. 可用性/无障碍要点

* 列表/抽屉键盘操作可达；
* 进度与结果采用 aria-live 提示；
* 导出提供多格式（CSV/XLSX），文件名含批次号与时间。

## 15. 性能与分页要求

* 计算预览（1k~10k 单）< 10s 返回摘要；
* 批次列表接口 < 600ms；
* 详情下钻分页 200/页；
* 批量生成钱包流水与出款单均走异步任务，提供实时进度。

## 16. 日志/审计点

* `settlement_batch_create|preview|lock|wallet_generate|payouts_create|revert|export`；
* 记录规则版本与操作者、时间戳；
* 调整与补结算记录 `adjustment_create|apply`。

## 17. 埋点事件

* `settlement_view` {campaign_id}
* `settlement_batch_create_click` {campaign_id, period}
* `settlement_preview_run` {batch_id}
* `settlement_lock_click` {batch_id}
* `settlement_generate_wallet_click` {batch_id}
* `settlement_payouts_click` {batch_id}

## 18. 验收标准（Checklist）

* [ ] 批次创建→预览→锁定→生成流水→出款流程完整；
* [ ] 分成结果与异常摘要展示准确；
* [ ] 钱包与提现联动正确（生成冻结流水与出款单）；
* [ ] 回退/补结算/调整流程可用；
* [ ] 导出包含必要维度与凭证；
* [ ] 性能与无障碍符合要求；日志与埋点完整。

## 19. 交付物清单

* 设计稿：V6 结算与发佣页
* OpenAPI：`settlement.batches.yaml`、`settlement.batch.preview.yaml`、`settlement.batch.lock.yaml`、`settlement.batch.wallet.yaml`、`settlement.batch.payouts.yaml`、`settlement.batch.adjustments.yaml`、`settlement.batch.export.yaml`
* Mock：`mocks/settlement/*`
* e2e：`tests/e2e/settlement-payout.spec.ts`

## 20. 签收

* Product：____  财务：____  QA：____  日期：____
