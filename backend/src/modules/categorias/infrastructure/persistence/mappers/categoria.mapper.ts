import { Categoria } from '../../../domain/entities/categoria';
import { CategoriaSchema } from '../entities/categoria.schema';

export class CategoriaMapper {
  static toDomain(schema: CategoriaSchema): Categoria {
    return Categoria.criar({
      id: schema.id,
      nome: schema.nome,
      tipo: schema.tipo,
      cor: schema.cor,
    });
  }

  static toPersistence(categoria: Categoria): CategoriaSchema {
    const schema = new CategoriaSchema();
    schema.id = categoria.id;
    schema.nome = categoria.nome;
    schema.tipo = categoria.tipo;
    schema.cor = categoria.cor;
    return schema;
  }
}
