import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { Frequencia, TipoLancamento } from '@financas-pessoais/shared';

@Entity({ name: 'regras_recorrentes' })
@Index('idx_regras_ativa_inicio', ['ativa', 'competenciaInicio'])
export class RegraRecorrenteSchema {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 10 })
  tipo!: TipoLancamento;

  @Column({ type: 'uuid' })
  categoriaId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descricao!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  valorBase!: string;

  @Column({ type: 'varchar', length: 10 })
  frequencia!: Frequencia;

  @Column({ type: 'varchar', length: 7 })
  competenciaInicio!: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  competenciaFim!: string | null;

  @Column({ type: 'int', nullable: true })
  numeroParcelas!: number | null;

  @Column({ type: 'boolean', default: true })
  ativa!: boolean;
}
