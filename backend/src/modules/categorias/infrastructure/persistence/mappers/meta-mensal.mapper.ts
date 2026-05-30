import { MetaMensal } from '../../../domain/entities/meta-mensal';
import { MetaMensalSchema } from '../entities/meta-mensal.schema';

export class MetaMensalMapper {
  static toDomain(schema: MetaMensalSchema): MetaMensal {
    return MetaMensal.criar({
      id: schema.id,
      categoriaId: schema.categoriaId,
      competencia: schema.competencia,
      valor: Number(schema.valor),
    });
  }

  static toPersistence(meta: MetaMensal): MetaMensalSchema {
    const schema = new MetaMensalSchema();
    schema.id = meta.id;
    schema.categoriaId = meta.categoriaId;
    schema.competencia = meta.competencia;
    schema.valor = meta.valor.toFixed(2);
    return schema;
  }
}
