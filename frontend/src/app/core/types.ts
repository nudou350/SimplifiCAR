// Typed mirror of the frozen MVP contract (docs/07_contrato_mvp.md §4-§5).
// All response fields are camelCase, exactly as the backend emits them.

export type GeoTipo =
  | 'perimetro'
  | 'consolidada'
  | 'reserva_legal'
  | 'app'
  | 'vegetacao'
  | 'deficit_rl'
  | 'sede'
  | string;

export interface GeoFeature {
  type: 'Feature';
  geometry: { type: string; coordinates: unknown };
  properties: { tipo: GeoTipo; areaHa?: number; [k: string]: unknown };
}

export interface GeoFeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

export type Fonte = 'declarado' | 'satelite' | 'calculado' | string;

export interface Cobertura {
  classe: string;
  label: string;
  areaHa: number;
  fonte: Fonte;
}

export type Situacao = 'deficit' | 'excedente' | 'em_dia';

export interface Diagnostico {
  propriedadeId: number;
  rlExigidaHa: number;
  rlRealHa: number;
  appHa: number;
  appRecomporHa: number;
  areaConsolidadaHa: number;
  deficitHa: number;
  excedenteHa: number;
  situacao: Situacao;
  score: number;
  coberturas: Cobertura[];
  textoIa: string;
}

export interface Pendencia {
  tipo: string;
  gravidade: 'alerta' | 'ok' | string;
  descricao: string;
}

export interface Propriedade {
  codImovel: string;
  nome: string;
  municipio: string;
  uf: string;
  bioma: string;
  areaHa: number;
  status: string;
  geo: GeoFeatureCollection;
  diagnostico: Diagnostico;
  pendencias?: Pendencia[];
}

export type TipoOferta = 'venda' | 'arrendamento';

export interface Oferta {
  id: number;
  tipoOferta: TipoOferta;
  areaHa: number;
  bioma: string;
  valor: number;
  unidade: string;
  prazoMeses?: number;
  municipio: string;
  uf: string;
  distanciaKm: number;
  status: 'ativa' | 'casada' | string;
  compativel: boolean;
}

export interface MatchResponse {
  matchId: number;
  status: 'proposto' | 'fechado' | string;
}

export interface AuthResponse {
  token: string;
  usuario: { id: number; nome: string; cpf: string; confiabilidade: string };
}

export interface RetificacaoResponse {
  minuta: string;
  itens: string[];
}
