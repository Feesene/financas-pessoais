import { IsOptional, Matches } from 'class-validator';

export class MaterializarRequest {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'competencia deve estar no formato AAAA-MM' })
  competencia!: string;

  /** Fim (inclusivo) do intervalo a materializar; ausente materializa só `competencia`. */
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'ate deve estar no formato AAAA-MM' })
  ate?: string;
}
