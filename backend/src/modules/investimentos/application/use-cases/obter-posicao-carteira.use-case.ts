import { Inject, Injectable } from '@nestjs/common';
import type { PosicaoCarteiraDTO, SubtotalTipoDTO, TipoAtivo } from '@financas-pessoais/shared';
import { ATIVO_REPOSITORY, type AtivoRepository } from '../../domain/repositories/ativo.repository';
import { ativoToDTO } from './criar-ativo.use-case';

const ORDEM_TIPOS: TipoAtivo[] = ['ACAO', 'FII', 'FUNDO'];

@Injectable()
export class ObterPosicaoCarteiraUseCase {
  constructor(@Inject(ATIVO_REPOSITORY) private readonly ativos: AtivoRepository) {}

  /**
   * Posição atual: ativos, subtotais por tipo (valor bruto + rendimento), total
   * geral e rendimento total. Somas em centavos para evitar erro de ponto flutuante.
   */
  async execute(): Promise<PosicaoCarteiraDTO> {
    const ativos = await this.ativos.findAll();

    const acumulado = new Map<TipoAtivo, { totalCentavos: number; rendimentoCentavos: number }>();
    let totalCentavos = 0;
    let rendimentoTotalCentavos = 0;

    for (const ativo of ativos) {
      const brutoCentavos = emCentavos(ativo.valorBruto);
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
      ativos: ativos.map(ativoToDTO),
      subtotais,
      total: totalCentavos / 100,
      rendimentoTotal: rendimentoTotalCentavos / 100,
    };
  }
}

function emCentavos(valor: number): number {
  return Math.round(valor * 100);
}
