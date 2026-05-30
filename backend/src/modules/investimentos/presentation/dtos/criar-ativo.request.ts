import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import type { TipoAtivo } from '@financas-pessoais/shared';

export class CriarAtivoRequest {
  @IsIn(['FUNDO', 'ACAO', 'FII'])
  tipo!: TipoAtivo;

  @IsString()
  @MaxLength(80)
  descricao!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  quantidade?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorUnitario?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorBruto?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rendimento?: number;
}
