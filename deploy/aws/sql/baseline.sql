-- Schema base do financas-pessoais para um Postgres VAZIO (deploy AWS).
--
-- As migrations do TypeORM assumem que `lancamentos` já existe (criada por synchronize no início do
-- projeto), então não montam um banco do zero. Este arquivo replica o schema de produção (Supabase,
-- extraído do catálogo) e marca as migrations existentes como aplicadas; migrations NOVAS rodam
-- normalmente no deploy (`migration:run`). Executado pelo deploy.sh só quando o banco está vazio.
BEGIN;

CREATE TABLE categorias (id uuid NOT NULL, nome character varying(80) NOT NULL, tipo character varying(10) NOT NULL, cor character varying(7));
CREATE TABLE baldes (id uuid NOT NULL, nome character varying(80) NOT NULL, "saldoInicial" numeric(12,2) DEFAULT 0 NOT NULL, cor character varying(7));
CREATE TABLE ativos (id uuid NOT NULL, tipo character varying(10) NOT NULL, descricao character varying(80) NOT NULL, quantidade numeric(18,6), "valorUnitario" numeric(12,2), "valorBruto" numeric(12,2) NOT NULL, rendimento numeric(12,2) DEFAULT 0 NOT NULL);
CREATE TABLE lancamentos (id character varying NOT NULL, tipo character varying(10) NOT NULL, categoria character varying(80) NOT NULL, descricao character varying(255), valor numeric(12,2) NOT NULL, competencia character varying(7) NOT NULL, "categoriaId" uuid, "origemRegraId" uuid, "ocorrenciaIndice" integer, pago boolean DEFAULT false NOT NULL, "valorPago" numeric(12,2));
CREATE TABLE metas_mensais (id uuid NOT NULL, "categoriaId" uuid NOT NULL, competencia character varying(7) NOT NULL, valor numeric(12,2) NOT NULL);
CREATE TABLE regras_recorrentes (id uuid NOT NULL, tipo character varying(10) NOT NULL, "categoriaId" uuid NOT NULL, descricao character varying(255), "valorBase" numeric(12,2) NOT NULL, frequencia character varying(10) NOT NULL, "competenciaInicio" character varying(7) NOT NULL, "competenciaFim" character varying(7), "numeroParcelas" integer, ativa boolean DEFAULT true NOT NULL);
CREATE TABLE movimentos_reserva (id uuid NOT NULL, "baldeId" uuid NOT NULL, tipo character varying(10) NOT NULL, valor numeric(12,2) NOT NULL, competencia character varying(7) NOT NULL, descricao character varying(255), "criadoEm" character varying(30));
CREATE TABLE movimentos_carteira (id uuid NOT NULL, "ativoId" uuid NOT NULL, tipo character varying(10) NOT NULL, valor numeric(12,2) NOT NULL, competencia character varying(7) NOT NULL, descricao character varying(255));
CREATE TABLE cotacao_ativo (id uuid NOT NULL, "ativoId" uuid NOT NULL, competencia character varying(7) NOT NULL, "valorUnitario" numeric(12,2), "valorBruto" numeric(12,2));
CREATE TABLE ocorrencias_excluidas ("origemRegraId" uuid NOT NULL, "ocorrenciaIndice" integer NOT NULL);

ALTER TABLE categorias ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);
ALTER TABLE baldes ADD CONSTRAINT baldes_pkey PRIMARY KEY (id);
ALTER TABLE ativos ADD CONSTRAINT ativos_pkey PRIMARY KEY (id);
ALTER TABLE lancamentos ADD CONSTRAINT lancamentos_pkey PRIMARY KEY (id);
ALTER TABLE metas_mensais ADD CONSTRAINT metas_mensais_pkey PRIMARY KEY (id);
ALTER TABLE regras_recorrentes ADD CONSTRAINT regras_recorrentes_pkey PRIMARY KEY (id);
ALTER TABLE movimentos_reserva ADD CONSTRAINT movimentos_reserva_pkey PRIMARY KEY (id);
ALTER TABLE movimentos_carteira ADD CONSTRAINT movimentos_carteira_pkey PRIMARY KEY (id);
ALTER TABLE cotacao_ativo ADD CONSTRAINT cotacao_ativo_pkey PRIMARY KEY (id);
ALTER TABLE ocorrencias_excluidas ADD CONSTRAINT ocorrencias_excluidas_pkey PRIMARY KEY ("origemRegraId", "ocorrenciaIndice");

CREATE UNIQUE INDEX uq_categorias_nome_tipo ON public.categorias USING btree (nome, tipo);
CREATE UNIQUE INDEX uq_baldes_nome ON public.baldes USING btree (nome);
CREATE INDEX idx_lancamentos_competencia ON public.lancamentos USING btree (competencia);
CREATE INDEX idx_lancamentos_categoria_competencia ON public.lancamentos USING btree ("categoriaId", competencia);
CREATE UNIQUE INDEX uq_lancamentos_origem_ocorrencia ON public.lancamentos USING btree ("origemRegraId", "ocorrenciaIndice");
CREATE UNIQUE INDEX idx_metas_categoria_competencia ON public.metas_mensais USING btree ("categoriaId", competencia);
CREATE INDEX idx_regras_ativa_inicio ON public.regras_recorrentes USING btree (ativa, "competenciaInicio");
CREATE INDEX idx_movimentos_balde_competencia ON public.movimentos_reserva USING btree ("baldeId", competencia);
CREATE INDEX idx_movimentos_carteira_ativo_competencia ON public.movimentos_carteira USING btree ("ativoId", competencia);
CREATE INDEX idx_cotacao_ativo_ativo ON public.cotacao_ativo USING btree ("ativoId");
CREATE UNIQUE INDEX uq_cotacao_ativo_ativo_competencia ON public.cotacao_ativo USING btree ("ativoId", competencia);

ALTER TABLE lancamentos ADD CONSTRAINT fk_lancamentos_categoria FOREIGN KEY ("categoriaId") REFERENCES categorias(id) ON DELETE RESTRICT;
ALTER TABLE regras_recorrentes ADD CONSTRAINT fk_regras_categoria FOREIGN KEY ("categoriaId") REFERENCES categorias(id) ON DELETE RESTRICT;
ALTER TABLE movimentos_reserva ADD CONSTRAINT fk_movimentos_balde FOREIGN KEY ("baldeId") REFERENCES baldes(id) ON DELETE RESTRICT;
ALTER TABLE movimentos_carteira ADD CONSTRAINT fk_movimentos_carteira_ativo FOREIGN KEY ("ativoId") REFERENCES ativos(id) ON DELETE RESTRICT;
ALTER TABLE cotacao_ativo ADD CONSTRAINT fk_cotacao_ativo_ativo FOREIGN KEY ("ativoId") REFERENCES ativos(id) ON DELETE CASCADE;

-- Tabela de controle do TypeORM (mesmo formato que ele cria) com as migrations já refletidas acima.
CREATE TABLE migrations (id SERIAL PRIMARY KEY, "timestamp" bigint NOT NULL, name character varying NOT NULL);
INSERT INTO migrations ("timestamp", name) VALUES
  (1717000000000, 'CategoriasEMetas1717000000000'),
  (1717500000000, 'RecorrenciasEParcelas1717500000000'),
  (1718000000000, 'Reservas1718000000000'),
  (1718500000000, 'Investimentos1718500000000'),
  (1719000000000, 'ControlePagamentoRecorrencias1719000000000'),
  (1719500000000, 'CotacoesAtivo1719500000000'),
  (1720000000000, 'MovimentoReservaCriadoEm1720000000000');

COMMIT;
