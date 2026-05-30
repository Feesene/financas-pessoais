import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { BaldeDTO } from '@financas-pessoais/shared';
import { Balde } from '../../domain/entities/balde';
import { BALDE_REPOSITORY, type BaldeRepository } from '../../domain/repositories/balde.repository';
import { BaldeDuplicadoError } from '../errors/balde-duplicado.error';

export interface CriarBaldeInput {
  nome: string;
  saldoInicial?: number;
  cor?: string | null;
}

@Injectable()
export class CriarBaldeUseCase {
  constructor(@Inject(BALDE_REPOSITORY) private readonly baldes: BaldeRepository) {}

  async execute(input: CriarBaldeInput): Promise<BaldeDTO> {
    const balde = Balde.criar({
      id: randomUUID(),
      nome: input.nome,
      saldoInicial: input.saldoInicial ?? 0,
      cor: input.cor ?? null,
    });

    const existente = await this.baldes.findByNome(balde.nome);
    if (existente) {
      throw new BaldeDuplicadoError(balde.nome);
    }

    await this.baldes.save(balde);
    return baldeToDTO(balde);
  }
}

export function baldeToDTO(balde: Balde): BaldeDTO {
  return {
    id: balde.id,
    nome: balde.nome,
    saldoInicial: balde.saldoInicial,
    cor: balde.cor,
  };
}
