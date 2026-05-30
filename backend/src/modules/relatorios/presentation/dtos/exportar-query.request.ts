import { IsIn, Matches } from 'class-validator';
import type { FormatoExportacao } from '@financas-pessoais/shared';

const COMPETENCIA = /^\d{4}-(0[1-9]|1[0-2])$/;

export class ExportarQueryRequest {
  @IsIn(['pdf', 'xlsx'], { message: 'formato deve ser pdf ou xlsx' })
  formato!: FormatoExportacao;

  @Matches(COMPETENCIA, { message: 'de deve estar no formato AAAA-MM' })
  de!: string;

  @Matches(COMPETENCIA, { message: 'ate deve estar no formato AAAA-MM' })
  ate!: string;
}
