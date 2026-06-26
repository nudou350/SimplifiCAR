import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DiagnosticoResponse, mapDiagnostico } from '../common/mappers';

@Injectable()
export class DiagnosticosService {
  constructor(private readonly db: DatabaseService) {}

  /** GET /diagnosticos/:propriedadeId (contract §4.2). 404 if none. */
  async findByPropriedadeId(propriedadeId: number): Promise<DiagnosticoResponse> {
    const result = await this.db.query(
      `SELECT * FROM diagnostico
        WHERE propriedade_id = $1
        ORDER BY criado_em DESC, id DESC
        LIMIT 1`,
      [propriedadeId],
    );
    if (result.rowCount === 0) {
      throw new NotFoundException(
        `Diagnóstico para propriedade ${propriedadeId} não encontrado.`,
      );
    }
    return mapDiagnostico(result.rows[0]);
  }

  /**
   * POST /diagnosticos/:id/retificacao (contract §4.8).
   * Templates a plain-text minuta + checklist from the stored numbers.
   * No live LLM — deterministic text from the diagnostic figures.
   */
  async gerarRetificacao(propriedadeId: number) {
    // `:id` em /diagnosticos/* é o propriedade_id (consistente com §4.2 e o front).
    // Pega o diagnóstico mais recente da propriedade.
    const result = await this.db.query(
      `SELECT d.*, p.cod_imovel, p.nome AS prop_nome, p.municipio, p.uf, p.bioma, p.area_ha
         FROM diagnostico d
         JOIN propriedade p ON p.id = d.propriedade_id
        WHERE d.propriedade_id = $1
        ORDER BY d.criado_em DESC, d.id DESC
        LIMIT 1`,
      [propriedadeId],
    );
    if (result.rowCount === 0) {
      throw new NotFoundException(
        `Diagnóstico para propriedade ${propriedadeId} não encontrado.`,
      );
    }
    const r = result.rows[0];
    const n = (v: unknown) => Number(v ?? 0);
    const fmt = (v: unknown) => n(v).toFixed(2).replace('.', ',');

    const deficit = n(r.deficit_ha);
    const appRecompor = n(r.app_recompor_ha);

    const itens: string[] = [
      `Confirmar o perímetro do imóvel ${r.cod_imovel} (${fmt(r.area_ha)} ha).`,
      `Reserva Legal exigida: ${fmt(r.rl_exigida_ha)} ha; vegetação nativa em RL hoje: ${fmt(r.rl_real_ha)} ha.`,
    ];
    if (deficit > 0.05) {
      itens.push(
        `Recompor ou compensar ${fmt(r.deficit_ha)} ha de Reserva Legal (recomposição, regeneração ou CRA/servidão).`,
      );
    }
    if (appRecompor > 0.05) {
      itens.push(
        `Recompor ${fmt(r.app_recompor_ha)} ha de Área de Preservação Permanente (APP).`,
      );
    }
    if (deficit <= 0.05 && appRecompor <= 0.05) {
      itens.push('Nenhum passivo de RL ou APP a recompor — apenas confirmar a vetorização.');
    }
    itens.push('Anexar vetores corrigidos (RL e APP) e reenviar a retificação na Central do CAR.');

    const situacaoTxt =
      r.situacao === 'deficit'
        ? `apresenta um déficit de ${fmt(r.deficit_ha)} ha de Reserva Legal`
        : r.situacao === 'excedente'
          ? `apresenta um excedente de ${fmt(r.excedente_ha)} ha de Reserva Legal`
          : 'encontra-se em conformidade quanto à Reserva Legal';

    const minuta =
      `MINUTA DE RETIFICAÇÃO DO CADASTRO AMBIENTAL RURAL\n\n` +
      `Imóvel: ${r.prop_nome ?? r.cod_imovel} (CAR ${r.cod_imovel}), ` +
      `${r.municipio ?? '—'}/${r.uf ?? '—'}, bioma ${r.bioma ?? 'não informado'}.\n` +
      `Área total: ${fmt(r.area_ha)} ha. Score de conformidade: ${n(r.score)}/100.\n\n` +
      `Com base no diagnóstico, o imóvel ${situacaoTxt}. ` +
      `A presente minuta propõe a retificação do cadastro para refletir a situação ambiental ` +
      `e indicar o caminho de regularização perante o Código Florestal (Lei 12.651/2012).\n\n` +
      `Providências sugeridas:\n` +
      itens.map((it, i) => `  ${i + 1}. ${it}`).join('\n') +
      `\n\nEste documento é um rascunho gerado automaticamente a partir dos números do ` +
      `diagnóstico e deve ser revisado por um responsável técnico antes do envio.`;

    return { minuta, itens };
  }
}
