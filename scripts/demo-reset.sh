#!/usr/bin/env bash
set -euo pipefail


ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.logs"
mkdir -p "$LOG_DIR"


info() { echo -e "\033[32m[info]\033[0m $*"; }
warn() { echo -e "\033[33m[warn]\033[0m $*"; }
err() { echo -e "\033[31m[err ]\033[0m $*"; }


cd "$ROOT_DIR"


info "1/7 启动本地依赖（Postgres / MinIO / Prism / MailHog）"
docker compose up -d


# 等待 DB 就绪
info "等待 Postgres 健康检查..."
for i in {1..30}; do
if docker exec demo-db pg_isready -U "${DB_USER:-demo}" >/dev/null 2>&1; then
break
fi
sleep 2
[[ $i -eq 30 ]] && { err "Postgres 未就绪"; exit 1; }
done


info "2/7 OpenAPI 校验与打包"
pnpm run check


info "3/7 生成 TypeScript SDK"
pnpm run sdk:ts || warn "SDK 生成失败，请检查 openapi/bundle.yaml"


info "4/7 生成 design tokens"
pnpm run tokens:build || warn "tokens 生成脚本未配置，可忽略"


# 数据库迁移与种子（需要 apps/api 提供脚本）
if pnpm -C apps/api -s run | grep -q "prisma:migrate"; then
info "5/7 执行数据库迁移与种子"
pnpm --filter api prisma:migrate || true
pnpm --filter api prisma:seed || true
else
warn "未检测到 apps/api 的 prisma 脚本，跳过迁移/种子"
fi


# 后端与前端分别后台启动（写入日志），避免阻塞当前终端
info "6/7 启动 API 与 Web（后台进程，日志在 .logs/）"
nohup pnpm --filter api dev > "$LOG_DIR/api.log" 2>&1 & echo $! > "$LOG_DIR/api.pid"
nohup pnpm --filter admin-web dev > "$LOG_DIR/web.log" 2>&1 & echo $! > "$LOG_DIR/web.pid"


# Mock 通常用于前期调试，可并行启动（如需）
if [[ "${ENABLE_MOCK_PROVIDER:-true}" == "true" ]]; then
info "（可选）启动 Prism Mock（若未由 docker 启动）"
(pnpm run mock > "$LOG_DIR/mock.log" 2>&1 &) || true
fi


info "7/7 环境已就绪："
echo "- Prism Mock: http://localhost:4010"
echo "- API Service: http://localhost:8080"
echo "- Admin Web: http://localhost:5173"
echo "- Postgres: localhost:5432 (demo/demo/demo)"
echo "- MinIO Console: http://localhost:9001 (demo/demodemo)"
echo "- MailHog: http://localhost:8025"


echo "日志可查看：$LOG_DIR/{api.log,web.log,mock.log}"
echo "如需停止后台 dev 进程：kill \$(cat .logs/api.pid .logs/web.pid 2>/dev/null || true) || true"