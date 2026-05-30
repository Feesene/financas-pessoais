import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { TipoMovimentoReserva } from '@financas-pessoais/shared';

@Entity({ name: 'movimentos_reserva' })
@Index('idx_movimentos_balde_competencia', ['baldeId', 'competencia'])
export class MovimentoReservaSchema {
  @PrimaryColumn('varchar')
  id!: string;

  @Column({ type: 'varchar' })
  baldeId!: string;

  @Column({ type: 'varchar', length: 10 })
  tipo!: TipoMovimentoReserva;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  valor!: string;

  @Column({ type: 'varchar', length: 7 })
  competencia!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descricao!: string | null;

  // Nullable para o `synchronize` conseguir adicionar a coluna em tabelas já
  // populadas; linhas antigas ficam null e o mapper aplica fallback ao ler.
  @Column({ type: 'varchar', length: 30, nullable: true })
  criadoEm!: string | null;
}
