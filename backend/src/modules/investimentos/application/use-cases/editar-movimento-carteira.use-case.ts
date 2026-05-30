import { Inject, Injectable } from '@nestjs/common';
import type { MovimentoCarteiraDTO, TipoMovimentoCarteira } from '@financas-pessoais/shared';
import {
  MOVIMENTO_CARTEIRA_REPOSITORY,
  type MovimentoCarteiraRepository,
} from '../../domain/repositories/movimento-carteira.repository';
import { MovimentoCarteiraNaoEncontradoError } from '../errors/movimento-carteira-nao-encontrado.error';
import { movimentoCarteiraToDTO } from './registrar-movimento-carteira.use-case';

export interface EditarMovimentoCarteiraInput {
  id: string;
  tipo: TipoMovimentoCarteira;
  valor: number;
  competencia: string;
  descricao?: string | null;
}

@Injectable()
export class EditarMovimentoCarteiraUseCase {
  constructor(
    @Inject(MOVIMENTO_CARTEIRA_REPOSITORY)
    private readonly movimentos: MovimentoCarteiraRepository,
  ) {}

  async execute(input: EditarMovimentoCarteiraInput): Promise<MovimentoCarteiraDTO> {
    const existente = await this.movimentos.findById(input.id);
    if (!existente) {
      throw new MovimentoCarteiraNaoEncontradoError(input.id);
    }

    const atualizado = existente.atualizar({
      tipo: input.tipo,
      valor: input.valor,
      competencia: input.competencia,
      descricao: input.descricao ?? null,
    });

    await this.movimentos.save(atualizado);
    return movimentoCarteiraToDTO(atualizado);
  }
}
