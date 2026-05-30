import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'metas_mensais' })
@Index('idx_metas_categoria_competencia', ['categoriaId', 'competencia'], { unique: true })
export class MetaMensalSchema {
  @PrimaryColumn('varchar')
  id!: string;

  @Column({ type: 'varchar' })
  categoriaId!: string;

  @Column({ type: 'varchar', length: 7 })
  competencia!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  valor!: string;
}
