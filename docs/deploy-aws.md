# Guia de deploy — AWS Lightsail (servidor único)

Alternativa ao [deploy Vercel + Supabase](./deploy.md): o app inteiro (frontend, backend e Postgres) roda num
**servidor AWS Lightsail** com Docker Compose, em `us-east-1`. Os dois ambientes podem ficar no ar em paralelo:
cada um tem o próprio banco.

## Arquitetura

```
Browser ─HTTPS─> Caddy (80/443, certificado Let's Encrypt automático)
                   └─> Next.js (frontend:3000)
                         └─ server actions ─> NestJS (backend:3001, rede interna, x-api-key)
                                                └─ TypeORM ─> Postgres 16 (db:5432, volume pgdata)
```

| Peça                  | Onde                                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Imagens               | [`Dockerfile`](../Dockerfile) (alvos `backend` e `frontend`)                                                                     |
| Stack                 | [`deploy/aws/docker-compose.yml`](../deploy/aws/docker-compose.yml)                                                              |
| Proxy/HTTPS           | [`deploy/aws/Caddyfile`](../deploy/aws/Caddyfile)                                                                                |
| Primeiro boot         | [`deploy/aws/bootstrap.sh`](../deploy/aws/bootstrap.sh) (chamado por [`lightsail-launch.sh`](../deploy/aws/lightsail-launch.sh)) |
| Deploy contínuo       | [`deploy/aws/deploy.sh`](../deploy/aws/deploy.sh) + systemd timer                                                                |
| Schema de banco vazio | [`deploy/aws/sql/baseline.sql`](../deploy/aws/sql/baseline.sql)                                                                  |

- Só o **Caddy** é exposto. Backend e Postgres não têm porta pública; o frontend fala com o backend pela rede
  interna do Docker (`API_URL=http://backend:3001`), ainda com `x-api-key`.
- **Sem domínio próprio**, o endereço é `https://<ip-com-hifens>.sslip.io` (ex.: `https://3-90-12-34.sslip.io`).
  O sslip.io resolve esse nome para o IP, e o Caddy emite o certificado. Com domínio, defina `DOMAIN` no `.env`.
- O keep-alive do Supabase (`/health/keepalive`) não é necessário aqui.

## Deploy contínuo (merge do PR → produção)

Igual à Vercel: **mergeou o PR na `main`, o servidor publica sozinho**, em até ~2 minutos para detectar e mais
alguns minutos de build.

1. O timer `financas-deploy.timer` roda o `deploy.sh` a cada 2 minutos.
2. Se `origin/main` tem um commit novo: build das imagens → migrations do TypeORM → `docker compose up -d`.
3. Se o build ou as migrations falharem, **os containers antigos continuam no ar**. O commit com falha não é
   tentado de novo; o próximo commit na `main` dispara nova tentativa.
4. O estado do último deploy fica público (sem segredos) em `https://<site>/_deploy/status.json`.

É um modelo **pull** (o servidor busca no GitHub). Não precisa de segredo no GitHub nem de porta SSH aberta para
o GitHub Actions. Enquanto o PR que criou este deploy não for mergeado, o servidor acompanha a branch de bootstrap
(`BOOTSTRAP_BRANCH`). Assim que a `main` contém `deploy/aws/deploy.sh`, passa a acompanhar a `main`.

## Criar o servidor do zero

1. Lightsail → **Create instance** → região `us-east-1` → **Linux/Unix → OS Only → Ubuntu 24.04** → plano
   **micro (1 GB, US$ 7/mês)**.
2. Em **Launch script**, cole o conteúdo de [`lightsail-launch.sh`](../deploy/aws/lightsail-launch.sh). Para migrar
   dados, preencha `IMPORT_TOKEN` com um segredo aleatório (veja **Import de dados** abaixo).
3. Depois de criada: **Networking → Create static IP** (grátis enquanto anexado) e, no firewall IPv4, libere
   **HTTPS (443)** além de HTTP (80) e SSH (22).
4. Em ~10–15 minutos o site responde em `https://<ip-com-hifens>.sslip.io`. Para acompanhar, abra
   `/_deploy/status.json` ou, no console SSH, rode `sudo tail -f /var/log/financas-bootstrap.log`.

## Segredos e senha de login

O bootstrap **gera os segredos no próprio servidor** e salva em `/opt/financas/.env` (permissão 600). Nenhum
segredo passa pelo GitHub ou pelo launch script. Para ver ou trocar a senha de login:

```bash
# Lightsail → instância → "Connect using SSH" (terminal no navegador)
sudo grep APP_PASSWORD /opt/financas/.env
sudo nano /opt/financas/.env          # altere APP_PASSWORD
sudo /opt/financas/repo/deploy/aws/deploy.sh --force
```

## Banco de dados

- **Banco vazio:** o `deploy.sh` aplica `baseline.sql`, uma cópia do schema de produção. As migrations do
  TypeORM supõem que `lancamentos` já existe e não montam o banco do zero. O baseline também marca as migrations
  atuais como aplicadas; **migrations novas rodam automaticamente** a cada deploy (`migration:run`).
- **Import de dados:** com `IMPORT_TOKEN` no launch script, o bootstrap sobe um receptor de **uso único**
  ([`import-receiver.py`](../deploy/aws/import-receiver.py)), exposto via Caddy/HTTPS. Para enviar o export:
  ```bash
  curl -X PUT -H "X-Import-Token: <IMPORT_TOKEN>" --data-binary @data.json https://<site>/_import
  ```
  O receptor grava `/opt/financas/import/data.json` e se desliga; a rota passa a responder 502. Em até 2 minutos o
  `deploy.sh` importa o arquivo numa transação ([`import-json.sql`](../deploy/aws/sql/import-json.sql)), **só se
  o banco estiver sem dados**, e move o arquivo para `/opt/financas/state/`. O formato é um objeto
  `{ "<tabela>": [linhas] }`.
- **Backup manual:** `sudo docker compose -p financas exec -T db pg_dump -U financas financas > backup.sql`.
  Snapshots do Lightsail também funcionam, mas são cobrados à parte.

## Comandos úteis (no servidor)

```bash
cd /opt/financas/repo
sudo systemctl list-timers financas-deploy.timer         # próxima verificação
sudo journalctl -u financas-deploy -n 100 --no-pager     # log dos deploys
sudo /opt/financas/repo/deploy/aws/deploy.sh --force     # redeploy imediato
sudo docker compose -p financas ps                       # containers
sudo docker compose -p financas logs -f backend          # logs da API
```

Rollback: `git revert` do commit problemático na `main` (o servidor publica o revert como qualquer commit).

## Custos

| Item                                                           | Custo     |
| -------------------------------------------------------------- | --------- |
| Instância micro (1 GB RAM, 2 vCPU, 40 GB SSD, 2 TB de tráfego) | US$ 7/mês |
| IP estático anexado                                            | grátis    |
| Certificado HTTPS (Let's Encrypt) e sslip.io                   | grátis    |

No plano Free da AWS, o custo sai dos créditos da conta enquanto eles durarem.
