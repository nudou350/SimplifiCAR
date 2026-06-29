-- Patches idempotentes aplicados na base de PRODUÇÃO a cada deploy (.github/workflows/deploy.yml).
-- Diferente de seed.sql (que zera e recria tudo, só p/ init do container local), este arquivo
-- roda na base viva sem apagar nada: TODA instrução aqui PRECISA ser idempotente (NOT EXISTS / guard).
-- Use-o p/ garantir dados de demo que o deploy normal não semeia.

-- Ofertas Caatinga: sem elas o CE-2313302 (déficit Caatinga) não acha oferta compatível
-- p/ "Casar" no marketplace. O seed local já as tem; aqui garantimos o mesmo em produção.
INSERT INTO oferta (propriedade_id, tipo_oferta, area_ha, bioma, valor, unidade, prazo_meses, municipio, uf, distancia_km, status)
SELECT v.* FROM (VALUES
  (NULL::int, 'venda',        4.5, 'Caatinga', 14000.00, '',     NULL::int, 'Tauá',          'CE', 12, 'ativa'),
  (NULL::int, 'arrendamento', 3.2, 'Caatinga',  1900.00, '/ano', 120,       'Independência', 'CE', 28, 'ativa'),
  (NULL::int, 'venda',        6.0, 'Caatinga', 18500.00, '',     NULL::int, 'Crateús',       'CE', 46, 'ativa')
) AS v(propriedade_id, tipo_oferta, area_ha, bioma, valor, unidade, prazo_meses, municipio, uf, distancia_km, status)
WHERE NOT EXISTS (SELECT 1 FROM oferta WHERE bioma = 'Caatinga');
