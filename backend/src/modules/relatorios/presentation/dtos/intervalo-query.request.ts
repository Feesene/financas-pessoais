import { IsIn, IsOptional, Matches } from 'class-validator';
import { MODOS_VALOR, type ModoValor } from '@financas-pessoais/shared';

const COMPETENCIA = /^\d{4}-(0[1-9]|1[0-2])$/;

export class IntervaloQueryRequest {
  @Matches(COMPETENCIA, { message: 'de deve estar no formato AAAA-MM' })
  de!: string;

  @Matches(COMPETENCIA, { message: 'ate deve estar no formato AAAA-MM' })
  ate!: string;

  /**
   * Leitura dos totais: PREVISTO (tudo que foi lançado no mês) ou REALIZADO
   * (só o que já se moveu). Ausente = PREVISTO.
   */
  @IsOptional()
  @IsIn(MODOS_VALOR)
  modo?: ModoValor;
}
