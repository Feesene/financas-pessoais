import {
  IsIn,
  IsInt,
  IsOptional,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import type { TipoLancamento } from '@financas-pessoais/shared';

const COMPETENCIA = /^\d{4}-(0[1-9]|1[0-2])$/;

export class CriarRegraRequest {
  @IsIn(['RECEITA', 'DESPESA'])
  tipo!: TipoLancamento;

  @IsString()
  categoriaId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descricao?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valorBase?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valorTotal?: number;

  @Matches(COMPETENCIA, { message: 'competenciaInicio deve estar no formato AAAA-MM' })
  competenciaInicio!: string;

  @IsOptional()
  @Matches(COMPETENCIA, { message: 'competenciaFim deve estar no formato AAAA-MM' })
  competenciaFim?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  numeroParcelas?: number | null;
}
