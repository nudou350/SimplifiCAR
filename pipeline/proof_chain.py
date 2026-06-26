"""
Prova de conceito da cadeia de cálculo (Doc 2 §4) com dados 100% locais:
shapefile público do CAR (RL + imóvel) x raster MapBiomas -> RL real -> déficit/excedente.
Roda só para alguns imóveis do DF que caem dentro do recorte MapBiomas.
"""
import geopandas as gpd, numpy as np
from rasterstats import zonal_stats

RL_ZIP   = "zip://data/shapefiles/DF/RESERVA_LEGAL.zip"
IMV_ZIP  = "zip://data/shapefiles/DF/AREA_IMOVEL.zip"
TIF      = "data/mapbiomas/DF_mapbiomas_col10_2024.tif"
NATIVE   = [3,4,5,6,49,11,12,32,29,13,50]
PCT_RL   = 0.20            # DF = Cerrado fora da Amazônia Legal -> 20%
PX_HA    = 0.09           # 30m x 30m
BBOX     = (-48.35, -16.10, -47.25, -15.45)  # recorte MapBiomas (l,b,r,t)

print("lendo Reserva Legal...")
rl = gpd.read_file(RL_ZIP)
print("  colunas RL:", list(rl.columns)[:12])
codcol = next((c for c in rl.columns if c.lower() in ("cod_imovel","cod_imove","codigo")), rl.columns[0])

# só RL dentro do recorte
rl4326 = rl.to_crs(4326)
sel = rl4326.cx[BBOX[0]:BBOX[2], BBOX[1]:BBOX[3]].copy()
sel = sel[sel.geometry.notna() & ~sel.geometry.is_empty].head(5)
print(f"  {len(sel)} polígonos de RL no recorte (amostra)")

print("lendo Área do Imóvel (para área total)...")
imv = gpd.read_file(IMV_ZIP)
acol = next((c for c in imv.columns if c.lower() in ("num_area","numarea","area")), None)
icol = next((c for c in imv.columns if c.lower() in ("cod_imovel","cod_imove","codigo")), imv.columns[0])
area_by_cod = dict(zip(imv[icol], imv[acol])) if acol else {}

# RL real (vegetação nativa dentro do polígono de RL) via MapBiomas
stats = zonal_stats(sel.to_crs(4326), TIF, categorical=True, nodata=0, geojson_out=False)
sel_5880 = sel.to_crs(5880)

print("\n=== PROVA: RL exigida vs RL real (MapBiomas) por imóvel ===")
print(f"{'cod_imovel':45} {'area_im':>8} {'RLexig':>7} {'RLdecl':>7} {'RLreal':>7} {'situação':>10}")
for (idx, row), st in zip(sel.iterrows(), stats):
    cod = str(row[codcol])
    area_im = float(area_by_cod.get(row[codcol], np.nan))
    rl_decl = sel_5880.loc[idx].geometry.area/1e4          # área do polígono de RL (ha)
    rl_real = sum(c for k,c in st.items() if k in NATIVE)*PX_HA
    rl_exig = area_im*PCT_RL if area_im==area_im else float('nan')
    base = rl_exig if rl_exig==rl_exig else rl_decl
    situ = 'excedente' if rl_real>=base else 'DÉFICIT'
    print(f"{cod[:45]:45} {area_im:>8.1f} {rl_exig:>7.1f} {rl_decl:>7.1f} {rl_real:>7.1f} {situ:>10}")
print("\n(RLreal = vegetação nativa MapBiomas dentro do polígono de RL declarado)")
