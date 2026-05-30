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
import { CategoriaInexistenteError } from '../errors/categoria-inexistente.error';
import { resolverValorBase, toRegraDTO, type CriarRegraInput } from '../dtos/regra.dto';

@Injectable()
export class CriarRegraUseCase {
  constructor(
    @Inject(REGRA_RECORRENTE_REPOSITORY) private readonly regras: RegraRecorrenteRepository,
    @Inject(CATEGORIA_REPOSITORY) private readonly categorias: CategoriaRepository,
  ) {}

  async execute(input: CriarRegraInput): Promise<RegraRecorrenteDTO> {
    if (!(await this.categorias.findById(input.categoriaId))) {
      throw new CategoriaInexistenteError(input.categoriaId);
    }

    const regra = RegraRecorrente.criar({
      id: randomUUID(),
      tipo: input.tipo,
      categoriaId: input.categoriaId,
      descricao: input.descricao ?? null,
      valorBase: resolverValorBase(input),
      frequencia: 'MENSAL',
      competenciaInicio: input.competenciaInicio,
      competenciaFim: input.competenciaFim ?? null,
      numeroParcelas: input.numeroParcelas ?? null,
      ativa: true,
    });

    await this.regras.save(regra);
    return toRegraDTO(regra);
  }
}
