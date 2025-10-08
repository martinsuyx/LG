# 订单详情 / Order Detail
**Path:** `orders/detail`  **Module:** `orders`

## 1. 目标与价值
> 单笔订单的全量信息与操作入口：时间线/证据/风控/结算。

## 4. 组件结构
- 信息卡（基础信息/金额/状态）
- 时间线（状态流转、审核记录）
- 证据区（图片/视频/附件预览）
- 风控区（命中规则、画像）
- 关联操作：复核/撤回/补件/创建工单

## 5. 字段清单（示例）
- 基础：order_id/created_at/channel/store/promoter
- 金额：amount/settled_amount
- 状态：status（枚举，与状态机一致）
- 证据：evidence_urls[]
- 风控：rules_hit[]/score

## 7. 操作
- 复核：`POST /api/v1/orders/{id}/review`
- 撤回：`POST /api/v1/orders/{id}/revoke`（二次确认）
- 补件：打开补件侧栏 → `POST /api/v1/orders/{id}/supplement`

## 8. API（fragment）
- 详情：`GET /api/v1/orders/{id}`
- 日志：`GET /api/v1/orders/{id}/audits`
- 证据：`GET /api/v1/orders/{id}/evidence`

…（其余段落同通用模板）
