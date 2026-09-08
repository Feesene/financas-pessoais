import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { MovimentoReservaDTO, TipoMovimentoReserva } from '@financas-pessoais/shared';
import { MovimentoReserva } from '../../domain/entities/movimento-reserva';
import { BALDE_REPOSITORY, type BaldeRepository } from '../../domain/repositories/balde.repository';
import {
  MOVIMENTO_RESERVA_REPOSITORY,
  type MovimentoReservaRepository,
} from '../../domain/repositories/movimento-reserva.repository';
import { BaldeNaoEncontradoError } from '../errors/balde-nao-encontrado.error';
import { SaldoInsuficienteError } from '../errors/saldo-insuficiente.error';
import { competenciaComSaldoNegativo } from '../saldo-balde';

export interface RegistrarMovimentoInput {
  baldeId: string;
  tipo: TipoMovimentoReserva;
  valor: number;
  competencia: string;
  descricao?: string | null;
  /** Confirmação explícita de que a retirada pode deixar o balde negativo. */
  permitirNegativo?: boolean;
}

@Injectable()
export class RegistrarMovimentoUseCase {
  constructor(
    @Inject(BALDE_REPOSITORY) private readonly baldes: BaldeRepository,
    @Inject(MOVIMENTO_RESERVA_REPOSITORY)
    private readonly movimentos: MovimentoReservaRepository,
  ) {}

  async execute(input: RegistrarMovimentoInput): Promise<MovimentoReservaDTO> {
    const balde = await this.baldes.findById(input.baldeId);
    if (!balde) {
      throw new BaldeNaoEncontradoError(input.baldeId);
    }

    const movimento = MovimentoReserva.criar({
      id: randomUUID(),
      baldeId: input.baldeId,
      tipo: input.tipo,
      valor: input.valor,
      competencia: input.competencia,
      descricao: input.descricao ?? null,
    });

    if (movimento.tipo === 'RETIRADA' && input.permitirNegativo !== true) {
      // Retirar mais do que o balde tem quase sempre é erro de digitação, mas o
      // saldo negativo continua sendo um estado válido (o DTO tem `negativo` e a
      // tela o sinaliza). Então a regra avisa em vez de proibir: sem a
      // confirmação explícita a operação para, com ela passa. Aporte nunca é
      // barrado — só a retirada precisa caber no saldo.
      const existentes = await this.movimentos.findByBaldeId(input.baldeId);
      const negativa = competenciaComSaldoNegativo(balde.saldoInicial, [...existentes, movimento]);
      if (negativa) {
        throw new SaldoInsuficienteError(negativa.competencia, negativa.saldoEmCentavos);
      }
    }

    await this.movimentos.save(movimento);
    return movimentoToDTO(movimento);
  }
}

export function movimentoToDTO(movimento: MovimentoReserva): MovimentoReservaDTO {
  return {
    id: movimento.id,
    baldeId: movimento.baldeId,
    tipo: movimento.tipo,
    valor: movimento.valor,
    competencia: movimento.competencia,
    descricao: movimento.descricao,
    criadoEm: movimento.criadoEm,
  };
}
