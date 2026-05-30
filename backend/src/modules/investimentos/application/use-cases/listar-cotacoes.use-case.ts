import { Inject, Injectable } from '@nestjs/common';
import type { CotacaoAtivoDTO } from '@financas-pessoais/shared';
import { ATIVO_REPOSITORY, type AtivoRepository } from '../../domain/repositories/ativo.repository';
import {
  COTACAO_ATIVO_REPOSITORY,
  type CotacaoAtivoRepository,
} from '../../domain/repositories/cotacao-ativo.repository';
import { AtivoNaoEncontradoError } from '../errors/ativo-nao-encontrado.error';
import { cotacaoToDTO } from './registrar-cotacao.use-case';

@Injectable()
export class ListarCotacoesUseCase {
  constructor(
    @Inject(ATIVO_REPOSITORY) private readonly ativos: AtivoRepository,
    @Inject(COTACAO_ATIVO_REPOSITORY) private readonly cotacoes: CotacaoAtivoRepository,
  ) {}

  async execute(ativoId: string): Promise<CotacaoAtivoDTO[]> {
    const ativo = await this.ativos.findById(ativoId);
    if (!ativo) {
      throw new AtivoNaoEncontradoError(ativoId);
    }
    const cotacoes = await this.cotacoes.findByAtivo(ativoId);
    return cotacoes.map(cotacaoToDTO);
  }
}
