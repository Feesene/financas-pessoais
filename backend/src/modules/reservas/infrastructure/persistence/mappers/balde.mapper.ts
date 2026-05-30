import { Balde } from '../../../domain/entities/balde';
import { BaldeSchema } from '../entities/balde.schema';

export class BaldeMapper {
  static toDomain(schema: BaldeSchema): Balde {
    return Balde.criar({
      id: schema.id,
      nome: schema.nome,
      saldoInicial: Number(schema.saldoInicial),
      cor: schema.cor,
    });
  }

  static toPersistence(balde: Balde): BaldeSchema {
    const schema = new BaldeSchema();
    schema.id = balde.id;
    schema.nome = balde.nome;
    schema.saldoInicial = balde.saldoInicial.toFixed(2);
    schema.cor = balde.cor;
    return schema;
  }
}
