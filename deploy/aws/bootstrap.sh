#!/usr/bin/env bash
# Prepara um servidor Ubuntu 24.04 NOVO (AWS Lightsail) para rodar o financas-pessoais.
# É chamado pelo "launch script" da instância (lightsail-launch.sh) na primeira inicialização, como root.
#
# Variáveis opcionais:
#   BOOTSTRAP_BRANCH  branch acompanhada até o PR do deploy ser mergeado na main (padrão: main)
#   IMPORT_TOKEN      se definido, abre um receptor de uso único (PUT https://<site>/_import) para
#                     receber um export JSON e importá-lo no banco vazio (ver docs/deploy-aws.md)
#   DOMAIN            domínio próprio; sem ele o site usa <ip>.sslip.io
set -Eeuo pipefail
exec > >(tee -a /var/log/financas-bootstrap.log) 2>&1

APP_DIR=/opt/financas
REPO_URL=${REPO_URL:-https://github.com/Feesene/financas-pessoais.git}
BOOTSTRAP_BRANCH=${BOOTSTRAP_BRANCH:-main}
export DEBIAN_FRONTEND=noninteractive

umask 077
mkdir -p "$APP_DIR"/{import,state,status}
chmod 755 "$APP_DIR" "$APP_DIR/status"

# 1. Swap de 2 GB: o build do Next.js não cabe em 1 GB de RAM.
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi

# 2. Docker + Compose + git (pacotes do Ubuntu).
apt-get update -q
apt-get install -y -q docker.io docker-compose-v2 docker-buildx git curl
systemctl enable --now docker

# 3. Código.
if [[ ! -d "$APP_DIR/repo/.git" ]]; then
  git clone --quiet "$REPO_URL" "$APP_DIR/repo"
fi

# 4. Segredos gerados NO servidor (nunca saem dele). A senha de login fica em /opt/financas/.env.
if [[ ! -f "$APP_DIR/.env" ]]; then
  rand() { openssl rand -hex "$1"; }
  cat >"$APP_DIR/.env" <<ENV
# Gerado pelo bootstrap em $(date -u +%FT%TZ). Para trocar a senha de login, edite APP_PASSWORD
# e rode: sudo /opt/financas/repo/deploy/aws/deploy.sh --force
APP_PASSWORD=$(rand 8)
AUTH_SECRET=$(rand 32)
API_KEY=$(rand 32)
POSTGRES_PASSWORD=$(rand 24)
BOOTSTRAP_BRANCH=$BOOTSTRAP_BRANCH
DOMAIN=${DOMAIN:-}
ENV
fi
chmod 600 "$APP_DIR/.env"

# 5. Deploy contínuo: verifica o GitHub a cada 2 minutos.
cat >/etc/systemd/system/financas-deploy.service <<UNIT
[Unit]
Description=financas-pessoais: publica o commit novo da main (se houver)
After=docker.service network-online.target
Requires=docker.service

[Service]
Type=oneshot
ExecStart=$APP_DIR/repo/deploy/aws/deploy.sh
TimeoutStartSec=45min
UNIT

cat >/etc/systemd/system/financas-deploy.timer <<UNIT
[Unit]
Description=financas-pessoais: verifica deploy a cada 2 minutos

[Timer]
OnBootSec=1min
OnUnitInactiveSec=2min

[Install]
WantedBy=timers.target
UNIT

systemctl daemon-reload
systemctl enable financas-deploy.timer

# 6. Receptor de uso único para o import de dados (opcional).
if [[ -n "${IMPORT_TOKEN:-}" && ! -f "$APP_DIR/import/data.json" ]]; then
  printf '%s' "$IMPORT_TOKEN" >"$APP_DIR/import/token"
  systemd-run --unit financas-import-receiver --property=RuntimeMaxSec=12h \
    /usr/bin/python3 "$APP_DIR/repo/deploy/aws/import-receiver.py"
fi

# 7. Primeiro deploy agora (em seguida o timer assume).
"$APP_DIR/repo/deploy/aws/deploy.sh" --force
systemctl start financas-deploy.timer
echo "[bootstrap] concluído"
