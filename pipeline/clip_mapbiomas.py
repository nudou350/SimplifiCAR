"""
Recorta um GeoTIFF nacional do MapBiomas (COG público no Google Cloud Storage)
para um bounding box, lendo apenas a janela via /vsicurl (sem baixar o arquivo
nacional inteiro de ~800 MB). Sem Google Earth Engine, sem autenticação.

Uso:
    python clip_mapbiomas.py            # recorta o DF (padrão), Coleção 10 / 2024
    python clip_mapbiomas.py --bbox -48.35 -16.10 -47.25 -15.45 --out data/mapbiomas/DF.tif

Classes de vegetação nativa (Coleção 9/10): 3,4,5,6,49,11,12,32,29,13,50.
"""
import argparse, os
import rasterio
from rasterio.windows import from_bounds

# COG nacional público (range-requests). Ver data/mapbiomas/README.md.
URLS = {
    ("10", "2024"): "https://storage.googleapis.com/mapbiomas-public/initiatives/brasil/collection_10/lulc/coverage/brazil_coverage_2024.tif",
    ("10", "2023"): "https://storage.googleapis.com/mapbiomas-public/initiatives/brasil/collection_10/lulc/coverage/brazil_coverage_2023.tif",
    ("9",  "2023"): "https://storage.googleapis.com/mapbiomas-public/initiatives/brasil/collection_9/lclu/coverage/brasil_coverage_2023.tif",
}

def main():
    ap = argparse.ArgumentParser()
    # DF bbox (EPSG:4326): left bottom right top
    ap.add_argument("--bbox", nargs=4, type=float, default=[-48.35, -16.10, -47.25, -15.45])
    ap.add_argument("--collection", default="10")
    ap.add_argument("--year", default="2024")
    ap.add_argument("--out", default="data/mapbiomas/DF_mapbiomas_col10_2024.tif")
    a = ap.parse_args()

    url = URLS[(a.collection, a.year)]
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    left, bottom, right, top = a.bbox

    # acelera leitura por HTTP range
    env = rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",
                       CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif",
                       GDAL_HTTP_MULTIRANGE="YES", GDAL_HTTP_MERGE_CONSECUTIVE_RANGES="YES")
    with env, rasterio.open("/vsicurl/" + url) as src:
        print("fonte:", src.width, "x", src.height, src.crs, "dtype", src.dtypes[0])
        win = from_bounds(left, bottom, right, top, transform=src.transform)
        data = src.read(1, window=win)
        prof = src.profile.copy()
        prof.update(height=data.shape[0], width=data.shape[1],
                    transform=src.window_transform(win),
                    compress="deflate", predictor=2, tiled=True,
                    blockxsize=256, blockysize=256)
        with rasterio.open(a.out, "w", **prof) as dst:
            dst.write(data, 1)
    print("salvo:", a.out, "->", data.shape, "px")

if __name__ == "__main__":
    main()
