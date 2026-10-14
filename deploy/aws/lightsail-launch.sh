#!/bin/bash
# "Launch script" da instância Lightsail (user data): baixa e executa o bootstrap do repositório.
# Ao criar a instância, ajuste os valores abaixo (IMPORT_TOKEN é opcional: só para migrar dados).
export BOOTSTRAP_BRANCH=main
export IMPORT_TOKEN=
curl -fsSL "https://raw.githubusercontent.com/Feesene/financas-pessoais/${BOOTSTRAP_BRANCH}/deploy/aws/bootstrap.sh" | bash
