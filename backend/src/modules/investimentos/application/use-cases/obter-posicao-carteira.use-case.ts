import { Inject, Injectable } from '@nestjs/common';
import type { AtivoDTO, PosicaoCarteiraDTO, SubtotalTipoDTO, TipoAtivo } from '@financas-pessoais/shared';
import type { Ativo } from '../../domain/entities/ativo';
import { ATIVO_REPOSITORY, type AtivoRepository } from '../../domain/repositories/ativo.repository';
import {
  COTACAO_ATIVO_REPOSITORY,
  type CotacaoAtivoRepository,
} from '../../domain/repositories/cotacao-ativo.repository';
import { ativoToDTO } from './criar-ativo.use-case';
import { brutoEfetivo } from './obter-evolucao-ativo.use-case';

const ORDEM_TIPOS: TipoAtivo[] = ['ACAO', 'FII', 'FUNDO'];

@Injectable()
export class ObterPosicaoCarteiraUseCase {
  constructor(
    @Inject(ATIVO_REPOSITORY) private readonly ativos: AtivoRepository,
    @Inject(COTACAO_ATIVO_REPOSITORY) private readonly cotacoes: CotacaoAtivoRepository,
  ) {}

  /**
   * Posição atual: ativos, subtotais por tipo (valor bruto + rendimento), total
   * geral e rendimento total. O valor bruto de cada ativo reflete o snapshot de
   * cotação mais recente (fallback: valor do próprio `Ativo` quando sem cotações).
   * Somas em centavos para evitar erro de ponto flutuante.
   */
  async execute(): Promise<PosicaoCarteiraDTO> {
    const ativos = await this.ativos.findAll();

    const acumulado = new Map<TipoAtivo, { totalCentavos: number; rendimentoCentavos: number }>();
    let totalCentavos = 0;
    let rendimentoTotalCentavos = 0;
    const ativosDTO: AtivoDTO[] = [];

    for (const ativo of ativos) {
      const dto = await this.ativoComSnapshot(ativo);
      ativosDTO.push(dto);

      const brutoCentavos = emCentavos(dto.valorBruto);
      const rendimentoCentavos = emCentavos(ativo.rendimento);

      const atual = acumulado.get(ativo.tipo) ?? { totalCentavos: 0, rendimentoCentavos: 0 };
      atual.totalCentavos += brutoCentavos;
      atual.rendimentoCentavos += rendimentoCentavos;
      acumulado.set(ativo.tipo, atual);

      totalCentavos += brutoCentavos;
      rendimentoTotalCentavos += rendimentoCentavos;
    }

    const subtotais: SubtotalTipoDTO[] = ORDEM_TIPOS.filter((tipo) => acumulado.has(tipo)).map(
      (tipo) => {
        const dados = acumulado.get(tipo)!;
        return {
          tipo,
          total: dados.totalCentavos / 100,
          rendimento: dados.rendimentoCentavos / 100,
        };
      },
    );

    return {
      ativos: ativosDTO,
      subtotais,
      total: totalCentavos / 100,
      rendimentoTotal: rendimentoTotalCentavos / 100,
    };
  }

  /** DTO do ativo com valor refletindo o snapshot mais recente (fallback: o próprio ativo). */
  private async ativoComSnapshot(ativo: Ativo): Promise<AtivoDTO> {
    const snapshot = await this.cotacoes.findMaisRecentePorAtivo(ativo.id);
    if (!snapshot) {
      return ativoToDTO(ativo);
    }
    const cotado = ativo.tipo === 'ACAO' || ativo.tipo === 'FII';
    return {
      ...ativoToDTO(ativo),
      valorUnitario: cotado ? snapshot.valorUnitario : null,
      valorBruto: brutoEfetivo(ativo, snapshot),
    };
  }
}

function emCentavos(valor: number): number {
  return Math.round(valor * 100);
}
