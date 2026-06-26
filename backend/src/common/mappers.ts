/**
 * Shared mapping helpers: snake_case DB rows -> camelCase contract shapes,
 * canonical geo-layer `tipo` mapping (contract §5) and the authoritative
 * score / situacao formula (contract §6).
 */

/** pg returns NUMERIC columns as strings; coerce to number (null-safe). */
export function num(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export interface DiagnosticoResponse {
  propriedadeId: number;
  rlExigidaHa: number;
  rlRealHa: number;
  appHa: number;
  appRecomporHa: number;
  areaConsolidadaHa: number;
  deficitHa: number;
  excedenteHa: number;
  situacao: string;
  score: number;
  coberturas: any[];
  textoIa: string | null;
}

/** Map a `diagnostico` DB row -> contract §4.1/§4.2 block. */
export function mapDiagnostico(row: any): DiagnosticoResponse {
  return {
    propriedadeId: row.propriedade_id,
    rlExigidaHa: num(row.rl_exigida_ha),
    rlRealHa: num(row.rl_real_ha),
    appHa: num(row.app_ha),
    appRecomporHa: num(row.app_recompor_ha),
    areaConsolidadaHa: num(row.area_consolidada_ha),
    deficitHa: num(row.deficit_ha),
    excedenteHa: num(row.excedente_ha),
    situacao: row.situacao,
    score: row.score === null || row.score === undefined ? 0 : Number(row.score),
    coberturas: row.coberturas ?? [],
    textoIa: row.texto_ia ?? null,
  };
}

/** Build the §4.1 propriedade response from a propriedade row + optional diagnostico. */
export function mapPropriedade(prop: any, diag: any | null) {
  return {
    codImovel: prop.cod_imovel,
    nome: prop.nome,
    municipio: prop.municipio,
    uf: prop.uf,
    bioma: prop.bioma,
    areaHa: num(prop.area_ha),
    status: prop.status,
    geo: prop.geo_layers ?? { type: 'FeatureCollection', features: [] },
    diagnostico: diag ? mapDiagnostico(diag) : null,
  };
}

/** Map an `oferta` DB row -> contract §4.4/§4.5 shape (without `compativel`). */
export function mapOferta(row: any) {
  return {
    id: row.id,
    propriedadeId: row.propriedade_id ?? null,
    tipoOferta: row.tipo_oferta,
    areaHa: num(row.area_ha),
    bioma: row.bioma,
    valor: num(row.valor),
    unidade: row.unidade ?? '',
    prazoMeses: row.prazo_meses ?? null,
    municipio: row.municipio,
    uf: row.uf,
    distanciaKm: row.distancia_km ?? null,
    status: row.status,
  };
}

/**
 * Canonical `tipo` for a raw SICAR geo-layer name (contract §5).
 * Used when parsing an uploaded `.RET` into the stored FeatureCollection.
 */
export function canonicalGeoTipo(raw: string): string {
  const map: Record<string, string> = {
    AREA_IMOVEL: 'perimetro',
    AREA_IMOVEL_LIQUIDA: 'perimetro',
    AREA_CONSOLIDADA: 'consolidada',
    RL_DECLARADA: 'reserva_legal',
    RESERVA_LEGAL: 'reserva_legal',
    ARL_PROPOSTA: 'reserva_legal',
    ARL_TOTAL: 'reserva_legal',
    VEGETACAO_NATIVA: 'vegetacao',
    ARL_A_RECUPERAR: 'deficit_rl',
    SEDE_IMOVEL: 'sede',
  };
  if (map[raw]) return map[raw];
  // Any APP*/RIO*/hidrografia layer is water/APP (contract §5).
  if (raw.startsWith('APP') || raw.startsWith('RIO') || raw.startsWith('HIDRO'))
    return 'app';
  return raw.toLowerCase();
}

/**
 * Bioma predominante por UF (aproximação p/ imóvel enviado na Análise Completa,
 * onde o `.RET` não traz o bioma). Um estado pode cobrir mais de um bioma; isto
 * é uma simplificação consciente do MVP. Casa com o seed dos imóveis-demo.
 */
const UF_BIOMA: Record<string, string> = {
  AC: 'Amazônia', AM: 'Amazônia', AP: 'Amazônia', PA: 'Amazônia',
  RO: 'Amazônia', RR: 'Amazônia', MT: 'Amazônia', TO: 'Amazônia', MA: 'Amazônia',
  CE: 'Caatinga', RN: 'Caatinga', PB: 'Caatinga', PE: 'Caatinga',
  AL: 'Caatinga', SE: 'Caatinga', PI: 'Caatinga', BA: 'Caatinga',
  GO: 'Cerrado', DF: 'Cerrado', MS: 'Cerrado', MG: 'Cerrado',
  PR: 'Mata Atlântica', SC: 'Mata Atlântica', RS: 'Mata Atlântica',
  SP: 'Mata Atlântica', RJ: 'Mata Atlântica', ES: 'Mata Atlântica',
};
export function biomaPorUf(uf: string | null | undefined): string {
  if (!uf) return 'Cerrado';
  return UF_BIOMA[uf.toUpperCase()] ?? 'Cerrado';
}

/** % de Reserva Legal exigido por bioma (Código Florestal; docs/05). */
export function biomaPercent(bioma: string): number {
  return bioma === 'Amazônia' ? 0.8 : 0.2;
}

export interface ScoreInputs {
  rlExigidaHa: number;
  rlRealHa: number;
  appRecomporHa: number;
  areaHa: number;
}

/** Authoritative score + situacao + deficit/excedente (contract §6). */
export function computeScore(i: ScoreInputs) {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const rlRatio = i.rlExigidaHa <= 0 ? 1 : Math.min(1, i.rlRealHa / i.rlExigidaHa);
  const appPen =
    i.appRecomporHa <= 0
      ? 0
      : Math.min(0.3, i.appRecomporHa / Math.max(0.5, i.areaHa * 0.1));
  const score = Math.round(
    clamp(100 * (0.75 * rlRatio + 0.25) - 100 * appPen, 0, 100),
  );

  const deficitHa = Math.max(0, i.rlExigidaHa - i.rlRealHa);
  const excedenteHa = Math.max(0, i.rlRealHa - i.rlExigidaHa);
  const situacao =
    deficitHa > 0.05 ? 'deficit' : excedenteHa > 0.05 ? 'excedente' : 'em_dia';

  return { score, deficitHa, excedenteHa, situacao };
}
