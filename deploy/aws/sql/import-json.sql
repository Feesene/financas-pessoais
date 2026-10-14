-- Importa um export JSON (um objeto { "<tabela>": [linhas...] }) para o banco VAZIO.
-- Uso (dentro do container do Postgres, com o export montado em /import/data.json):
--   psql -v ON_ERROR_STOP=1 -f /sql/import-json.sql
-- A ordem respeita as FKs. Tudo numa transação: ou entra tudo, ou nada.
\set dados `cat /import/data.json`
BEGIN;
CREATE TEMP TABLE _dados ON COMMIT DROP AS SELECT :'dados'::jsonb AS j;

INSERT INTO categorias SELECT * FROM jsonb_populate_recordset(NULL::categorias, (SELECT j->'categorias' FROM _dados));
INSERT INTO baldes SELECT * FROM jsonb_populate_recordset(NULL::baldes, (SELECT j->'baldes' FROM _dados));
INSERT INTO ativos SELECT * FROM jsonb_populate_recordset(NULL::ativos, (SELECT j->'ativos' FROM _dados));
INSERT INTO lancamentos SELECT * FROM jsonb_populate_recordset(NULL::lancamentos, (SELECT j->'lancamentos' FROM _dados));
INSERT INTO metas_mensais SELECT * FROM jsonb_populate_recordset(NULL::metas_mensais, (SELECT j->'metas_mensais' FROM _dados));
INSERT INTO regras_recorrentes SELECT * FROM jsonb_populate_recordset(NULL::regras_recorrentes, (SELECT j->'regras_recorrentes' FROM _dados));
INSERT INTO movimentos_reserva SELECT * FROM jsonb_populate_recordset(NULL::movimentos_reserva, (SELECT j->'movimentos_reserva' FROM _dados));
INSERT INTO movimentos_carteira SELECT * FROM jsonb_populate_recordset(NULL::movimentos_carteira, (SELECT j->'movimentos_carteira' FROM _dados));
INSERT INTO cotacao_ativo SELECT * FROM jsonb_populate_recordset(NULL::cotacao_ativo, (SELECT j->'cotacao_ativo' FROM _dados));
INSERT INTO ocorrencias_excluidas SELECT * FROM jsonb_populate_recordset(NULL::ocorrencias_excluidas, (SELECT j->'ocorrencias_excluidas' FROM _dados));

COMMIT;
