import { IsIn, IsOptional, Matches } from 'class-validator';
import { MODOS_VALOR, type ModoValor } from '@financas-pessoais/shared';

export class CompetenciaQueryRequest {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'competencia deve estar no formato AAAA-MM' })
  competencia!: string;

  /**
   * Leitura dos totais: PREVISTO (tudo que foi lançado no mês) ou REALIZADO
   * (só o que já se moveu). Ausente = PREVISTO.
   */
  @IsOptional()
  @IsIn(MODOS_VALOR)
  modo?: ModoValor;
}
