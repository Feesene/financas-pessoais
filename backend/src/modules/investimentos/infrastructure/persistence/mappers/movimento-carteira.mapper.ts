import { MovimentoCarteira } from '../../../domain/entities/movimento-carteira';
import { MovimentoCarteiraSchema } from '../entities/movimento-carteira.schema';

export class MovimentoCarteiraMapper {
  static toDomain(schema: MovimentoCarteiraSchema): MovimentoCarteira {
    return MovimentoCarteira.criar({
      id: schema.id,
      ativoId: schema.ativoId,
      tipo: schema.tipo,
      valor: Number(schema.valor),
      competencia: schema.competencia,
      descricao: schema.descricao,
    });
  }

  static toPersistence(movimento: MovimentoCarteira): MovimentoCarteiraSchema {
    const schema = new MovimentoCarteiraSchema();
    schema.id = movimento.id;
    schema.ativoId = movimento.ativoId;
    schema.tipo = movimento.tipo;
    schema.valor = movimento.valor.toFixed(2);
    schema.competencia = movimento.competencia;
    schema.descricao = movimento.descricao;
    return schema;
  }
}
