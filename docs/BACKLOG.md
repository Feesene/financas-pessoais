# Backlog — fora do MVP

Ideias e features mapeadas durante a descoberta que **não** entram na primeira versão. Sem PRD/Spec até serem
promovidas ao escopo.

## v2 (próximas candidatas)

- **Importar planilha / CSV / OFX** — migrar o histórico da planilha atual (2021→hoje) e importar extratos de
  banco/cartão com categorização. Premissa registrada: o usuário começa do zero no MVP.
- **Lembretes de contas a pagar** — vencimentos de boletos/cartão e marcação de pago/não pago.
- **Cotações automáticas de ativos** — preço atual de ações/FIIs via API externa (hoje os valores são digitados
  à mão, como na planilha).

## Futuro

- **Open Finance / integração bancária** (Pluggy, Belvo) — sincronização automática de transações.
- **Login e multiusuário** — autenticação por e-mail/senha e isolamento de dados por conta. **Premissa de
  segurança:** o MVP roda **local/privado**, sem login; expor na internet exige implementar isto antes.
- **App mobile** — o MVP é desktop-first.

## Premissas a validar

- Uso pessoal, single-user, desktop-first, entrada manual, em R$ (BRL).
- Sem autenticação no MVP — válido apenas para execução local. Reavaliar antes de qualquer deploy público.
