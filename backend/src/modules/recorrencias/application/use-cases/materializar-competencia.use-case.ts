import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { MaterializarResultadoDTO } from '@financas-pessoais/shared';
import { Lancamento } from '../../../lancamentos/domain/entities/lancamento';
import {
  LANCAMENTO_REPOSITORY,
  type LancamentoRepository,
} from '../../../lancamentos/domain/repositories/lancamento.repository';
import {
  OCORRENCIA_EXCLUIDA_REPOSITORY,
  type OcorrenciaExcluidaRepository,
} from '../../../lancamentos/domain/repositories/ocorrencia-excluida.repository';
import {
  CATEGORIA_REPOSITORY,
  type CategoriaRepository,
} from '../../../categorias/domain/repositories/categoria.repository';
import {
  REGRA_RECORRENTE_REPOSITORY,
  type RegraRecorrenteRepository,
} from '../../domain/repositories/regra-recorrente.repository';
import type { RegraRecorrente } from '../../domain/entities/regra-recorrente';

/**
 * Materializa, de forma idempotente, as ocorrências das regras ativas em uma
 * competência: cria apenas os lançamentos faltantes, pulando os já existentes
 * (por (origemRegraId, ocorrenciaIndice)) e os marcados como excluídos.
 */
@Injectable()
export class MaterializarCompetenciaUseCase {
  constructor(
    @Inject(REGRA_RECORRENTE_REPOSITORY) private readonly regras: RegraRecorrenteRepository,
    @Inject(LANCAMENTO_REPOSITORY) private readonly lancamentos: LancamentoRepository,
    @Inject(OCORRENCIA_EXCLUIDA_REPOSITORY)
    private readonly exclusoes: OcorrenciaExcluidaRepository,
    @Inject(CATEGORIA_REPOSITORY) private readonly categorias: CategoriaRepository,
  ) {}

  async execute(competencia: string): Promise<MaterializarResultadoDTO> {
    const [regras, existentes] = await Promise.all([
      this.regras.findAtivasNaCompetencia(competencia),
      this.lancamentos.findByCompetencia(competencia),
    ]);

    const jaMaterializadas = new Set(
      existentes
        .filter((l) => l.origemRegraId !== null && l.ocorrenciaIndice !== null)
        .map((l) => `${l.origemRegraId}#${l.ocorrenciaIndice}`),
    );

    let criados = 0;
    for (const regra of regras) {
      if (!regra.ativaEmCompetencia(competencia)) {
        continue;
      }
      const indice = regra.indiceNaCompetencia(competencia);
      const chave = `${regra.id}#${indice}`;
      if (jaMaterializadas.has(chave)) {
        continue;
      }
      if (await this.exclusoes.estaExcluida(regra.id, indice)) {
        continue;
      }

      const categoria = await this.categorias.findById(regra.categoriaId);
      if (!categoria) {
        // Categoria removida: não há como classificar a ocorrência; ignora a regra.
        continue;
      }

      const lancamento = Lancamento.criar({
        id: randomUUID(),
        tipo: regra.tipo,
        categoria: categoria.nome,
        categoriaId: regra.categoriaId,
        descricao: this.descricaoDaOcorrencia(regra, indice),
        valor: regra.valorDaOcorrencia(indice),
        competencia,
        origemRegraId: regra.id,
        ocorrenciaIndice: indice,
      });

      await this.lancamentos.save(lancamento);
      jaMaterializadas.add(chave);
      criados += 1;
    }

    return { competencia, criados };
  }

  private descricaoDaOcorrencia(regra: RegraRecorrente, indice: number): string | null {
    const label = regra.labelOcorrencia(indice);
    if (label === null) {
      return regra.descricao;
    }
    return regra.descricao ? `${regra.descricao} (${label})` : `Parcela ${label}`;
  }
}
