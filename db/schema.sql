-- SimplifiCAR — schema PostGIS (DDL autoritativo: docs/07_contrato_mvp.md §3)
-- Geometria em EPSG:4674 (SIRGAS 2000); áreas calculadas reprojetando p/ EPSG:5880.

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE usuario (
  id           SERIAL PRIMARY KEY,
  cpf          VARCHAR(14),
  nome         VARCHAR(160),
  confiabilidade VARCHAR(20)            -- 'prata' | 'ouro'
);

CREATE TABLE propriedade (
  id           SERIAL PRIMARY KEY,
  cod_imovel   VARCHAR(120) UNIQUE NOT NULL,   -- número do CAR (chave de lookup)
  usuario_id   INTEGER REFERENCES usuario(id),
  nome         VARCHAR(200),
  municipio    VARCHAR(120),
  uf           CHAR(2),
  bioma        VARCHAR(40),                    -- 'Cerrado' | 'Amazônia' | 'Mata Atlântica' | 'Caatinga' | ...
  area_ha      NUMERIC(12,4),
  status       VARCHAR(20),                    -- 'Ativo' | 'Pendente' | 'Cancelado'
  origem       VARCHAR(20) NOT NULL,           -- 'consulta_rapida' | 'analise_completa'
  geom         geometry(MultiPolygon, 4674),   -- perímetro simplificado (p/ índice)
  geo_layers   JSONB                           -- FeatureCollection com todas as camadas (ver §5)
);
CREATE INDEX idx_propriedade_cod ON propriedade(cod_imovel);
CREATE INDEX idx_propriedade_geom ON propriedade USING GIST(geom);

CREATE TABLE diagnostico (
  id                   SERIAL PRIMARY KEY,
  propriedade_id       INTEGER NOT NULL REFERENCES propriedade(id) ON DELETE CASCADE,
  rl_exigida_ha        NUMERIC(12,4),
  rl_real_ha           NUMERIC(12,4),
  app_ha               NUMERIC(12,4),
  app_recompor_ha      NUMERIC(12,4),
  area_consolidada_ha  NUMERIC(12,4),
  deficit_ha           NUMERIC(12,4),          -- >0 quando falta RL
  excedente_ha         NUMERIC(12,4),          -- >0 quando sobra RL
  situacao             VARCHAR(20),            -- 'deficit' | 'excedente' | 'em_dia'
  score                INTEGER,                -- 0..100 (ver §6)
  coberturas           JSONB,                  -- [{classe,label,area_ha,fonte}] p/ a legenda
  texto_ia             TEXT,                   -- diagnóstico em linguagem simples (pré-gerado)
  criado_em            TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_diagnostico_prop ON diagnostico(propriedade_id);

CREATE TABLE pendencia (
  id             SERIAL PRIMARY KEY,
  propriedade_id INTEGER NOT NULL REFERENCES propriedade(id) ON DELETE CASCADE,
  tipo           VARCHAR(60),                  -- 'reserva_legal' | 'app' | 'embargo' | ...
  gravidade      VARCHAR(20),                  -- 'alerta' | 'ok'
  descricao      TEXT,
  origem         VARCHAR(20)                   -- 'oficial' (do .RET) | 'calculado'
);

CREATE TABLE oferta (
  id             SERIAL PRIMARY KEY,
  propriedade_id INTEGER REFERENCES propriedade(id),
  tipo_oferta    VARCHAR(20) NOT NULL,         -- 'venda' | 'arrendamento'
  area_ha        NUMERIC(12,4),
  bioma          VARCHAR(40),
  valor          NUMERIC(14,2),                -- valor total (venda) ou periódico (arrendamento)
  unidade        VARCHAR(20),                  -- '' (venda) | '/ano' | '/mes'
  prazo_meses    INTEGER,                      -- só arrendamento
  municipio      VARCHAR(120),
  uf             CHAR(2),
  distancia_km   INTEGER,                      -- distância ao imóvel demandante (demo: fixo)
  status         VARCHAR(20) DEFAULT 'ativa'   -- 'ativa' | 'casada'
);

CREATE TABLE match (
  id                        SERIAL PRIMARY KEY,
  oferta_id                 INTEGER NOT NULL REFERENCES oferta(id),
  propriedade_demandante_id INTEGER REFERENCES propriedade(id),
  status                    VARCHAR(20) DEFAULT 'proposto',  -- 'proposto' | 'fechado'
  criado_em                 TIMESTAMP DEFAULT now()
);
