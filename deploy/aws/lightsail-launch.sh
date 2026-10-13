#!/bin/bash
# "Launch script" da instância Lightsail (user data): baixa e executa o bootstrap do repositório.
# Ao criar a instância, substitua os valores abaixo (DATA_URL é opcional).
export BOOTSTRAP_BRANCH=main
export DATA_URL=
curl -fsSL "https://raw.githubusercontent.com/Feesene/financas-pessoais/${BOOTSTRAP_BRANCH}/deploy/aws/bootstrap.sh" | bash
