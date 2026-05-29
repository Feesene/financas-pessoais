import { Lancamento } from '../../../domain/entities/lancamento';
import { LancamentoSchema } from '../entities/lancamento.schema';

/** Converte entre a entidade de domínio e a entidade de persistência (TypeORM). */
export class LancamentoMapper {
  static toDomain(schema: LancamentoSchema): Lancamento {
    return Lancamento.criar({
      id: schema.id,
      tipo: schema.tipo,
      categoria: schema.categoria,
      descricao: schema.descricao,
      valor: Number(schema.valor),
      competencia: schema.competencia,
    });
  }

  static toPersistence(lancamento: Lancamento): LancamentoSchema {
    const schema = new LancamentoSchema();
    schema.id = lancamento.id;
    schema.tipo = lancamento.tipo;
    schema.categoria = lancamento.categoria;
    schema.descricao = lancamento.descricao;
    schema.valor = lancamento.valor.toFixed(2);
    schema.competencia = lancamento.competencia;
    return schema;
  }
}
