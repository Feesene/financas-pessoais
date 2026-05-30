import { RegraRecorrente } from '../../../domain/entities/regra-recorrente';
import { RegraRecorrenteSchema } from '../entities/regra-recorrente.schema';

export class RegraRecorrenteMapper {
  static toDomain(schema: RegraRecorrenteSchema): RegraRecorrente {
    return RegraRecorrente.criar({
      id: schema.id,
      tipo: schema.tipo,
      categoriaId: schema.categoriaId,
      descricao: schema.descricao,
      valorBase: Number(schema.valorBase),
      frequencia: schema.frequencia,
      competenciaInicio: schema.competenciaInicio,
      competenciaFim: schema.competenciaFim,
      numeroParcelas: schema.numeroParcelas,
      ativa: schema.ativa,
    });
  }

  static toPersistence(regra: RegraRecorrente): RegraRecorrenteSchema {
    const schema = new RegraRecorrenteSchema();
    schema.id = regra.id;
    schema.tipo = regra.tipo;
    schema.categoriaId = regra.categoriaId;
    schema.descricao = regra.descricao;
    schema.valorBase = regra.valorBase.toFixed(2);
    schema.frequencia = regra.frequencia;
    schema.competenciaInicio = regra.competenciaInicio;
    schema.competenciaFim = regra.competenciaFim;
    schema.numeroParcelas = regra.numeroParcelas;
    schema.ativa = regra.ativa;
    return schema;
  }
}
