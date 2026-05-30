import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { TipoLancamento } from '@financas-pessoais/shared';

@Entity({ name: 'lancamentos' })
@Index('uq_lancamentos_origem_ocorrencia', ['origemRegraId', 'ocorrenciaIndice'], { unique: true })
export class LancamentoSchema {
  @PrimaryColumn('varchar')
  id!: string;

  @Column({ type: 'varchar', length: 10 })
  tipo!: TipoLancamento;

  @Column({ type: 'varchar', length: 80 })
  categoria!: string;

  @Index('idx_lancamentos_categoria_competencia')
  @Column({ type: 'varchar', nullable: true })
  categoriaId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descricao!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  valor!: string;

  @Index('idx_lancamentos_competencia')
  @Column({ type: 'varchar', length: 7 })
  competencia!: string;

  @Column({ type: 'varchar', nullable: true })
  origemRegraId!: string | null;

  @Column({ type: 'int', nullable: true })
  ocorrenciaIndice!: number | null;

  @Column({ type: 'boolean', default: false })
  pago!: boolean;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  valorPago!: string | null;
}
