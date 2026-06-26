import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateOfertaDto {
  @IsOptional()
  @IsInt()
  propriedadeId?: number;

  @IsIn(['venda', 'arrendamento'])
  tipoOferta: 'venda' | 'arrendamento';

  @IsNumber()
  @IsPositive()
  areaHa: number;

  @IsString()
  bioma: string;

  @IsNumber()
  @IsPositive()
  valor: number;

  @IsOptional()
  @IsString()
  unidade?: string;

  @IsOptional()
  @IsInt()
  prazoMeses?: number;

  @IsOptional()
  @IsString()
  municipio?: string;

  @IsOptional()
  @IsString()
  uf?: string;

  @IsOptional()
  @IsInt()
  distanciaKm?: number;
}
