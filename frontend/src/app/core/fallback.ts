// Offline polish fallback ONLY. Used behind a failed API call so the demo still
// renders if the backend is down. The API per contract (§4) is always the
// primary source; this is never consulted while the backend is reachable.
import { GeoFeatureCollection, Oferta, Propriedade } from './types';

// Small synthetic FeatureCollection with CANONICAL tipos (contract §5) so the
// Leaflet map still "acende" offline. Coordinates are EPSG:4674 (lng,lat).
function syntheticGeo(cx: number, cy: number, deficit: boolean): GeoFeatureCollection {
  const poly = (pts: number[][]) => ({
    type: 'Feature' as const,
    geometry: { type: 'Polygon', coordinates: [pts.map(([x, y]) => [cx + x, cy + y])] },
    properties: {},
  });
  const features: any[] = [
    { ...poly([[-0.05, -0.04], [0.05, -0.045], [0.06, 0.03], [-0.02, 0.05], [-0.06, 0.01]]), properties: { tipo: 'perimetro', areaHa: 62.59 } },
    { ...poly([[-0.04, -0.03], [0.02, -0.035], [0.0, 0.02], [-0.045, 0.0]]), properties: { tipo: 'consolidada', areaHa: 48.1 } },
    { ...poly([[0.02, -0.02], [0.055, 0.0], [0.045, 0.028], [0.015, 0.018]]), properties: { tipo: 'reserva_legal', areaHa: 13.2 } },
    { ...poly([[-0.05, 0.0], [-0.02, 0.045], [-0.01, 0.04], [-0.045, -0.005]]), properties: { tipo: 'app', areaHa: 2.4 } },
    { ...poly([[0.0, 0.02], [0.02, 0.018], [0.012, 0.04], [-0.005, 0.038]]), properties: { tipo: 'vegetacao', areaHa: 3.8 } },
  ];
  if (deficit) {
    features.push({ ...poly([[-0.025, -0.012], [0.012, -0.01], [0.008, 0.016], [-0.02, 0.012]]), properties: { tipo: 'deficit_rl', areaHa: 8.0 } });
  }
  return { type: 'FeatureCollection', features };
}

export function fallbackPropriedade(cod: string): Propriedade {
  const isExcedente = cod.startsWith('MG-3127008');
  if (isExcedente) {
    return {
      codImovel: cod,
      nome: 'Sítio Santa Fé (exemplo)',
      municipio: 'Fronteira',
      uf: 'MG',
      bioma: 'Cerrado',
      areaHa: 62.59,
      status: 'Ativo',
      geo: syntheticGeo(-49.2, -20.0, false),
      diagnostico: {
        propriedadeId: 1,
        rlExigidaHa: 12.52,
        rlRealHa: 13.2,
        appHa: 2.4,
        appRecomporHa: 0,
        areaConsolidadaHa: 48.1,
        deficitHa: 0,
        excedenteHa: 0.68,
        situacao: 'excedente',
        score: 88,
        coberturas: [
          { classe: 'consolidada', label: 'Área consolidada', areaHa: 48.1, fonte: 'declarado' },
          { classe: 'floresta', label: 'Formação florestal', areaHa: 6.2, fonte: 'satelite' },
          { classe: 'savanica', label: 'Formação savânica', areaHa: 3.8, fonte: 'satelite' },
          { classe: 'campo', label: 'Campo', areaHa: 2.1, fonte: 'satelite' },
          { classe: 'agua', label: 'Água / APP', areaHa: 2.4, fonte: 'satelite' },
        ],
        textoIa:
          'Boa notícia: sua Reserva Legal já cumpre o exigido pelo Código Florestal e ainda sobra mato. ' +
          'Esse excedente pode virar renda — você pode anunciar uma cota (CRA) ou alugar a reserva para um vizinho com déficit.',
      },
    };
  }
  // Déficit example (mirrors the mockup hero, serves any other CAR offline).
  return {
    codImovel: cod,
    nome: 'Sítio Boa Esperança (exemplo)',
    municipio: 'Luís Eduardo Magalhães',
    uf: 'BA',
    bioma: 'Cerrado',
    areaHa: 62.59,
    status: 'Pendente',
    geo: syntheticGeo(-45.8, -12.1, true),
    diagnostico: {
      propriedadeId: 2,
      rlExigidaHa: 12.52,
      rlRealHa: 4.52,
      appHa: 2.4,
      appRecomporHa: 1.2,
      areaConsolidadaHa: 48.1,
      deficitHa: 8.0,
      excedenteHa: 0,
      situacao: 'deficit',
      score: 62,
      coberturas: [
        { classe: 'consolidada', label: 'Área consolidada', areaHa: 48.1, fonte: 'declarado' },
        { classe: 'floresta', label: 'Formação florestal', areaHa: 6.2, fonte: 'satelite' },
        { classe: 'savanica', label: 'Formação savânica', areaHa: 3.8, fonte: 'satelite' },
        { classe: 'campo', label: 'Campo', areaHa: 2.1, fonte: 'satelite' },
        { classe: 'agua', label: 'Água / APP', areaHa: 2.4, fonte: 'satelite' },
      ],
      textoIa:
        'Falta mato equivalente a ~8 campos de futebol na sua Reserva Legal. ' +
        'Para regularizar você pode recuperar a área, comprar uma cota (CRA) ou alugar de um vizinho.',
    },
  };
}

// Seed offers from contract §7 (mockup baseOffers), camelCase per §4.4.
export function fallbackOfertas(): Oferta[] {
  const mk = (
    id: number,
    tipoOferta: 'venda' | 'arrendamento',
    areaHa: number,
    bioma: string,
    valor: number,
    unidade: string,
    municipio: string,
    uf: string,
    distanciaKm: number,
    prazoMeses?: number,
  ): Oferta => ({
    id,
    tipoOferta,
    areaHa,
    bioma,
    valor,
    unidade,
    prazoMeses,
    municipio,
    uf,
    distanciaKm,
    status: 'ativa',
    compativel: bioma === 'Cerrado',
  });
  return [
    mk(2, 'arrendamento', 8.0, 'Cerrado', 5800, '/ano', 'Barreiras', 'BA', 31, 240),
    mk(1, 'venda', 9.2, 'Cerrado', 38000, '', 'Riachão das Neves', 'BA', 42),
    mk(4, 'arrendamento', 6.5, 'Cerrado', 4900, '/ano', 'São Desidério', 'BA', 55, 180),
    mk(3, 'venda', 15.4, 'Cerrado', 61000, '', 'Formosa do Rio Preto', 'BA', 78),
    mk(5, 'venda', 40.0, 'Amazônia', 120000, '', 'Novo Progresso', 'PA', 1900),
    mk(6, 'arrendamento', 12.0, 'Mata Atlântica', 9000, '/ano', 'Sorocaba', 'SP', 2100, 120),
    // Caatinga: compatíveis com o déficit do CE-2313302 (Tauá/CE), p/ permitir "Casar".
    mk(7, 'venda', 4.5, 'Caatinga', 14000, '', 'Tauá', 'CE', 12),
    mk(8, 'arrendamento', 3.2, 'Caatinga', 1900, '/ano', 'Independência', 'CE', 28, 120),
    mk(9, 'venda', 6.0, 'Caatinga', 18500, '', 'Crateús', 'CE', 46),
  ];
}
