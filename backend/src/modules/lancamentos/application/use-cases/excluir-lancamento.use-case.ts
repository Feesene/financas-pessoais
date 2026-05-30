import { Inject, Injectable } from '@nestjs/common';
import {
  LANCAMENTO_REPOSITORY,
  type LancamentoRepository,
} from '../../domain/repositories/lancamento.repository';
import {
  OCORRENCIA_EXCLUIDA_REPOSITORY,
  type OcorrenciaExcluidaRepository,
} from '../../domain/repositories/ocorrencia-excluida.repository';
import { LancamentoNaoEncontradoError } from '../errors/lancamento-nao-encontrado.error';

@Injectable()
export class ExcluirLancamentoUseCase {
  constructor(
    @Inject(LANCAMENTO_REPOSITORY) private readonly lancamentos: LancamentoRepository,
    @Inject(OCORRENCIA_EXCLUIDA_REPOSITORY)
    private readonly exclusoes: OcorrenciaExcluidaRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const lancamento = await this.lancamentos.findById(id);
    if (!lancamento) {
      throw new LancamentoNaoEncontradoError(id);
    }

    // Lançamento materializado: registra a exclusão para não recriar na rematerialização.
    if (lancamento.origemRegraId !== null && lancamento.ocorrenciaIndice !== null) {
      await this.exclusoes.registrar(lancamento.origemRegraId, lancamento.ocorrenciaIndice);
    }

    await this.lancamentos.delete(id);
  }
}
