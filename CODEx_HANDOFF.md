# CODEx_HANDOFF.md — Codex 自动化开发说明与任务模板

## 🎯 文件目的

本文件是 Codex 接手本地后台 Demo 开发的唯一操作指南。它定义了：

1. Codex 在本地执行任务的标准流程；
2. 各类 Prompt 模板（后端、前端、Mock、设计驱动、测试）；
3. 文件依赖路径与返回格式规范；
4. 验收命令与验证要求。

---

## 🧭 一、Codex 执行总流程

1. **读取仓库结构**：识别 `/apps`, `/openapi`, `/design`, `/specs`, `/mocks`。
2. **检查依赖环境**：Node ≥20, pnpm ≥9, docker 可用。
3. **安装依赖**：`pnpm install`。
4. **生成 SDK**：`pnpm run sdk:ts`（读取 `openapi/openapi.yaml`）。
5. **构建设计 Tokens**：`pnpm run tokens:build`（从 `design/tokens/tokens.json`）。
6. **读取页面规格**：`specs/pages/<page-key>/README.md`（20 项标准）。
7. **读取设计契约**：`design/pages/<page-key>/design-contract.yaml`。
8. **生成或更新页面代码**（前端或后端）。
9. **运行校验与测试**：`pnpm lint`, `pnpm test:visual`, `pnpm test:e2e`。
10. **返回结果**：列出修改文件、执行命令与终端输出摘要。

---

## ⚙️ 二、Codex 全局任务模板

### 1. 🧩 后端任务模板

```
You are Codex. Repo: <repo_path>. Branch: feat/api-<module>.
Task: Implement backend APIs for <module_name> according to OpenAPI specs under openapi/paths/<module>.

Steps:
1. Create or update controllers/services/repositories in apps/api.
2. Ensure Prisma models match schemas.
3. Generate migration and seed if necessary.
4. Add Jest tests covering main endpoints.
5. Update CHANGELOG.md.

Verify:
- `pnpm --filter api dev` runs with no errors.
- `curl http://localhost:8080/api/v1/<endpoint>` returns valid mock data.
Return:
- Changed files list
- Commands executed
- Logs summary
```

### 2. 💻 前端任务模板

```
You are Codex. Repo: <repo_path>. Branch: feat/page-<page-key>.
Task: Implement page <page-key> in apps/admin-web according to:
- Functional spec: specs/pages/<page-key>/README.md
- Design contract: design/pages/<page-key>/design-contract.yaml
- Visual baseline: design/pages/<page-key>/acceptance-visual.png

Constraints:
- Use only tokens from design/tokens/tokens.json.
- Must pass visual regression (≤1.5% diff) and lint.
- Use sdk/ts for API calls; fallback to mocks if API not ready.

Deliverables:
- Source code under apps/admin-web/src/pages/<page-key>/
- Unit test + e2e test + visual baseline test

Verify:
- `pnpm --filter admin-web dev` renders page
- `pnpm test:visual` passes (diff <1.5%)
- `pnpm lint` passes (no hard-coded style)
Return: list of changed files + verification output.
```

### 3. 🧱 OpenAPI / Mock 任务模板

```
You are Codex. Repo: <repo_path>.
Task: Update or add OpenAPI paths and mock data for <module>.

Steps:
1. Edit openapi/paths/<module>/*.yaml according to specs/pages/<page>/openapi/.
2. Add mock data under mocks/<module>/ matching response shape.
3. Validate: `pnpm run check` passes (redocly lint + bundle).
4. Run mock: `pnpm run mock` (Prism) — ensure endpoints return examples.

Return:
- Changed YAML/JSON files
- Lint results summary
```

### 4. 🎨 设计驱动页面任务模板

```
You are Codex. Repo: <repo_path>. Branch: feat/ui-<page-key>.
Task: Match frontend UI for <page-key> to high-fidelity design.

Inputs:
- Design contract: design/pages/<page-key>/design-contract.yaml
- Tokens: design/tokens/tokens.json
- Visual baseline: design/pages/<page-key>/acceptance-visual.png
- Spec: specs/pages/<page-key>/README.md

Requirements:
- EnforceTokens: true (no hard-coded hex/px)
- Match grid/spacing/typography per contract
- Responsive: desktop(1440) & mobile(375)
- a11y: aria-labels, keyboard navigation, color contrast ≥4.5

Verify:
- `pnpm lint:design` passes
- `pnpm test:visual` diff ≤1.5%
- `pnpm run dev` visually matches baseline
Return:
- Changed files + screenshots diff summary
```

### 5. 🧪 测试与验证任务模板

```
You are Codex. Repo: <repo_path>.
Task: Create or update Playwright e2e test for page <page-key>.

Steps:
1. Read acceptance checklist at specs/pages/<page-key>/acceptance/.
2. Write test at apps/admin-web/tests/e2e/<page-key>.spec.ts.
3. Cover load → filter → action → export flow.
4. Add visual regression snapshots under tests/visual/.

Verify:
- `pnpm test:e2e` passes all
- Screenshots saved under tests/visual/__snapshots__/
Return: summary of tests and snapshots generated.
```

---

## 📂 三、关键路径引用

| 模块         | 主文件/目录                                          |
| ---------- | ----------------------------------------------- |
| 后端服务       | `apps/api`                                      |
| 前端应用       | `apps/admin-web`                                |
| OpenAPI 契约 | `openapi/openapi.yaml`                          |
| Mock 数据    | `mocks/**`                                      |
| 页面规格       | `specs/pages/<page-key>/README.md`              |
| 设计契约       | `design/pages/<page-key>/design-contract.yaml`  |
| 设计令牌       | `design/tokens/tokens.json`                     |
| 视觉基线       | `design/pages/<page-key>/acceptance-visual.png` |
| QA 检查清单    | `design/qa-checklists/<page-key>.md`            |

---

## 🧱 四、验证命令清单

| 验证项                 | 命令                                                      |
| ------------------- | ------------------------------------------------------- |
| OpenAPI 语法与 Mock 校验 | `pnpm run check && pnpm run mock`                       |
| Tokens 构建           | `pnpm run tokens:build`                                 |
| Lint 校验             | `pnpm lint` 或 `pnpm lint:design`                        |
| 单元测试                | `pnpm --filter api test`                                |
| e2e 测试              | `pnpm --filter admin-web test:e2e`                      |
| 视觉回归                | `pnpm test:visual`                                      |
| 构建 SDK              | `pnpm run sdk:ts`                                       |
| 启动服务                | `pnpm --filter api dev` / `pnpm --filter admin-web dev` |

---

## 🧩 五、任务命名规范

| 任务类型    | 分支命名                 | 示例                   |
| ------- | -------------------- | -------------------- |
| 页面开发    | feat/page-<page-key> | feat/page-order-list |
| 后端接口    | feat/api-<module>    | feat/api-orders      |
| Mock 更新 | chore/mock-<module>  | chore/mock-wallet    |
| 设计修正    | design/<page-key>    | design/order-list    |
| 测试新增    | test/<page-key>      | test/dashboard       |

---

## 🧠 六、返回格式规范

Codex 每次任务返回必须包含：

```yaml
files_changed:
  - path: apps/admin-web/src/pages/order-list/index.vue
  - path: apps/api/src/orders/orders.controller.ts
commands_executed:
  - pnpm run lint
  - pnpm run mock
verification_output:
  lint: "0 errors"
  test: "5 passed, 0 failed"
  visual_diff: "0.8%"
```

---

## 🧩 七、附录：推荐任务执行顺序

1. Mock 服务准备 → `pnpm run mock`
2. SDK 生成 → `pnpm run sdk:ts`
3. P0 页面开发（dashboard → orders → review → wallet → withdraw）
4. 后端接口替换 Mock
5. 风控 & KYC 模块
6. 报表/导出/审计/系统设置（P3）
7. e2e 与视觉测试通过
8. CI 流水线验收

---

## 📦 八、交付验证

当 Codex 完成全部任务后，应能执行以下命令并全部通过：

```bash
pnpm run check       # OpenAPI + Mock 校验
pnpm run sdk:ts      # SDK 生成
pnpm run tokens:build
pnpm lint && pnpm test:visual && pnpm --filter admin-web test:e2e
./scripts/demo-reset.sh  # 一键重置与启动
```

输出结果：

* Mock 与真实 API 返回结构一致；
* 前后端页面加载正常；
* 所有测试与视觉回归通过。
