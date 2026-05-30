import { Ativo } from '../../../domain/entities/ativo';
import { AtivoSchema } from '../entities/ativo.schema';

export class AtivoMapper {
  static toDomain(schema: AtivoSchema): Ativo {
    return Ativo.criar({
      id: schema.id,
      tipo: schema.tipo,
      descricao: schema.descricao,
      quantidade: schema.quantidade === null ? null : Number(schema.quantidade),
      valorUnitario: schema.valorUnitario === null ? null : Number(schema.valorUnitario),
      valorBruto: Number(schema.valorBruto),
      rendimento: Number(schema.rendimento),
    });
  }

  static toPersistence(ativo: Ativo): AtivoSchema {
    const schema = new AtivoSchema();
    schema.id = ativo.id;
    schema.tipo = ativo.tipo;
    schema.descricao = ativo.descricao;
    schema.quantidade = ativo.quantidade === null ? null : ativo.quantidade.toString();
    schema.valorUnitario = ativo.valorUnitario === null ? null : ativo.valorUnitario.toFixed(2);
    schema.valorBruto = ativo.valorBruto.toFixed(2);
    schema.rendimento = ativo.rendimento.toFixed(2);
    return schema;
  }
}
