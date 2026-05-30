import { IsIn, IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import type { TipoMovimentoReserva } from '@financas-pessoais/shared';

export class RegistrarMovimentoRequest {
  @IsIn(['APORTE', 'RETIRADA'])
  tipo!: TipoMovimentoReserva;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valor!: number;

  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'competencia deve estar no formato AAAA-MM' })
  competencia!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descricao?: string;
}
