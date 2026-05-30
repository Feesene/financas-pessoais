import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RegraRecorrenteDTO } from '@financas-pessoais/shared';
import { RegraRecorrente } from '../../domain/entities/regra-recorrente';
import {
  REGRA_RECORRENTE_REPOSITORY,
  type RegraRecorrenteRepository,
} from '../../domain/repositories/regra-recorrente.repository';
import {
  CATEGORIA_REPOSITORY,
  type CategoriaRepository,
} from '../../../categorias/domain/repositories/categoria.repository';
import { competenciaAnterior } from '../../domain/competencia';
import { RegraNaoEncontradaError } from '../errors/regra-nao-encontrada.error';
import { CategoriaInexistenteError } from '../errors/categoria-inexistente.error';
import { resolverValorBase, toRegraDTO, type EditarRegraInput } from '../dtos/regra.dto';

/**
 * Edição prospectiva: encerra a vigência atual no mês anterior a `aPartirDe` e
 * cria uma nova vigência com os valores novos. O passado fica imutável (RF-004).
 * Quando `aPartirDe` é anterior/igual ao início, a regra é substituída no lugar.
 */
@Injectable()
export class EditarRegraUseCase {
  constructor(
    @Inject(REGRA_RECORRENTE_REPOSITORY) private readonly regras: RegraRecorrenteRepository,
    @Inject(CATEGORIA_REPOSITORY) private readonly categorias: CategoriaRepository,
  ) {}

  async execute(input: EditarRegraInput): Promise<RegraRecorrenteDTO> {
    const existente = await this.regras.findById(input.id);
    if (!existente) {
      throw new RegraNaoEncontradaError(input.id);
    }
    if (!(await this.categorias.findById(input.categoriaId))) {
      throw new CategoriaInexistenteError(input.categoriaId);
    }

    const substituiNoLugar = input.aPartirDe <= existente.competenciaInicio;

    const nova = RegraRecorrente.criar({
      id: substituiNoLugar ? existente.id : randomUUID(),
      tipo: input.tipo,
      categoriaId: input.categoriaId,
      descricao: input.descricao ?? null,
      valorBase: resolverValorBase(input),
      frequencia: 'MENSAL',
      competenciaInicio: input.aPartirDe,
      competenciaFim: input.competenciaFim ?? null,
      numeroParcelas: input.numeroParcelas ?? null,
      ativa: true,
    });

    if (!substituiNoLugar) {
      await this.regras.save(existente.comFim(competenciaAnterior(input.aPartirDe)));
    }
    await this.regras.save(nova);

    return toRegraDTO(nova);
  }
}
