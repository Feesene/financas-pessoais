import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { CategoriaSchema } from '../../modules/categorias/infrastructure/persistence/entities/categoria.schema';
import { MetaMensalSchema } from '../../modules/categorias/infrastructure/persistence/entities/meta-mensal.schema';
import { LancamentoSchema } from '../../modules/lancamentos/infrastructure/persistence/entities/lancamento.schema';
import { OcorrenciaExcluidaSchema } from '../../modules/lancamentos/infrastructure/persistence/entities/ocorrencia-excluida.schema';
import { RegraRecorrenteSchema } from '../../modules/recorrencias/infrastructure/persistence/entities/regra-recorrente.schema';
import { BaldeSchema } from '../../modules/reservas/infrastructure/persistence/entities/balde.schema';
import { MovimentoReservaSchema } from '../../modules/reservas/infrastructure/persistence/entities/movimento-reserva.schema';

/**
 * DataSource usado pela CLI do TypeORM para rodar migrations (fora do contexto Nest).
 * O app em runtime continua usando `buildTypeOrmConfig` (synchronize em dev).
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    CategoriaSchema,
    MetaMensalSchema,
    LancamentoSchema,
    OcorrenciaExcluidaSchema,
    RegraRecorrenteSchema,
    BaldeSchema,
    MovimentoReservaSchema,
  ],
  migrations: [__dirname + '/../../migrations/*.{ts,js}'],
  synchronize: false,
});
