import { Inject, Injectable } from '@nestjs/common';
import type { EvolucaoAtivoItemDTO } from '@financas-pessoais/shared';
import type { Ativo } from '../../domain/entities/ativo';
import type { CotacaoAtivo } from '../../domain/entities/cotacao-ativo';
import { ATIVO_REPOSITORY, type AtivoRepository } from '../../domain/repositories/ativo.repository';
import {
  COTACAO_ATIVO_REPOSITORY,
  type CotacaoAtivoRepository,
} from '../../domain/repositories/cotacao-ativo.repository';
import { AtivoNaoEncontradoError } from '../errors/ativo-nao-encontrado.error';

@Injectable()
export class ObterEvolucaoAtivoUseCase {
  constructor(
    @Inject(ATIVO_REPOSITORY) private readonly ativos: AtivoRepository,
    @Inject(COTACAO_ATIVO_REPOSITORY) private readonly cotacoes: CotacaoAtivoRepository,
  ) {}

  /**
   * Evolução do valor do ativo por competência (asc). `valorBrutoEfetivo`: ação/FII =
   * quantidade (do ativo) × valorUnitario do snapshot; fundo = valorBruto do snapshot.
   * Cálculo do bruto efetivo em centavos para evitar erro de ponto flutuante.
   */
  async execute(ativoId: string): Promise<EvolucaoAtivoItemDTO[]> {
    const ativo = await this.ativos.findById(ativoId);
    if (!ativo) {
      throw new AtivoNaoEncontradoError(ativoId);
    }
    const cotacoes = await this.cotacoes.findByAtivo(ativoId);
    return cotacoes.map((cotacao) => ({
      competencia: cotacao.competencia,
      valorUnitario: cotacao.valorUnitario,
      valorBruto: cotacao.valorBruto,
      valorBrutoEfetivo: brutoEfetivo(ativo, cotacao),
    }));
  }
}

export function brutoEfetivo(ativo: Ativo, cotacao: CotacaoAtivo): number {
  if (ativo.tipo === 'ACAO' || ativo.tipo === 'FII') {
    const quantidade = ativo.quantidade ?? 0;
    const unitarioCentavos = Math.round((cotacao.valorUnitario ?? 0) * 100);
    return Math.round(quantidade * unitarioCentavos) / 100;
  }
  return cotacao.valorBruto ?? 0;
}
