import AdmZip from 'adm-zip';
import {
  biomaPercent,
  biomaPorUf,
  canonicalGeoTipo,
  computeScore,
} from '../common/mappers';

/**
 * Parse an uploaded `.RET` / `.CAR` file. The file is a ZIP of:
 *  - a main JSON named after the CAR code (keys: imovel, geo[], informacoes...)
 *  - BD.bak (cadastro JSON), info.info (first-registration date)
 * Each geo[] item is `{ tipo, area, geoJson }` with standard GeoJSON geometry.
 * See docs/04_ambiente_teste_api_e_formato.md.
 */

export interface ParsedRet {
  codImovel: string;
  nome: string | null;
  municipio: string | null;
  uf: string | null;
  bioma: string;
  areaHa: number;
  geo: { type: 'FeatureCollection'; features: any[] };
  diagnostico: {
    rlExigidaHa: number;
    rlRealHa: number;
    appHa: number;
    appRecomporHa: number;
    areaConsolidadaHa: number;
    deficitHa: number;
    excedenteHa: number;
    situacao: string;
    score: number;
  };
  pendencias: { tipo: string; gravidade: string; descricao: string }[];
}

const CAR_CODE_RE = /^[A-Z]{2}-\d+-[0-9A-F]+$/i;

export function parseRet(buffer: Buffer): ParsedRet {
  let zip: AdmZip;
  try {
    zip = new AdmZip(buffer);
  } catch {
    throw new Error('Arquivo inválido: não é um ZIP/.RET legível.');
  }

  const entries = zip.getEntries();
  const mainEntry =
    entries.find((e) => CAR_CODE_RE.test(e.entryName)) ??
    entries.find(
      (e) => !e.entryName.endsWith('.bak') && !e.entryName.endsWith('.info'),
    );
  if (!mainEntry) {
    throw new Error('Arquivo .RET sem JSON principal do CAR.');
  }

  let main: any;
  try {
    main = JSON.parse(mainEntry.getData().toString('utf8'));
  } catch {
    throw new Error('JSON principal do .RET corrompido.');
  }

  const imovel = main.imovel ?? {};
  const geoItems: any[] = Array.isArray(main.geo) ? main.geo : [];

  const areaByTipo = (tipo: string): number => {
    const item = geoItems.find((g) => g.tipo === tipo);
    return item ? Number(item.area) || 0 : 0;
  };

  // Build canonical FeatureCollection (contract §5).
  const features = geoItems
    .filter((g) => g.geoJson)
    .map((g) => ({
      type: 'Feature',
      properties: {
        tipo: canonicalGeoTipo(g.tipo),
        areaHa: Number(g.area) || 0,
      },
      geometry: g.geoJson,
    }));

  const uf: string | null = imovel.siglaEstado ?? null;
  const bioma = biomaPorUf(uf);

  const areaHa = areaByTipo('AREA_IMOVEL') || Number(main.areaTotalImovelDocumental) || 0;
  // RL exigida = regra legal (% do bioma × área) — mesma definição do seed/§6,
  // não a soma proposta+recompor (que superestimava e divergia do score do seed).
  const rlExigidaHa = areaHa * biomaPercent(bioma);
  // ARL_A_RECUPERAR é o déficit oficial do SICAR; dele inferimos a RL real
  // (vegetação nativa reconhecida na RL) de forma consistente com o seed.
  const recomporRl = areaByTipo('ARL_A_RECUPERAR');
  const rlRealHa = Math.max(0, rlExigidaHa - recomporRl);
  const appHa = areaByTipo('APP_TOTAL');
  const appRecomporHa = areaByTipo('APP_VAZIO');
  const areaConsolidadaHa = areaByTipo('AREA_CONSOLIDADA');

  const { score, deficitHa, excedenteHa, situacao } = computeScore({
    rlExigidaHa,
    rlRealHa,
    appRecomporHa,
    areaHa,
  });

  const pendencias: ParsedRet['pendencias'] = [];
  if (recomporRl > 0.05) {
    pendencias.push({
      tipo: 'reserva_legal',
      gravidade: 'alerta',
      descricao: `Reserva Legal a recompor: ${recomporRl.toFixed(2)} ha.`,
    });
  }
  if (appRecomporHa > 0.05) {
    pendencias.push({
      tipo: 'app',
      gravidade: 'alerta',
      descricao: `Área de Preservação Permanente a recompor: ${appRecomporHa.toFixed(2)} ha.`,
    });
  }
  if (pendencias.length === 0) {
    pendencias.push({
      tipo: 'reserva_legal',
      gravidade: 'ok',
      descricao: 'Sem pendências de Reserva Legal ou APP identificadas no arquivo.',
    });
  }

  return {
    codImovel: imovel.protocoloCAR || mainEntry.entryName,
    nome: imovel.nome ?? null,
    municipio: imovel.nomeMunicipio ?? null,
    uf,
    bioma,
    areaHa,
    geo: { type: 'FeatureCollection', features },
    diagnostico: {
      rlExigidaHa,
      rlRealHa,
      appHa,
      appRecomporHa,
      areaConsolidadaHa,
      deficitHa,
      excedenteHa,
      situacao,
      score,
    },
    pendencias,
  };
}
