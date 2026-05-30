import { Inject, Injectable } from '@nestjs/common';
import { ATIVO_REPOSITORY, type AtivoRepository } from '../../domain/repositories/ativo.repository';
import {
  COTACAO_ATIVO_REPOSITORY,
  type CotacaoAtivoRepository,
} from '../../domain/repositories/cotacao-ativo.repository';
import { AtivoNaoEncontradoError } from '../errors/ativo-nao-encontrado.error';
import { CotacaoNaoEncontradaError } from '../errors/cotacao-nao-encontrada.error';
import { aplicarCotacaoNoAtivo } from './registrar-cotacao.use-case';

@Injectable()
export class ExcluirCotacaoUseCase {
  constructor(
    @Inject(ATIVO_REPOSITORY) private readonly ativos: AtivoRepository,
    @Inject(COTACAO_ATIVO_REPOSITORY) private readonly cotacoes: CotacaoAtivoRepository,
  ) {}

  async execute(ativoId: string, competencia: string): Promise<void> {
    const ativo = await this.ativos.findById(ativoId);
    if (!ativo) {
      throw new AtivoNaoEncontradoError(ativoId);
    }

    const removida = await this.cotacoes.delete(ativoId, competencia);
    if (!removida) {
      throw new CotacaoNaoEncontradaError(ativoId, competencia);
    }

    // Recalcula o valor "atual" do Ativo a partir do snapshot mais recente restante.
    // Sem snapshots, o Ativo mantém seu valor pré-existente (edge case #4).
    const maisRecente = await this.cotacoes.findMaisRecentePorAtivo(ativoId);
    if (maisRecente) {
      await this.ativos.save(aplicarCotacaoNoAtivo(ativo, maisRecente));
    }
  }
}
