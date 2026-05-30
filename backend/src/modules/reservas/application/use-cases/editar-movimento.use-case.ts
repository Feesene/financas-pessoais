import { Inject, Injectable } from '@nestjs/common';
import type { MovimentoReservaDTO, TipoMovimentoReserva } from '@financas-pessoais/shared';
import {
  MOVIMENTO_RESERVA_REPOSITORY,
  type MovimentoReservaRepository,
} from '../../domain/repositories/movimento-reserva.repository';
import { MovimentoNaoEncontradoError } from '../errors/movimento-nao-encontrado.error';
import { movimentoToDTO } from './registrar-movimento.use-case';

export interface EditarMovimentoInput {
  id: string;
  tipo: TipoMovimentoReserva;
  valor: number;
  competencia: string;
  descricao?: string | null;
}

@Injectable()
export class EditarMovimentoUseCase {
  constructor(
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

    await this.movimentos.save(atualizado);
    return movimentoToDTO(atualizado);
  }
}
