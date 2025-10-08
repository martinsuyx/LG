# 后台 Demo —— 页面规格（P2-13 风控命中列表 / Risk Hits）

## 1. 页面名称（中/英）

风控命中列表 / Risk Hits

## 2. 归属菜单（父菜单 / 权限 Role）

* 所属：风控与合规管理 → 风控命中
* 权限：`risk`（查看与处理跳转）、`reviewer`（只读），`admin`（全部含导出）；`operator` 无访问权限（默认）

## 3. 目标与业务价值（1 句话）

集中展示所有规则命中记录，支持多维筛选、批量导出与快速跳转处置，提高风险发现与响应效率。

## 4. 主要用户场景（2–3 个）

* 风控专员按规则/等级/时间筛选近期命中，批量导出做离线分析。
* 审核员从命中记录快速跳转到对应订单详情或风控工单处理。
* 风控负责人查看命中趋势、TOP 规则与渠道分布，优化策略。

## 5. 设计稿链接与断点

* 参考：高保真 V4（风控与合规管理）。
* 断点：≥1440 双栏（左筛选右列表+顶部统计卡），≤1024 单栏折叠。

## 6. 页面组件结构（信息架构）

* **筛选区**：时间范围、规则、等级（低/中/高/致命）、渠道、状态（未处理/已处理/忽略）、订单来源（活动/任务/门店/推广人）、命中标签（黑名单/频率/地理围栏/设备指纹等）。
* **统计卡**：本期命中总数、未处理、处理完成、致命级数量；可选显示同比环比箭头。
* **命中列表表格**：逐条命中记录，支持分页、排序、固定列。
* **右侧详情抽屉**（行点击打开）：命中上下文、证据、相似命中（Top5）、快捷动作（新建工单/跳转工单/跳转订单）。
* **操作区**：导出、批量忽略（需要备注）、批量新建工单（可选）。

## 7. 字段清单（字段名/类型/必填/校验/示例/控件）

* **筛选**：

  * `start`/`end`(date, 必填)，`rule_id?`，`severity?`(low|medium|high|critical)，`channel?`(wechat|h5|scan|api)，`status?`(new|processing|resolved|ignored)，`campaign_id?`，`store_id?`，`promoter_id?`，`tags[]?`。

* **表格列**：

  * `hit_id`(string)：命中记录 ID。
  * `hit_time`(datetime)：命中时间。
  * `rule_code`(string) / `rule_name`(string)：规则编码与名称。
  * `severity`(enum)：低/中/高/致命。
  * `order_id`(string|null)：关联订单号（可无）。
  * `entity`(object)：主体摘要（如 user/phone/device/store）。
  * `channel`(enum)：渠道。
  * `score`(number)：风险得分（0–100）。
  * `status`(enum)：new/processing/resolved/ignored。
  * `ticket_id`(string|null)：关联工单号（可无）。
  * `operator`(string|null)：最后处理人。
  * `note`(string)：备注。

* **详情抽屉**：

  * `context`：命中上下文（表单字段快照、位置、设备指纹、IP、同证件/同设备计数等）。
  * `evidences[]`：证据清单（图片/文本/比对结果）。
  * `similar_hits[]`：近 7 天同主体/同规则 Top5。

## 8. 操作/按钮（权限/确认/提示）

* **导出当前视图**：`POST /api/v1/exports/risk-hits`。
* **批量忽略**（需 `risk` 或 `admin` 权限）：`POST /api/v1/risk/hits/batch_ignore` body: {ids:[], note}。
* **新建工单**：

  * 单条：`POST /api/v1/risk/tickets` body: {hit_id, priority, assignee?, note}。
  * 批量：`POST /api/v1/risk/tickets/batch_from_hits` body: {hit_ids:[], rule_id, priority}。
* **跳转订单**：点击 `order_id` → 订单详情。
* **跳转工单**：点击 `ticket_id` → 风控工单详情。
* **标记已处理**：`POST /api/v1/risk/hits/{id}/resolve`（需备注）。

## 9. API 合约（方法/URL/参数/响应示例/错误码）

* **列表**：`GET /api/v1/risk/hits?start=2025-10-01&end=2025-10-03&severity=high&status=new&page=1&page_size=20`

```json
{
  "total": 423,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "hit_id": "H202510030001",
      "hit_time": "2025-10-03T10:12:30+08:00",
      "rule_code": "GEOFENCE_OUT",
      "rule_name": "越界地理围栏",
      "severity": "high",
      "order_id": "O20251003001",
      "entity": {"phone": "138****0000", "device_id": "d-9a7...", "store_id": "S001"},
      "channel": "wechat",
      "score": 87.5,
      "status": "new",
      "ticket_id": null,
      "operator": null,
      "note": ""
    }
  ]
}
```

* **详情**：`GET /api/v1/risk/hits/{id}` → 含 context/evidences/similar_hits。
* **批量忽略**：`POST /api/v1/risk/hits/batch_ignore` → `{ok:true, count: N}`。
* **标记已处理**：`POST /api/v1/risk/hits/{id}/resolve` → `{ok:true}`。
* **新建工单**：`POST /api/v1/risk/tickets` → `{ticket_id}`。
* **导出**：`POST /api/v1/exports/risk-hits` → `{export_id}`；`GET /api/v1/exports/{export_id}` → `{status, download_url}`。
* **错误码**：`400` 参数不合法；`403` 权限不足；`409` 状态冲突（已被他人处理）；`429` 频率限制；`500` 服务异常。

## 10. Mock 数据（≥3 条代表性）

* `mocks/risk-hits/list.page1.json`（见上例）
* `mocks/risk-hits/detail.json`

```json
{
  "hit_id":"H202510030001",
  "context": {"lat":23.129,"lng":113.264,"distance_to_store_km": 12.7, "form": {"name":"张三","id_number":"4401..."}},
  "evidences": [
    {"type":"text","content":"位置距离门店>10km"},
    {"type":"stat","content":"同设备 24h 内提交 5 笔"}
  ],
  "similar_hits": [
    {"hit_id":"H202510020123","time":"2025-10-02T11:20:00+08:00","rule_code":"GEOFENCE_OUT","score":83},
    {"hit_id":"H202510010456","time":"2025-10-01T15:02:00+08:00","rule_code":"GEOFENCE_OUT","score":80}
  ]
}
```

* `mocks/risk-hits/batch_ignore.success.json`

```json
{"ok":true,"count":15}
```

## 11. 状态机与流程

* 命中记录：`new → processing → resolved|ignored`；被创建工单时可自动切 `processing` 并写入 `ticket_id`。
* 工单回写：工单 `closed` 时，关联命中可自动 `resolved`（通过回调或联动任务）。

## 12. 边界条件与异常场景

* 批量忽略必须填写备注（≥5 字）；不同规则混合批量时提示影响。
* 已被他人处理：提交时返回 409，前端刷新并提示。
* 跨月/大跨度查询：提示使用导出任务；列表限制最大 90 天。
* 权限裁剪：`reviewer` 不显示批量按钮与导出；`risk` 显示全量字段，`admin` 追加高危操作。

## 13. 交互细节

* 列表支持按 `hit_time/score/severity` 排序；severity 使用标签颜色（low=灰，medium=黄，高=橙，critical=红）。
* 行点击 → 右侧抽屉详情；详情内提供“复制上下文/证据”按钮。
* 支持固定列（规则/等级/时间），横向滚动查看其余字段。
* 支持保存常用筛选（命名为视图）。
* 导出显示进度条与完成通知。

## 14. 可用性/无障碍要点

* 键盘导航：上下移动选择行，Enter 打开详情，Esc 关闭。
* 颜色同时配文字与图标，不仅靠颜色表达等级。
* 详情抽屉可被屏幕阅读器朗读字段名称与值。

## 15. 性能与分页要求

* 列表接口目标 < 600ms；详情 < 400ms。
* 每页最多 200 条；大数据量下采用服务端排序与分页。
* 提供游标分页或 `search_after` 方案以避免深翻页性能劣化。
* 支持后端缓存与限流；导出走异步任务。

## 16. 日志/审计点

* `risk_hit_ignore`（ids, user_id, note）
* `risk_hit_resolve`（id, user_id, note）
* `risk_ticket_create_from_hit`（hit_id, ticket_id, user_id）
* `export_risk_hits`（filters_hash, user_id）

## 17. 监控/埋点事件

* `page_view:risk_hits` {filters_hash}
* `filter_change:risk_hits` {field, from, to}
* `hit_open_detail` {hit_id}
* `batch_ignore_click` {count}
* `create_ticket_click` {hit_id|count}

## 18. 验收标准（Checklist）

* [ ] 筛选、排序、分页均准确；统计卡与列表数据一致。
* [ ] 详情抽屉展示上下文/证据/相似命中，复制功能可用。
* [ ] 批量忽略需备注并正确更新状态；并发冲突时有友好提示。
* [ ] 新建工单成功后，命中状态联动为 `processing`，并回写 `ticket_id`。
* [ ] 导出任务生成并在导出中心可见。
* [ ] 权限裁剪正确（reviewer 只读、risk 可操作、admin 全量）。
* [ ] e2e 覆盖：筛选 → 打开详情 → 批量忽略 → 新建工单 → 导出。

## 19. 交付物清单

* 设计稿：`risk-hits.fig`。
* OpenAPI 片段：`openapi/risk.hits.list.yaml`、`risk.hits.detail.yaml`、`risk.hits.batch_ignore.yaml`、`risk.hits.resolve.yaml`、`risk.tickets.create.yaml`、`risk.hits.export.yaml`。
* Mocks：见第 10 条 JSON。
* e2e：`tests/e2e/risk-hits.spec.ts`。
* 验收 checklist：`acceptance/risk-hits-checklist.md`。

## 20. 签收（产品/运营/QA/日期）

* Product：____  风控负责人：____  QA：____  日期：____
