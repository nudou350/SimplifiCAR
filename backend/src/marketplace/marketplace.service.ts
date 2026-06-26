import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { mapOferta } from '../common/mappers';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { CreateMatchDto } from './dto/create-match.dto';

@Injectable()
export class MarketplaceService {
  constructor(private readonly db: DatabaseService) {}

  /** GET /marketplace/ofertas?tipo=&bioma= (contract §4.4). */
  async listOfertas(tipo?: string, bioma?: string) {
    const filters: string[] = [];
    const params: any[] = [];
    if (tipo) {
      params.push(tipo);
      filters.push(`tipo_oferta = $${params.length}`);
    }
    if (bioma) {
      params.push(bioma);
      filters.push(`bioma = $${params.length}`);
    }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const result = await this.db.query(
      `SELECT * FROM oferta ${where} ORDER BY id ASC`,
      params,
    );

    // compativel = same bioma as the demanding property (demo default: Cerrado).
    const biomaAlvo = bioma ?? 'Cerrado';
    return result.rows.map((row) => ({
      ...mapOferta(row),
      compativel: row.bioma === biomaAlvo,
    }));
  }

  /** POST /marketplace/ofertas (contract §4.5). */
  async createOferta(dto: CreateOfertaDto) {
    const result = await this.db.query(
      `INSERT INTO oferta
         (propriedade_id, tipo_oferta, area_ha, bioma, valor, unidade, prazo_meses,
          municipio, uf, distancia_km, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'ativa')
       RETURNING *`,
      [
        dto.propriedadeId ?? null,
        dto.tipoOferta,
        dto.areaHa,
        dto.bioma,
        dto.valor,
        dto.unidade ?? (dto.tipoOferta === 'venda' ? '' : '/ano'),
        dto.prazoMeses ?? null,
        dto.municipio ?? null,
        dto.uf ?? null,
        dto.distanciaKm ?? null,
      ],
    );
    return mapOferta(result.rows[0]);
  }

  /** POST /marketplace/match (contract §4.6). Marks the oferta 'casada'. */
  async createMatch(dto: CreateMatchDto) {
    return this.db.withTransaction(async (client) => {
      const ofertaRes = await client.query(
        `SELECT id, status FROM oferta WHERE id = $1 LIMIT 1`,
        [dto.ofertaId],
      );
      if (ofertaRes.rowCount === 0) {
        throw new NotFoundException(`Oferta ${dto.ofertaId} não encontrada.`);
      }

      const matchRes = await client.query(
        `INSERT INTO match (oferta_id, propriedade_demandante_id, status)
         VALUES ($1,$2,'proposto')
         RETURNING id, status`,
        [dto.ofertaId, dto.propriedadeDemandanteId ?? null],
      );

      await client.query(`UPDATE oferta SET status = 'casada' WHERE id = $1`, [
        dto.ofertaId,
      ]);

      return { matchId: matchRes.rows[0].id, status: matchRes.rows[0].status };
    });
  }
}
