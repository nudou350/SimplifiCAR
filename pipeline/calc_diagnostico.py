"""
calc_diagnostico.py — calcula o diagnóstico (déficit/excedente/situação/score) de um
imóvel arbitrário, com a fórmula AUTORITATIVA do contrato docs/07_contrato_mvp.md §6.

É a mesma matemática usada em db/seed/build_seed_sql.py e validada em proof_chain.py:
  rl_real = vegetação nativa dentro do polígono de RL (MapBiomas)  [proof_chain.py]
  rl_exig = area_imovel * %RL_do_bioma
  déficit/excedente/score -> §6.

Dois modos:
  1) A partir de um demonstrativo oficial (gabarito), por código:
       python pipeline/calc_diagnostico.py --cod MG-3127008-6CAD429ED6934E68818CD3FC21D797A6
  2) A partir de números crus (quando vier do pipeline geo, sem demonstrativo):
       python pipeline/calc_diagnostico.py --area 100 --rl-exigida 20 --rl-real 12 \
              --app-recompor 1.5 --app 3

Imprime JSON pronto p/ inspeção / ingestão.
"""
import argparse
import glob
import json
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RAW = os.path.join(ROOT, "data", "raw")

# % de Reserva Legal por bioma (Código Florestal, fora da Amazônia Legal = 20%).
PCT_RL_POR_BIOMA = {
    "Amazônia": 0.80, "Cerrado": 0.20, "Mata Atlântica": 0.20,
    "Caatinga": 0.20, "Pampa": 0.20, "Pantanal": 0.20,
}


def diagnostico(area_ha, rl_exigida_ha, rl_real_ha, app_ha=0.0, app_recompor_ha=0.0,
                area_consolidada_ha=0.0):
    """Fórmula autoritativa do contrato §6. Retorna dict com todos os campos do diagnóstico."""
    deficit = max(0.0, rl_exigida_ha - rl_real_ha)
    excedente = max(0.0, rl_real_ha - rl_exigida_ha)

    rl_ratio = 1.0 if rl_exigida_ha <= 0 else min(1.0, rl_real_ha / rl_exigida_ha)
    app_pen = 0.0 if app_recompor_ha <= 0 else min(0.30, app_recompor_ha / max(0.5, area_ha * 0.10))
    score = round(max(0.0, min(100.0, 100 * (0.75 * rl_ratio + 0.25) - 100 * app_pen)))

    if deficit > 0.05:
        situacao = "deficit"
    elif excedente > 0.05:
        situacao = "excedente"
    else:
        situacao = "em_dia"

    faixa = "Em dia" if score >= 80 else "Com pendências" if score >= 50 else "Irregular"

    return {
        "rl_exigida_ha": round(rl_exigida_ha, 4),
        "rl_real_ha": round(rl_real_ha, 4),
        "app_ha": round(app_ha, 4),
        "app_recompor_ha": round(app_recompor_ha, 4),
        "area_consolidada_ha": round(area_consolidada_ha, 4),
        "deficit_ha": round(deficit, 4),
        "excedente_ha": round(excedente, 4),
        "situacao": situacao,
        "score": int(score),
        "faixa": faixa,
    }


def from_demonstrativo(cod):
    """Lê data/raw/demonstrativos/<cod>.json e aplica o mapeamento de campos do §7."""
    hits = glob.glob(os.path.join(RAW, "demonstrativos", cod + "*.json"))
    if not hits:
        raise FileNotFoundError("demonstrativo não encontrado para " + cod)
    demo = json.load(open(hits[0], encoding="utf-8"))
    a = demo["demonstrativo"]["areas"]
    return diagnostico(
        area_ha=a["areaLiquida"],
        rl_exigida_ha=a["areaRLMinimaExigidaLei"],
        rl_real_ha=a["areaRLVetorizadaSobrepostaRVN"],
        app_ha=a.get("areaAPP", 0.0),
        app_recompor_ha=a.get("areaAPPRecompor", 0.0),
        area_consolidada_ha=a.get("areaUsoConsolidado", 0.0),
    )


def main():
    p = argparse.ArgumentParser(description="Diagnóstico CAR (contrato §6).")
    p.add_argument("--cod", help="cod_imovel (usa o demonstrativo oficial como fonte)")
    p.add_argument("--area", type=float, help="área do imóvel (ha)")
    p.add_argument("--bioma", help="bioma (deriva %%RL se --rl-exigida não for dado)")
    p.add_argument("--rl-exigida", type=float)
    p.add_argument("--rl-real", type=float)
    p.add_argument("--app", type=float, default=0.0)
    p.add_argument("--app-recompor", type=float, default=0.0)
    p.add_argument("--area-consolidada", type=float, default=0.0)
    args = p.parse_args()

    if args.cod:
        out = from_demonstrativo(args.cod)
    else:
        if args.area is None or args.rl_real is None:
            p.error("informe --cod, ou (--area e --rl-real [+ --rl-exigida | --bioma]).")
        rl_exig = args.rl_exigida
        if rl_exig is None:
            pct = PCT_RL_POR_BIOMA.get(args.bioma)
            if pct is None:
                p.error("informe --rl-exigida ou um --bioma válido: " + ", ".join(PCT_RL_POR_BIOMA))
            rl_exig = args.area * pct
        out = diagnostico(args.area, rl_exig, args.rl_real, args.app,
                          args.app_recompor, args.area_consolidada)

    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
