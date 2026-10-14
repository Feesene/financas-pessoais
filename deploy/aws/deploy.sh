#!/usr/bin/env bash
# Deploy contínuo do financas-pessoais no servidor (AWS Lightsail).
#
# Roda a cada 2 minutos via systemd timer (financas-deploy.timer). Se a branch de produção no GitHub
# tiver um commit novo (ex.: um PR foi mergeado na main), faz build das imagens, aplica migrations e
# reinicia os containers. Se o build falhar, os containers antigos continuam no ar.
#
# Uso manual (no servidor):  sudo /opt/financas/repo/deploy/aws/deploy.sh [--force]
set -Eeuo pipefail

APP_DIR=${APP_DIR:-/opt/financas}
REPO_DIR="$APP_DIR/repo"
ENV_FILE="$APP_DIR/.env"
STATUS_DIR="$APP_DIR/status"
IMPORT_DIR="$APP_DIR/import"
STATE_DIR="$APP_DIR/state"
FORCE=${1:-}

mkdir -p "$STATUS_DIR" "$IMPORT_DIR" "$STATE_DIR"
exec 9>"$STATE_DIR/deploy.lock"
flock -n 9 || exit 0 # outro deploy já está rodando

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a
BOOTSTRAP_BRANCH=${BOOTSTRAP_BRANCH:-main}

status() { # status <estado> <mensagem>
  local commit=${TARGET_COMMIT:-}
  printf '{"state":"%s","message":"%s","branch":"%s","commit":"%s","updated_at":"%s"}\n' \
    "$1" "$2" "${TARGET_BRANCH:-}" "${commit:0:12}" "$(date -u +%FT%TZ)" >"$STATUS_DIR/status.json.tmp"
  mv "$STATUS_DIR/status.json.tmp" "$STATUS_DIR/status.json"
  echo "[deploy] $1: $2"
}

compose() {
  docker compose -p financas --env-file "$ENV_FILE" -f "$REPO_DIR/deploy/aws/docker-compose.yml" "$@"
}

# --- 1. Endereço do site: domínio próprio (DOMAIN) ou <ip>.sslip.io -------------------------------
if [[ -n "${DOMAIN:-}" ]]; then
  site="$DOMAIN"
else
  ip=$(curl -fsS --max-time 10 https://checkip.amazonaws.com | tr -d '[:space:]')
  site="${ip//./-}.sslip.io"
fi
if [[ "${SITE_ADDRESS:-}" != "$site" ]]; then
  sed -i '/^SITE_ADDRESS=/d' "$ENV_FILE"
  echo "SITE_ADDRESS=$site" >>"$ENV_FILE"
  export SITE_ADDRESS=$site
  FORCE=--force
fi

# --- 2. Qual commit publicar ----------------------------------------------------------------------
# Produção = main. Enquanto o PR que criou este deploy não for mergeado (main ainda sem
# deploy/aws/deploy.sh), acompanha a branch de bootstrap.
cd "$REPO_DIR"
git fetch --quiet --prune origin main
TARGET_BRANCH=main
if ! git cat-file -e origin/main:deploy/aws/deploy.sh 2>/dev/null; then
  git fetch --quiet origin "$BOOTSTRAP_BRANCH"
  TARGET_BRANCH=$BOOTSTRAP_BRANCH
fi
TARGET_COMMIT=$(git rev-parse "origin/$TARGET_BRANCH")
current=$(cat "$STATE_DIR/deployed-commit" 2>/dev/null || true)
failed=$(cat "$STATE_DIR/failed-commit" 2>/dev/null || true)

psql_db() { compose exec -T db psql -v ON_ERROR_STOP=1 -U financas -d financas "$@"; }

# Import de dados pendente (export JSON em $IMPORT_DIR/data.json): só entra num banco sem dados.
import_pending() {
  [[ -f "$IMPORT_DIR/data.json" ]] || return 0
  local stamp; stamp=$(date +%Y%m%d%H%M%S)
  local rows
  rows=$(psql_db -tAc "SELECT (SELECT count(*) FROM lancamentos) + (SELECT count(*) FROM categorias) + (SELECT count(*) FROM baldes) + (SELECT count(*) FROM ativos)")
  if [[ "$rows" == "0" ]]; then
    status importing "importando dados"
    psql_db -f /sql/import-json.sql
    mv "$IMPORT_DIR/data.json" "$STATE_DIR/imported-$stamp.json"
    echo "[deploy] dados importados"
  else
    mv "$IMPORT_DIR/data.json" "$STATE_DIR/ignored-$stamp.json"
    echo "[deploy] banco já tem dados: import ignorado"
  fi
  chmod 600 "$STATE_DIR"/*.json
}

if [[ "$FORCE" != "--force" ]]; then
  if [[ "$TARGET_COMMIT" == "$current" || "$TARGET_COMMIT" == "$failed" ]]; then
    # Nada novo para publicar (um commit que já falhou não é tentado de novo).
    if [[ -n "$current" && -f "$IMPORT_DIR/data.json" ]]; then
      import_pending
      status ok "no ar em https://$SITE_ADDRESS"
    fi
    exit 0
  fi
fi

trap 'status failed "erro na linha $LINENO (veja: journalctl -u financas-deploy)"; echo "$TARGET_COMMIT" >"$STATE_DIR/failed-commit"' ERR

git checkout --quiet --force --detach "$TARGET_COMMIT"
status building "build das imagens"

# --- 3. Build (um por vez: o servidor tem 1 GB de RAM) --------------------------------------------
# `docker build` direto (e não `compose build`): funciona com o buildx que o Ubuntu traz. As tags
# são as mesmas `image:` do docker-compose.yml.
docker build --quiet --target backend -t financas-backend:latest "$REPO_DIR" >/dev/null
docker build --quiet --target frontend -t financas-frontend:latest "$REPO_DIR" >/dev/null

# --- 4. Banco: schema base (banco vazio), import de dados pendente e migrations ------------------
status migrating "banco de dados"
compose up -d --wait db

if [[ "$(psql_db -tAc "SELECT to_regclass('public.lancamentos') IS NULL")" == "t" ]]; then
  psql_db -f /sql/baseline.sql
fi
import_pending

compose run --rm --no-deps backend node /app/node_modules/typeorm/cli.js migration:run -d dist/shared/config/data-source.js

# --- 5. Sobe a versão nova ------------------------------------------------------------------------
compose up -d --remove-orphans
docker image prune -f >/dev/null

# Confere que a API responde de verdade (e alcança o banco); senão o deploy é marcado como falho.
backend_ok() {
  compose exec -T backend node -e \
    "fetch('http://localhost:3001/health/keepalive').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))" \
    >/dev/null 2>&1
}
for _ in $(seq 30); do
  backend_ok && break
  sleep 3
done
if ! backend_ok; then
  docker logs --tail 30 financas-backend-1
  false
fi

echo "$TARGET_COMMIT" >"$STATE_DIR/deployed-commit"
rm -f "$STATE_DIR/failed-commit"
status ok "no ar em https://$SITE_ADDRESS"
