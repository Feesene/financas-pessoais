import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { TipoLancamento } from '@financas-pessoais/shared';

@Entity({ name: 'lancamentos' })
export class LancamentoSchema {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 10 })
  tipo!: TipoLancamento;

  @Column({ type: 'varchar', length: 80 })
  categoria!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descricao!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  valor!: string;

  @Index('idx_lancamentos_competencia')
  @Column({ type: 'varchar', length: 7 })
  competencia!: string;
}
