# 后台 Demo 开发说明（Joincom Admin Demo）

## 📘 项目简介

本仓库为 Joincom Admin 后台 Demo（P0–P3 全域），包含：

* **后端服务**：Node.js + NestJS + Prisma（PostgreSQL）。
* **前端应用**：Vite + Vue3（或 React）+ Tailwind + TypeScript。
* **接口契约**：OpenAPI 3.0（带 Mock 服务）。
* **设计系统**：Figma 高保真 → design tokens → 可执行设计契约。
* **自动化测试**：Playwright（视觉回归）+ Jest（单测）+ CI/CD。

目标是让 Codex 能在本地完成：接口、页面、样式与交互开发，并保证视觉与交互符合规范。

---

## 📂 目录结构

```
repo/
├─ apps/                     # 应用层
│  ├─ api/                   # 后端服务 (NestJS + Prisma)
│  └─ admin-web/             # 前端管理后台 (Vite + Vue3/React)
│
├─ openapi/                  # OpenAPI 契约定义与 Mock 服务
│  ├─ openapi.yaml
│  ├─ paths/**
│  ├─ components/schemas/**
│  └─ mock.prism.yaml
│
├─ mocks/                    # API 示例数据
│
├─ specs/                    # 页面规格（每页 20 项标准）
│  └─ pages/**
│
├─ design/                   # 设计源与契约
│  ├─ tokens/tokens.json
│  └─ pages/<page-key>/design-contract.yaml
│
├─ tests/                    # e2e + 视觉回归
│  ├─ visual/
│  └─ e2e/
│
├─ scripts/                  # 工具脚本
│  ├─ demo-reset.sh          # 一键重置数据库 + 启动 Mock
│  └─ lint-design.js         # 检查是否只用 tokens
│
├─ CODEx_HANDOFF.md          # Codex 接手开发说明与 Prompt 模板
├─ docker-compose.yml        # 本地数据库 + MinIO
├─ package.json              # 脚本与依赖
├─ Makefile                  # 常用命令封装
├─ .env.example              # 环境变量模板
└─ README.md                 # 本文件
```

---

## 🧩 环境要求

| 工具                      | 版本     | 说明                  |
| ----------------------- | ------ | ------------------- |
| Node.js                 | ≥ 20   | 主运行环境               |
| pnpm                    | ≥ 9    | 包管理器                |
| Docker / Docker Compose | latest | 启动 Postgres + MinIO |
| PostgreSQL              | ≥ 14   | 本地数据库               |
| Python                  | ≥ 3.11 | 脚本依赖（选用）            |

---

##⚙️ 快速启动

```bash
# 克隆仓库并安装依赖
pnpm install

# 启动本地数据库与对象存储
docker compose up -d

# 启动 OpenAPI Mock 服务
pnpm run mock   # http://localhost:4010

# 启动后端 API 服务
pnpm --filter api dev   # http://localhost:8080

# 启动前端 Web 应用
pnpm --filter admin-web dev   # http://localhost:5173

# 运行 E2E 测试
pnpm --filter admin-web test:e2e
```

---

## 🧱 技术栈

| 层级    | 技术                        | 说明                      |
| ----- | ------------------------- | ----------------------- |
| 前端    | Vite + Vue3 (或 React)     | 快速开发、组件化、Token驱动样式      |
| 后端    | NestJS + Prisma           | 模块化服务，ORM 管理 PostgreSQL |
| 数据库   | PostgreSQL                | 主业务数据存储                 |
| 存储    | MinIO                     | 模拟对象存储（上传策略与图片）         |
| 契约    | OpenAPI 3.0 + Prism       | 统一接口契约与 Mock 生成         |
| 设计    | Style Dictionary + Tokens | 多端统一设计体系                |
| 测试    | Playwright + Jest         | 功能与视觉回归                 |
| CI/CD | GitHub Actions            | 自动构建、测试、打包              |

---

## 🧭 开发阶段（建议流程）

1. **准备环境**：安装依赖、运行 docker-compose。
2. **验证 Mock**：`pnpm run mock` 打开 [http://localhost:4010。](http://localhost:4010。)
3. **启动后端**：`pnpm --filter api dev` 打开 [http://localhost:8080/healthz。](http://localhost:8080/healthz。)
4. **启动前端**：`pnpm --filter admin-web dev`。
5. **页面开发顺序**：按 specs/pages 中 P0–P3 顺序逐页完成。
6. **视觉比对**：运行 `pnpm test:visual` 校验像素一致性。
7. **集成测试**：运行 e2e 测试。

---

## 🧠 设计驱动原则

* 只能使用 `design/tokens/tokens.json` 派生变量（禁止写死样式值）。
* 每页严格遵守 `design/pages/<page-key>/design-contract.yaml` 约束。
* 必须通过视觉回归测试（差异 ≤ 1.5%）。
* ARIA 无障碍通过基本键盘导航与标签。

---

## 🧩 Codex 接手说明

Codex 将按以下流程自动化开发：

1. 读取 `CODEx_HANDOFF.md` 中任务模板。
2. 读取 `specs/pages/**/README.md` 与 `design/pages/**/design-contract.yaml`。
3. 使用 `openapi/` 契约生成 SDK 并对接 Mock。
4. 自动生成/更新页面代码，运行 `lint + test:visual`。
5. 返回文件变更与验证结果。

---

## 📦 一键重置与演示

```bash
./scripts/demo-reset.sh
# 自动执行：
# 1. 重建数据库 (dropdb + migrate + seed)
# 2. 启动 Mock + API + Web
# 3. 打开前端并加载 Demo 数据
```

---

## 🧾 授权与版权

本仓库仅用于 Joincom 内部研发与演示用途。禁止外传或商业用途。

---

## 🙋‍♂️ 维护者

* 产品负责人：苏先生
* 技术负责人：Felix Wen
* 设计系统：Joincom Design System Team
* 文档维护：AI Product Copilot (GPT‑5 Codex)

---

> 🧠 **提示**：所有页面规格、OpenAPI 与 Mock 均已分区完备，执行 `pnpm run mock` 即可在本地体验完整的数据流和前后端交互。
