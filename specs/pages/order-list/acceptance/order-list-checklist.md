# Order List QA Checklist

- [ ] 筛选条件任意组合返回预期结果（对照 mocks/order-list.json）。
- [ ] 单条审核弹窗提交后行内状态即时刷新并写入审计日志（review_order）。
- [ ] 批量操作安全：多选超过 200 条给出提示并阻断提交。
- [ ] 导出任务可创建并返回 `download_url`（模拟 Prism Mock）。
- [ ] 权限校验：`operator` 隐藏审核与批量操作，`reviewer/admin` 有权执行。
- [ ] 空表与网络异常提供友好提示与重试。
- [ ] 单元 / 集成测试覆盖：列表接口、单条审核、批量审核、导出流程。
