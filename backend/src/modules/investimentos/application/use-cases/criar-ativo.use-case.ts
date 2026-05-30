import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { AtivoDTO, TipoAtivo } from '@financas-pessoais/shared';
import { Ativo } from '../../domain/entities/ativo';
import { ATIVO_REPOSITORY, type AtivoRepository } from '../../domain/repositories/ativo.repository';

export interface CriarAtivoInput {
  tipo: TipoAtivo;
  descricao: string;
  quantidade?: number | null;
  valorUnitario?: number | null;
  valorBruto?: number;
  rendimento?: number;
}

@Injectable()
export class CriarAtivoUseCase {
  constructor(@Inject(ATIVO_REPOSITORY) private readonly ativos: AtivoRepository) {}

  async execute(input: CriarAtivoInput): Promise<AtivoDTO> {
    const ativo = Ativo.criar({
      id: randomUUID(),
      tipo: input.tipo,
      descricao: input.descricao,
      quantidade: input.quantidade ?? null,
      valorUnitario: input.valorUnitario ?? null,
      valorBruto: input.valorBruto ?? 0,
      rendimento: input.rendimento ?? 0,
    });

    await this.ativos.save(ativo);
    return ativoToDTO(ativo);
  }
}

export function ativoToDTO(ativo: Ativo): AtivoDTO {
  return {
    id: ativo.id,
    tipo: ativo.tipo,
    descricao: ativo.descricao,
    quantidade: ativo.quantidade,
    valorUnitario: ativo.valorUnitario,
    valorBruto: ativo.valorBruto,
    rendimento: ativo.rendimento,
  };
}
