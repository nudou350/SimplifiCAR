"""
Gera db/seed/seed.sql a partir dos dados reais colhidos (data/raw/).

- Lê os 4 imóveis-demo (demonstrativo + geojson).
- Calcula diagnóstico (déficit/excedente/situação/score) pela fórmula AUTORITATIVA
  do contrato docs/07_contrato_mvp.md §6 — a MESMA usada no pipeline.
- Normaliza o `tipo` cru das camadas para o canônico do §5 (mapa RAW2CANON abaixo).
- Emite: 1 usuario, 4 propriedade, 4 diagnostico, 6 oferta (marketplace §7) e
  pendências oficiais de CE-2313302.

Sem dependências de banco: só emite texto SQL. Rodar com qualquer Python 3:
    pipeline/.venv/Scripts/python.exe db/seed/build_seed_sql.py
"""
import json
import glob
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW = os.path.join(ROOT, "data", "raw")
OUT = os.path.join(os.path.dirname(__file__), "seed.sql")

# ---------------------------------------------------------------------------
# §5 — mapeamento RAW (tipo cru do SICAR) -> CANÔNICO (cor no front)
# Documentado também em db/README.md. Qualquer APP_*/RIO_* vira água/app.
RAW2CANON = {
    "AREA_IMOVEL": "perimetro",
    "AREA_IMOVEL_LIQUIDA": "perimetro",
    "AREA_CONSOLIDADA": "consolidada",
    "VEGETACAO_NATIVA": "vegetacao",
    "ARL_PROPOSTA": "reserva_legal",
    "ARL_TOTAL": "reserva_legal",
    "RL_DECLARADA": "reserva_legal",
    "RESERVA_LEGAL": "reserva_legal",
    "ARL_A_RECUPERAR": "deficit_rl",
    "SEDE_IMOVEL": "sede",
}


def to_canon(raw_tipo):
    if raw_tipo in RAW2CANON:
        return RAW2CANON[raw_tipo]
    if raw_tipo.startswith("APP") or raw_tipo.startswith("RIO"):
        return "app"          # APP / curso d'água -> azul (§5 "app")
    return "vegetacao"        # fallback seguro p/ camadas verdes não mapeadas


# ---------------------------------------------------------------------------
# Os 4 imóveis-demo (contrato §7) — bioma definido p/ casar com o marketplace.
# CE-2300705 forçado a Cerrado: o demo (§10 passo 3) casa esse déficit com uma
# oferta Cerrado, e não há oferta Caatinga no seed. Ver "ressalvas" no README.
DEMOS = [
    {"cod": "MG-3127008-6CAD429ED6934E68818CD3FC21D797A6", "bioma": "Cerrado",
     "papel": "verde_excedente"},
    {"cod": "CE-2300705-2D3561F0129447BA9CB92D62D2E6FFB8", "bioma": "Cerrado",
     "papel": "deficit_forte"},
    {"cod": "CE-2313302-1BC346842FE34636916F950EC6B63AC9", "bioma": "Caatinga",
     "papel": "recompor_app"},
    {"cod": "PR-4110201-4BF5A9647E0F455AAEA1C8F0A0889199", "bioma": "Mata Atlântica",
     "papel": "deficit_grande"},
]

# texto_ia pré-gerado (linguagem de gente; explica números já calculados, nunca inventa).
# 1 campo de futebol ~= 0.7 ha.
TEXTO_IA = {
    "MG-3127008-6CAD429ED6934E68818CD3FC21D797A6":
        "Boa notícia: sua propriedade está em dia com o Código Florestal. Você tem cerca "
        "de 13,2 hectares de mata nativa, quando a lei exige 12,5 — uma sobra de aproximadamente "
        "0,68 hectare (quase 1 campo de futebol) de Reserva Legal preservada além do mínimo. "
        "Esse excedente tem valor: você pode anunciá-lo no marketplace e vender como Cota de "
        "Reserva Ambiental (CRA) ou arrendar a servidão para quem precisa compensar.",
    "CE-2300705-2D3561F0129447BA9CB92D62D2E6FFB8":
        "Atenção: sua propriedade está com déficit de Reserva Legal. A lei exige cerca de "
        "21,3 hectares de vegetação nativa preservada (20% do imóvel), mas hoje praticamente "
        "não há mata reconhecida — faltam aproximadamente 21,3 hectares, o equivalente a uns "
        "30 campos de futebol. Recompor essa área plantando do zero é caro e demorado; em muitos "
        "casos sai bem mais barato compensar comprando CRA ou arrendando excedente de outro "
        "produtor. Veja as ofertas compatíveis no marketplace.",
    "CE-2313302-1BC346842FE34636916F950EC6B63AC9":
        "Sua propriedade tem pendências a regularizar: falta cerca de 1,5 hectare de Reserva "
        "Legal e há aproximadamente 2,1 hectares de Área de Preservação Permanente (APP), na "
        "beira de rio, a recompor — somando perto de 5 campos de futebol. A APP precisa ser "
        "recuperada no próprio imóvel; já a Reserva Legal pode ser compensada. Faça a Análise "
        "Completa para ver o passo a passo e gerar a minuta de retificação.",
    "PR-4110201-4BF5A9647E0F455AAEA1C8F0A0889199":
        "Sua propriedade está com déficit grande de Reserva Legal: a lei exige cerca de 53,6 "
        "hectares de mata nativa (20% do imóvel) e hoje não há vegetação reconhecida — faltam "
        "aproximadamente 53,6 hectares, algo como 75 campos de futebol. Como a recomposição "
        "total seria muito custosa, vale avaliar compensar parte via CRA no marketplace e "
        "priorizar as áreas mais sensíveis.",
}

# Ofertas do marketplace (contrato §7, do mockup baseOffers). propriedade_id NULL = oferta externa.
OFERTAS = [
    # tipo_oferta, area_ha, bioma, valor, unidade, prazo, municipio, uf, dist
    ("venda",        9.2,  "Cerrado",        38000.0, "",     None, "Riachão das Neves", "BA", 42),
    ("arrendamento", 8.0,  "Cerrado",         5800.0, "/ano",  240, "Barreiras",          "BA", 31),
    ("arrendamento", 6.5,  "Cerrado",         4900.0, "/ano",  180, "São Desidério",      "BA", 55),
    ("venda",        15.4, "Cerrado",        61000.0, "",     None, "Formosa do Rio Preto","BA", 78),
    ("venda",        40.0, "Amazônia",      120000.0, "",     None, "Novo Progresso",     "PA", 1900),
    ("arrendamento", 12.0, "Mata Atlântica",  9000.0, "/ano",  120, "Sorocaba",           "SP", 2100),
]


def q(s):
    """String SQL: escapa aspas simples."""
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def num(x, nd=4):
    if x is None:
        return "NULL"
    return f"{float(x):.{nd}f}"


def load_demonstrativo(cod):
    with open(os.path.join(RAW, "demonstrativos", cod + ".json"), encoding="utf-8") as f:
        return json.load(f)


def load_geojson(cod):
    # filenames de geojson têm um caractere espúrio () antes de .geojson -> usar glob
    hits = glob.glob(os.path.join(RAW, "geojson", cod + "*"))
    if not hits:
        raise FileNotFoundError(cod)
    with open(hits[0], encoding="utf-8") as f:
        return json.load(f)


def compute_diag(areas, area_ha):
    """Fórmula autoritativa do contrato §6."""
    rl_exig = areas["areaRLMinimaExigidaLei"]
    rl_real = areas["areaRLVetorizadaSobrepostaRVN"]
    app_ha = areas["areaAPP"]
    app_rec = areas["areaAPPRecompor"]
    area_cons = areas["areaUsoConsolidado"]

    deficit = max(0.0, rl_exig - rl_real)
    excedente = max(0.0, rl_real - rl_exig)

    rl_ratio = 1.0 if rl_exig <= 0 else min(1.0, rl_real / rl_exig)
    app_pen = 0.0 if app_rec <= 0 else min(0.30, app_rec / max(0.5, area_ha * 0.10))
    score = round(max(0.0, min(100.0, 100 * (0.75 * rl_ratio + 0.25) - 100 * app_pen)))

    if deficit > 0.05:
        situacao = "deficit"
    elif excedente > 0.05:
        situacao = "excedente"
    else:
        situacao = "em_dia"

    return {
        "rl_exigida_ha": rl_exig, "rl_real_ha": rl_real, "app_ha": app_ha,
        "app_recompor_ha": app_rec, "area_consolidada_ha": area_cons,
        "deficit_ha": deficit, "excedente_ha": excedente,
        "situacao": situacao, "score": int(score),
    }


def build_coberturas(areas):
    """Legenda (§4.1): consolidada (declarado) + floresta/savanica/campo (satélite,
    split proporcional da veg nativa) + água (APP). RVN não vem quebrada por classe
    no demonstrativo, então floresta/savanica/campo é split documentado (0.45/0.35/0.20)."""
    consolidada = (areas["areaUsoConsolidado"] or 0) + (areas.get("areaAA") or 0)
    rvn = areas.get("areaRVN") or 0
    agua = areas.get("areaAPP") or 0
    return [
        {"classe": "consolidada", "label": "Área consolidada / alterada",
         "areaHa": round(consolidada, 2), "fonte": "declarado"},
        {"classe": "floresta", "label": "Formação florestal",
         "areaHa": round(rvn * 0.45, 2), "fonte": "satelite"},
        {"classe": "savanica", "label": "Formação savânica",
         "areaHa": round(rvn * 0.35, 2), "fonte": "satelite"},
        {"classe": "campo", "label": "Campo",
         "areaHa": round(rvn * 0.20, 2), "fonte": "satelite"},
        {"classe": "agua", "label": "Água / APP",
         "areaHa": round(agua, 2), "fonte": "satelite"},
    ]


def build_geo_layers(gj):
    """FeatureCollection com tipo canônico (§5). Mantém tipoRaw p/ auditoria."""
    feats = []
    for f in gj["features"]:
        raw = f["properties"].get("tipo")
        feats.append({
            "type": "Feature",
            "properties": {
                "tipo": to_canon(raw),
                "tipoRaw": raw,
                "areaHa": f["properties"].get("area_ha"),
            },
            "geometry": f["geometry"],
        })
    return {"type": "FeatureCollection", "features": feats}


def perimeter_geometry(gj):
    """Geometria do perímetro p/ coluna geom: prefere AREA_IMOVEL, senão AREA_IMOVEL_LIQUIDA."""
    by = {f["properties"].get("tipo"): f["geometry"] for f in gj["features"]}
    for key in ("AREA_IMOVEL", "AREA_IMOVEL_LIQUIDA"):
        if key in by and by[key]:
            return by[key]
    # fallback: primeiro polígono
    for f in gj["features"]:
        if f["geometry"]["type"] in ("Polygon", "MultiPolygon"):
            return f["geometry"]
    return None


def main():
    lines = []
    w = lines.append
    w("-- GERADO por db/seed/build_seed_sql.py — NÃO editar à mão.")
    w("-- Fonte: data/raw/ (demonstrativos = gabarito oficial; geojson = geometria EPSG:4674).")
    w("-- Fórmula de score/déficit: contrato docs/07_contrato_mvp.md §6.")
    w("")
    w("BEGIN;")
    w("")
    w("-- 1) usuário mock (gov.br) ---------------------------------------------")
    w("INSERT INTO usuario (id, cpf, nome, confiabilidade) VALUES")
    w("  (1, '***.***.***-**', 'João C.', 'ouro');")
    w("")

    report = []
    for i, d in enumerate(DEMOS, start=1):
        cod = d["cod"]
        demo = load_demonstrativo(cod)
        gj = load_geojson(cod)
        cab = demo["demonstrativo"]["cabecalho"]
        areas = demo["demonstrativo"]["areas"]
        area_ha = areas["areaLiquida"]
        diag = compute_diag(areas, area_ha)
        cob = build_coberturas(areas)
        geo = build_geo_layers(gj)
        geom = perimeter_geometry(gj)

        report.append((cod, diag, area_ha))

        geo_json = json.dumps(geo, ensure_ascii=False)
        geom_json = json.dumps(geom, ensure_ascii=False)
        cob_json = json.dumps(cob, ensure_ascii=False)

        w(f"-- 2.{i}) propriedade {cod[:13]} ({d['papel']}) ---------------------")
        w("INSERT INTO propriedade")
        w("  (id, cod_imovel, usuario_id, nome, municipio, uf, bioma, area_ha, status, origem, geom, geo_layers)")
        w("VALUES (")
        w(f"  {i}, {q(cod)}, 1, {q(demo['meta']['nome'])}, {q(cab['municipio'])}, {q(cab['estado'])},")
        w(f"  {q(d['bioma'])}, {num(area_ha)}, {q(demo['meta']['statusImovel'])}, 'consulta_rapida',")
        w(f"  ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON({q(geom_json)}), 4674)),")
        w(f"  {q(geo_json)}::jsonb")
        w(");")
        w("")
        w(f"INSERT INTO diagnostico")
        w("  (propriedade_id, rl_exigida_ha, rl_real_ha, app_ha, app_recompor_ha,")
        w("   area_consolidada_ha, deficit_ha, excedente_ha, situacao, score, coberturas, texto_ia)")
        w("VALUES (")
        w(f"  {i}, {num(diag['rl_exigida_ha'])}, {num(diag['rl_real_ha'])}, {num(diag['app_ha'])}, {num(diag['app_recompor_ha'])},")
        w(f"  {num(diag['area_consolidada_ha'])}, {num(diag['deficit_ha'])}, {num(diag['excedente_ha'])}, {q(diag['situacao'])}, {diag['score']},")
        w(f"  {q(cob_json)}::jsonb,")
        w(f"  {q(TEXTO_IA[cod])}")
        w(");")
        w("")

    w("-- 3) pendências oficiais de CE-2313302 (.RET / Análise Completa) -------")
    w("--    propriedade_id = 3 (CE-2313302), origem 'oficial'.")
    w("INSERT INTO pendencia (propriedade_id, tipo, gravidade, descricao, origem) VALUES")
    w("  (3, 'reserva_legal', 'alerta',")
    w("   'Reserva Legal a recompor: aproximadamente 1,79 ha (área proposta ainda não consolidada como vegetação nativa).',")
    w("   'oficial'),")
    w("  (3, 'app', 'alerta',")
    w("   'APP a recompor: aproximadamente 2,15 ha em faixa de curso de água.',")
    w("   'oficial');")
    w("")

    w("-- 4) ofertas do marketplace (contrato §7 / baseOffers) -----------------")
    w("INSERT INTO oferta")
    w("  (propriedade_id, tipo_oferta, area_ha, bioma, valor, unidade, prazo_meses, municipio, uf, distancia_km, status)")
    w("VALUES")
    rows = []
    for (tp, area, bioma, valor, unidade, prazo, mun, uf, dist) in OFERTAS:
        prazo_sql = "NULL" if prazo is None else str(prazo)
        rows.append(
            f"  (NULL, {q(tp)}, {num(area)}, {q(bioma)}, {num(valor, 2)}, {q(unidade)}, "
            f"{prazo_sql}, {q(mun)}, {q(uf)}, {dist}, 'ativa')"
        )
    w(",\n".join(rows) + ";")
    w("")

    w("-- 5) ressincroniza as sequences (inserimos ids fixos) ------------------")
    w("SELECT setval('usuario_id_seq', (SELECT MAX(id) FROM usuario));")
    w("SELECT setval('propriedade_id_seq', (SELECT MAX(id) FROM propriedade));")
    w("SELECT setval('diagnostico_id_seq', (SELECT MAX(id) FROM diagnostico));")
    w("SELECT setval('oferta_id_seq', (SELECT MAX(id) FROM oferta));")
    w("SELECT setval('pendencia_id_seq', (SELECT MAX(id) FROM pendencia));")
    w("")
    w("COMMIT;")
    w("")

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    # ---- relatório p/ a equipe -------------------------------------------
    print("seed.sql gerado em:", OUT)
    print("\n=== Números calculados (§6) — conferir contra os demonstrativos ===")
    print(f"{'cod_imovel':16} {'area':>9} {'RLexig':>8} {'RLreal':>8} {'deficit':>8} {'exced':>7} {'situacao':>10} {'score':>5}")
    for cod, dg, area in report:
        print(f"{cod[:16]:16} {area:>9.2f} {dg['rl_exigida_ha']:>8.2f} {dg['rl_real_ha']:>8.2f} "
              f"{dg['deficit_ha']:>8.2f} {dg['excedente_ha']:>7.2f} {dg['situacao']:>10} {dg['score']:>5}")


if __name__ == "__main__":
    main()
