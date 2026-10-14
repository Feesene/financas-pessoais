# Imagens de produção do financas-pessoais (usadas no deploy AWS Lightsail — ver docs/deploy-aws.md).
# Um único estágio de build compila o monorepo; os alvos `backend` e `frontend` copiam só o necessário.
#   docker build --target backend  -t financas-backend  .
#   docker build --target frontend -t financas-frontend .

FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
# --ignore-scripts: pula a compilação nativa do better-sqlite3 (só usado no modo SQLite de dev);
# em produção o backend usa Postgres (DATABASE_TYPE=postgres) e nunca carrega esse driver.
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY tsconfig.base.json ./
COPY shared shared
COPY backend backend
COPY frontend frontend
# O COPY preserva as permissões do checkout. Num clone feito com umask 077 (como o do bootstrap), os
# arquivos chegariam como 600 de root e o usuário `node` não leria os package.json nas imagens finais.
RUN chmod a+r package.json package-lock.json tsconfig.base.json \
  && find shared backend frontend -path '*/node_modules' -prune -o -exec chmod a+rX {} +
# Limita o heap do Node: o servidor tem 1 GB de RAM (+ swap).
RUN NODE_OPTIONS=--max-old-space-size=1536 npm run build:workspaces \
  && npm prune --omit=dev --no-audit --no-fund

FROM node:20-bookworm-slim AS backend
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules node_modules
# Os pacotes do monorepo em node_modules são symlinks (../../shared etc.). Para não depender de como o
# builder copia links, o `shared` entra como diretório real e os demais links são removidos.
RUN rm -rf node_modules/@financas-pessoais
COPY --from=builder /app/shared/package.json node_modules/@financas-pessoais/shared/package.json
COPY --from=builder /app/shared/dist node_modules/@financas-pessoais/shared/dist
COPY --from=builder /app/backend/package.json backend/
COPY --from=builder /app/backend/dist backend/dist
WORKDIR /app/backend
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]

FROM node:20-bookworm-slim AS frontend
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
# `output: 'standalone'` com outputFileTracingRoot na raiz gera standalone/frontend/server.js.
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static frontend/.next/static
USER node
EXPOSE 3000
CMD ["node", "frontend/server.js"]
