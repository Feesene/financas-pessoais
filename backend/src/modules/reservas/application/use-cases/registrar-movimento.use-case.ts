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

export interface RegistrarMovimentoInput {
  baldeId: string;
  tipo: TipoMovimentoReserva;
  valor: number;
  competencia: string;
  descricao?: string | null;
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
