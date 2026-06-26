import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { mapPropriedade } from '../common/mappers';
import { parseRet } from './ret-parser';

@Injectable()
export class PropriedadesService {
  constructor(private readonly db: DatabaseService) {}

  /** GET /propriedades/:codImovel (contract §4.1). 404 if missing. */
  async findByCodImovel(codImovel: string) {
    const propResult = await this.db.query(
      `SELECT id, cod_imovel, nome, municipio, uf, bioma, area_ha, status, origem, geo_layers
         FROM propriedade
        WHERE cod_imovel = $1
        LIMIT 1`,
      [codImovel],
    );
    if (propResult.rowCount === 0) {
      throw new NotFoundException(`Imóvel ${codImovel} não encontrado.`);
    }
    const prop = propResult.rows[0];

    const diagResult = await this.db.query(
      `SELECT * FROM diagnostico
        WHERE propriedade_id = $1
        ORDER BY criado_em DESC, id DESC
        LIMIT 1`,
      [prop.id],
    );
    const diag = (diagResult.rowCount ?? 0) > 0 ? diagResult.rows[0] : null;

    return mapPropriedade(prop, diag);
  }

  /** POST /propriedades/upload (contract §4.7). Parses .RET, persists, returns §4.1 + pendencias. */
  async uploadRet(buffer: Buffer) {
    const parsed = parseRet(buffer);

    const persisted = await this.db.withTransaction(async (client) => {
      const propRes = await client.query(
        `INSERT INTO propriedade
           (cod_imovel, nome, municipio, uf, bioma, area_ha, status, origem, geo_layers)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'analise_completa',$8)
         ON CONFLICT (cod_imovel) DO UPDATE SET
           nome = EXCLUDED.nome,
           municipio = EXCLUDED.municipio,
           uf = EXCLUDED.uf,
           bioma = EXCLUDED.bioma,
           area_ha = EXCLUDED.area_ha,
           origem = 'analise_completa',
           geo_layers = EXCLUDED.geo_layers
         RETURNING id, cod_imovel, nome, municipio, uf, bioma, area_ha, status, origem, geo_layers`,
        [
          parsed.codImovel,
          parsed.nome,
          parsed.municipio,
          parsed.uf,
          parsed.bioma, // derivado por UF (mappers.biomaPorUf)
          parsed.areaHa,
          'Pendente',
          JSON.stringify(parsed.geo),
        ],
      );
      const prop = propRes.rows[0];

      // Refresh diagnostico + official pendencias for this property.
      await client.query(`DELETE FROM diagnostico WHERE propriedade_id = $1`, [prop.id]);
      await client.query(
        `DELETE FROM pendencia WHERE propriedade_id = $1 AND origem = 'oficial'`,
        [prop.id],
      );

      const d = parsed.diagnostico;
      const diagRes = await client.query(
        `INSERT INTO diagnostico
           (propriedade_id, rl_exigida_ha, rl_real_ha, app_ha, app_recompor_ha,
            area_consolidada_ha, deficit_ha, excedente_ha, situacao, score, coberturas, texto_ia)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING *`,
        [
          prop.id,
          d.rlExigidaHa,
          d.rlRealHa,
          d.appHa,
          d.appRecomporHa,
          d.areaConsolidadaHa,
          d.deficitHa,
          d.excedenteHa,
          d.situacao,
          d.score,
          JSON.stringify([]),
          'Diagnóstico gerado a partir do arquivo .CAR enviado (Análise Completa).',
        ],
      );

      for (const p of parsed.pendencias) {
        await client.query(
          `INSERT INTO pendencia (propriedade_id, tipo, gravidade, descricao, origem)
           VALUES ($1,$2,$3,$4,'oficial')`,
          [prop.id, p.tipo, p.gravidade, p.descricao],
        );
      }

      return { prop, diag: diagRes.rows[0] };
    });

    return {
      ...mapPropriedade(persisted.prop, persisted.diag),
      pendencias: parsed.pendencias,
    };
  }
}
