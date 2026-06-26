import { IsInt, IsOptional } from 'class-validator';

export class CreateMatchDto {
  @IsInt()
  ofertaId: number;

  @IsOptional()
  @IsInt()
  propriedadeDemandanteId?: number;
}
