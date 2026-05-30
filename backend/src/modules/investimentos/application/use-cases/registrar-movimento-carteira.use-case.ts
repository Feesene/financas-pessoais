import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { MovimentoCarteiraDTO, TipoMovimentoCarteira } from '@financas-pessoais/shared';
import { MovimentoCarteira } from '../../domain/entities/movimento-carteira';
import { ATIVO_REPOSITORY, type AtivoRepository } from '../../domain/repositories/ativo.repository';
import {
  MOVIMENTO_CARTEIRA_REPOSITORY,
  type MovimentoCarteiraRepository,
} from '../../domain/repositories/movimento-carteira.repository';
import { AtivoNaoEncontradoError } from '../errors/ativo-nao-encontrado.error';

export interface RegistrarMovimentoCarteiraInput {
  ativoId: string;
  tipo: TipoMovimentoCarteira;
  valor: number;
  competencia: string;
  descricao?: string | null;
}

@Injectable()
export class RegistrarMovimentoCarteiraUseCase {
  constructor(
    @Inject(ATIVO_REPOSITORY) private readonly ativos: AtivoRepository,
    @Inject(MOVIMENTO_CARTEIRA_REPOSITORY)
    private readonly movimentos: MovimentoCarteiraRepository,
  ) {}

  async execute(input: RegistrarMovimentoCarteiraInput): Promise<MovimentoCarteiraDTO> {
    const ativo = await this.ativos.findById(input.ativoId);
    if (!ativo) {
      throw new AtivoNaoEncontradoError(input.ativoId);
    }

    const movimento = MovimentoCarteira.criar({
      id: randomUUID(),
      ativoId: input.ativoId,
      tipo: input.tipo,
      valor: input.valor,
      competencia: input.competencia,
      descricao: input.descricao ?? null,
    });

    await this.movimentos.save(movimento);
    return movimentoCarteiraToDTO(movimento);
  }
}

export function movimentoCarteiraToDTO(movimento: MovimentoCarteira): MovimentoCarteiraDTO {
  return {
    id: movimento.id,
    ativoId: movimento.ativoId,
    tipo: movimento.tipo,
    valor: movimento.valor,
    competencia: movimento.competencia,
    descricao: movimento.descricao,
  };
}
