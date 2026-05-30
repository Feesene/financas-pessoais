import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CotacaoAtivoDTO } from '@financas-pessoais/shared';
import { Ativo } from '../../domain/entities/ativo';
import { CotacaoAtivo } from '../../domain/entities/cotacao-ativo';
import { CotacaoAtivoInvalidaError } from '../../domain/errors/cotacao-ativo-invalida.error';
import { ATIVO_REPOSITORY, type AtivoRepository } from '../../domain/repositories/ativo.repository';
import {
  COTACAO_ATIVO_REPOSITORY,
  type CotacaoAtivoRepository,
} from '../../domain/repositories/cotacao-ativo.repository';
import { AtivoNaoEncontradoError } from '../errors/ativo-nao-encontrado.error';

export interface RegistrarCotacaoInput {
  ativoId: string;
  competencia: string;
  valorUnitario?: number | null;
  valorBruto?: number | null;
}

/** true para ativos cotados por quantidade × valor unitário (ação e FII). */
function ehCotado(tipo: Ativo['tipo']): boolean {
  return tipo === 'ACAO' || tipo === 'FII';
}

@Injectable()
export class RegistrarCotacaoUseCase {
  constructor(
    @Inject(ATIVO_REPOSITORY) private readonly ativos: AtivoRepository,
    @Inject(COTACAO_ATIVO_REPOSITORY) private readonly cotacoes: CotacaoAtivoRepository,
  ) {}

  async execute(input: RegistrarCotacaoInput): Promise<CotacaoAtivoDTO> {
    const ativo = await this.ativos.findById(input.ativoId);
    if (!ativo) {
      throw new AtivoNaoEncontradoError(input.ativoId);
    }

    const { valorUnitario, valorBruto } = camposPorTipo(ativo, input);

    const existente = await this.cotacoes.findByAtivoECompetencia(
      input.ativoId,
      input.competencia,
    );
    const cotacao = CotacaoAtivo.criar({
      id: existente?.id ?? randomUUID(),
      ativoId: input.ativoId,
      competencia: input.competencia,
      valorUnitario,
      valorBruto,
    });

    await this.cotacoes.save(cotacao);

    // Só atualiza o valor "atual" do Ativo se esta for a competência mais recente.
    const maisRecente = await this.cotacoes.findMaisRecentePorAtivo(input.ativoId);
    if (maisRecente && maisRecente.competencia === cotacao.competencia) {
      await this.ativos.save(aplicarCotacaoNoAtivo(ativo, cotacao));
    }

    return cotacaoToDTO(cotacao);
  }
}

/** Valida a coerência tipo×campo e devolve os valores normalizados (um null). */
function camposPorTipo(
  ativo: Ativo,
  input: RegistrarCotacaoInput,
): { valorUnitario: number | null; valorBruto: number | null } {
  if (ehCotado(ativo.tipo)) {
    if (input.valorBruto !== null && input.valorBruto !== undefined) {
      throw new CotacaoAtivoInvalidaError('Ações e FIIs usam valorUnitario, não valorBruto.');
    }
    if (input.valorUnitario === null || input.valorUnitario === undefined) {
      throw new CotacaoAtivoInvalidaError('Ações e FIIs exigem valorUnitario.');
    }
    return { valorUnitario: input.valorUnitario, valorBruto: null };
  }

  if (input.valorUnitario !== null && input.valorUnitario !== undefined) {
    throw new CotacaoAtivoInvalidaError('Fundos usam valorBruto, não valorUnitario.');
  }
  if (input.valorBruto === null || input.valorBruto === undefined) {
    throw new CotacaoAtivoInvalidaError('Fundos exigem valorBruto.');
  }
  return { valorUnitario: null, valorBruto: input.valorBruto };
}

/**
 * Reaplica a cotação como valor "mais recente conhecido" do Ativo (denormalização de
 * leitura): para ação/FII atualiza o valorUnitario (valorBruto é derivado); para fundo
 * atualiza o valorBruto. Preserva quantidade, descrição e rendimento.
 */
export function aplicarCotacaoNoAtivo(ativo: Ativo, cotacao: CotacaoAtivo): Ativo {
  if (ehCotado(ativo.tipo)) {
    return ativo.atualizar({
      descricao: ativo.descricao,
      quantidade: ativo.quantidade,
      valorUnitario: cotacao.valorUnitario,
      valorBruto: 0,
      rendimento: ativo.rendimento,
    });
  }
  return ativo.atualizar({
    descricao: ativo.descricao,
    quantidade: null,
    valorUnitario: null,
    valorBruto: cotacao.valorBruto ?? 0,
    rendimento: ativo.rendimento,
  });
}

export function cotacaoToDTO(cotacao: CotacaoAtivo): CotacaoAtivoDTO {
  return {
    id: cotacao.id,
    ativoId: cotacao.ativoId,
    competencia: cotacao.competencia,
    valorUnitario: cotacao.valorUnitario,
    valorBruto: cotacao.valorBruto,
  };
}
