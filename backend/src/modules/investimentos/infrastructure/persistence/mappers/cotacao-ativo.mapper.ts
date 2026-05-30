import { CotacaoAtivo } from '../../../domain/entities/cotacao-ativo';
import { CotacaoAtivoSchema } from '../entities/cotacao-ativo.schema';

export class CotacaoAtivoMapper {
  static toDomain(schema: CotacaoAtivoSchema): CotacaoAtivo {
    return CotacaoAtivo.criar({
      id: schema.id,
      ativoId: schema.ativoId,
      competencia: schema.competencia,
      valorUnitario: schema.valorUnitario === null ? null : Number(schema.valorUnitario),
      valorBruto: schema.valorBruto === null ? null : Number(schema.valorBruto),
    });
  }

  static toPersistence(cotacao: CotacaoAtivo): CotacaoAtivoSchema {
    const schema = new CotacaoAtivoSchema();
    schema.id = cotacao.id;
    schema.ativoId = cotacao.ativoId;
    schema.competencia = cotacao.competencia;
    schema.valorUnitario = cotacao.valorUnitario === null ? null : cotacao.valorUnitario.toFixed(2);
    schema.valorBruto = cotacao.valorBruto === null ? null : cotacao.valorBruto.toFixed(2);
    return schema;
  }
}
