import { Inject, Injectable } from '@nestjs/common';
import type { AtivoDTO } from '@financas-pessoais/shared';
import { ATIVO_REPOSITORY, type AtivoRepository } from '../../domain/repositories/ativo.repository';
import { AtivoNaoEncontradoError } from '../errors/ativo-nao-encontrado.error';
import { ativoToDTO } from './criar-ativo.use-case';

export interface EditarAtivoInput {
  id: string;
  descricao: string;
  quantidade?: number | null;
  valorUnitario?: number | null;
  valorBruto?: number;
  rendimento?: number;
}

@Injectable()
export class EditarAtivoUseCase {
  constructor(@Inject(ATIVO_REPOSITORY) private readonly ativos: AtivoRepository) {}

  async execute(input: EditarAtivoInput): Promise<AtivoDTO> {
    const existente = await this.ativos.findById(input.id);
    if (!existente) {
      throw new AtivoNaoEncontradoError(input.id);
    }

    const atualizado = existente.atualizar({
      descricao: input.descricao,
      quantidade: input.quantidade ?? null,
      valorUnitario: input.valorUnitario ?? null,
      valorBruto: input.valorBruto ?? 0,
      rendimento: input.rendimento ?? existente.rendimento,
    });

    await this.ativos.save(atualizado);
    return ativoToDTO(atualizado);
  }
}
