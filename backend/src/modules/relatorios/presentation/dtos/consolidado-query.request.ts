import { IsOptional, Matches } from 'class-validator';

export class ConsolidadoQueryRequest {
  @IsOptional()
  @Matches(/^\d{4}$/, { message: 'ano deve ter 4 dígitos (AAAA)' })
  ano?: string;

  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'de deve estar no formato AAAA-MM' })
  de?: string;

  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'ate deve estar no formato AAAA-MM' })
  ate?: string;
}
