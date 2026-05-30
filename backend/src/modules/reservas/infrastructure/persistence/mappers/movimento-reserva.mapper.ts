import { MovimentoReserva } from '../../../domain/entities/movimento-reserva';
import { MovimentoReservaSchema } from '../entities/movimento-reserva.schema';

export class MovimentoReservaMapper {
  static toDomain(schema: MovimentoReservaSchema): MovimentoReserva {
    return MovimentoReserva.criar({
      id: schema.id,
      baldeId: schema.baldeId,
      tipo: schema.tipo,
      valor: Number(schema.valor),
      competencia: schema.competencia,
      descricao: schema.descricao,
      // Linhas anteriores à coluna não têm timestamp; usa o 1º dia da
      // competência como data plausível de lançamento.
      criadoEm: schema.criadoEm ?? `${schema.competencia}-01T00:00:00.000Z`,
    });
  }

  static toPersistence(movimento: MovimentoReserva): MovimentoReservaSchema {
    const schema = new MovimentoReservaSchema();
    schema.id = movimento.id;
    schema.baldeId = movimento.baldeId;
    schema.tipo = movimento.tipo;
    schema.valor = movimento.valor.toFixed(2);
    schema.competencia = movimento.competencia;
    schema.descricao = movimento.descricao;
    schema.criadoEm = movimento.criadoEm;
    return schema;
  }
}
