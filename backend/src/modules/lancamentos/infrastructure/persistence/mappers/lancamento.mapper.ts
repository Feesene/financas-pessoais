import { Lancamento } from '../../../domain/entities/lancamento';
import { LancamentoSchema } from '../entities/lancamento.schema';

/** Converte entre a entidade de domínio e a entidade de persistência (TypeORM). */
export class LancamentoMapper {
  static toDomain(schema: LancamentoSchema): Lancamento {
    return Lancamento.criar({
      id: schema.id,
      tipo: schema.tipo,
      categoria: schema.categoria,
      categoriaId: schema.categoriaId,
      descricao: schema.descricao,
      valor: Number(schema.valor),
      competencia: schema.competencia,
      origemRegraId: schema.origemRegraId,
      ocorrenciaIndice: schema.ocorrenciaIndice,
      pago: schema.pago ?? false,
      valorPago: schema.valorPago === null ? null : Number(schema.valorPago),
    });
  }

  static toPersistence(lancamento: Lancamento): LancamentoSchema {
    const schema = new LancamentoSchema();
    schema.id = lancamento.id;
    schema.tipo = lancamento.tipo;
    schema.categoria = lancamento.categoria;
    schema.categoriaId = lancamento.categoriaId;
    schema.descricao = lancamento.descricao;
    schema.valor = lancamento.valor.toFixed(2);
    schema.competencia = lancamento.competencia;
    schema.origemRegraId = lancamento.origemRegraId;
    schema.ocorrenciaIndice = lancamento.ocorrenciaIndice;
    schema.pago = lancamento.pago;
    schema.valorPago = lancamento.valorPago === null ? null : lancamento.valorPago.toFixed(2);
    return schema;
  }
}
