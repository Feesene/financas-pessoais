import { Inject, Injectable } from '@nestjs/common';
import type { LancamentoDTO } from '@financas-pessoais/shared';
import {
  LANCAMENTO_REPOSITORY,
  type LancamentoRepository,
} from '../../domain/repositories/lancamento.repository';

@Injectable()
export class ListarLancamentosUseCase {
  constructor(
    @Inject(LANCAMENTO_REPOSITORY) private readonly lancamentos: LancamentoRepository,
  ) {}

  async execute(competencia: string): Promise<LancamentoDTO[]> {
    const lancamentos = await this.lancamentos.findByCompetencia(competencia);
    return lancamentos.map((l) => ({
      id: l.id,
      tipo: l.tipo,
      categoria: l.categoria,
      categoriaId: l.categoriaId,
      descricao: l.descricao,
      valor: l.valor,
      competencia: l.competencia,
      origemRegraId: l.origemRegraId,
      ocorrenciaIndice: l.ocorrenciaIndice,
    }));
  }
}
