import { Inject, Injectable } from '@nestjs/common';
import type { BaldeDTO } from '@financas-pessoais/shared';
import { BALDE_REPOSITORY, type BaldeRepository } from '../../domain/repositories/balde.repository';
import { BaldeNaoEncontradoError } from '../errors/balde-nao-encontrado.error';
import { BaldeDuplicadoError } from '../errors/balde-duplicado.error';
import { baldeToDTO } from './criar-balde.use-case';

export interface EditarBaldeInput {
  id: string;
  nome: string;
  saldoInicial: number;
  cor: string | null;
}

@Injectable()
export class EditarBaldeUseCase {
  constructor(@Inject(BALDE_REPOSITORY) private readonly baldes: BaldeRepository) {}

  async execute(input: EditarBaldeInput): Promise<BaldeDTO> {
    const existente = await this.baldes.findById(input.id);
    if (!existente) {
      throw new BaldeNaoEncontradoError(input.id);
    }

    const atualizado = existente.atualizar({
      nome: input.nome,
      saldoInicial: input.saldoInicial,
      cor: input.cor,
    });

    const comMesmoNome = await this.baldes.findByNome(atualizado.nome);
    if (comMesmoNome && comMesmoNome.id !== atualizado.id) {
      throw new BaldeDuplicadoError(atualizado.nome);
    }

    await this.baldes.save(atualizado);
    return baldeToDTO(atualizado);
  }
}
