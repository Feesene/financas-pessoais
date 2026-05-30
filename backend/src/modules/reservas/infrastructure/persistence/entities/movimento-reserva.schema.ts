import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { TipoMovimentoReserva } from '@financas-pessoais/shared';

@Entity({ name: 'movimentos_reserva' })
@Index('idx_movimentos_balde_competencia', ['baldeId', 'competencia'])
export class MovimentoReservaSchema {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  baldeId!: string;

  @Column({ type: 'varchar', length: 10 })
  tipo!: TipoMovimentoReserva;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  valor!: string;

  @Column({ type: 'varchar', length: 7 })
  competencia!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descricao!: string | null;
}
