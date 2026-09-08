import { Inject, Injectable } from '@nestjs/common';
import type { MovimentoReservaDTO, TipoMovimentoReserva } from '@financas-pessoais/shared';
import { BALDE_REPOSITORY, type BaldeRepository } from '../../domain/repositories/balde.repository';
import {
  MOVIMENTO_RESERVA_REPOSITORY,
  type MovimentoReservaRepository,
} from '../../domain/repositories/movimento-reserva.repository';
import { BaldeNaoEncontradoError } from '../errors/balde-nao-encontrado.error';
import { MovimentoNaoEncontradoError } from '../errors/movimento-nao-encontrado.error';
import { SaldoInsuficienteError } from '../errors/saldo-insuficiente.error';
import { competenciaComSaldoNegativo } from '../saldo-balde';
import { movimentoToDTO } from './registrar-movimento.use-case';

export interface EditarMovimentoInput {
  id: string;
  tipo: TipoMovimentoReserva;
  valor: number;
  competencia: string;
  descricao?: string | null;
  /** Confirmação explícita de que a retirada pode deixar o balde negativo. */
  permitirNegativo?: boolean;
}

@Injectable()
export class EditarMovimentoUseCase {
  constructor(
    @Inject(BALDE_REPOSITORY) private readonly baldes: BaldeRepository,
    @Inject(MOVIMENTO_RESERVA_REPOSITORY)
    private readonly movimentos: MovimentoReservaRepository,
  ) {}

  async execute(input: EditarMovimentoInput): Promise<MovimentoReservaDTO> {
    const existente = await this.movimentos.findById(input.id);
    if (!existente) {
      throw new MovimentoNaoEncontradoError(input.id);
    }

    const atualizado = existente.atualizar({
      tipo: input.tipo,
      valor: input.valor,
      competencia: input.competencia,
      descricao: input.descricao ?? null,
    });

    if (atualizado.tipo === 'RETIRADA' && input.permitirNegativo !== true) {
      // Mesma regra do registro: a retirada precisa caber no saldo. A versão
      // antiga sai da linha do tempo antes da conta, senão o próprio movimento
      // sendo editado seria contado duas vezes.
      const balde = await this.baldes.findById(existente.baldeId);
      if (!balde) {
        throw new BaldeNaoEncontradoError(existente.baldeId);
      }
      const irmaos = (await this.movimentos.findByBaldeId(existente.baldeId)).filter(
        (movimento) => movimento.id !== existente.id,
      );
      const negativa = competenciaComSaldoNegativo(balde.saldoInicial, [...irmaos, atualizado]);
      if (negativa) {
        throw new SaldoInsuficienteError(negativa.competencia, negativa.saldoEmCentavos);
      }
    }

    await this.movimentos.save(atualizado);
    return movimentoToDTO(atualizado);
  }
}
