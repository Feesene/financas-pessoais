import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { TipoLancamento } from '@financas-pessoais/shared';

@Entity({ name: 'categorias' })
@Index('uq_categorias_nome_tipo', ['nome', 'tipo'], { unique: true })
export class CategoriaSchema {
  @PrimaryColumn('varchar')
  id!: string;

  @Column({ type: 'varchar', length: 80 })
  nome!: string;

  @Column({ type: 'varchar', length: 10 })
  tipo!: TipoLancamento;

  @Column({ type: 'varchar', length: 7, nullable: true })
  cor!: string | null;
}
