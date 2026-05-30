import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { TipoAtivo } from '@financas-pessoais/shared';

@Entity({ name: 'ativos' })
export class AtivoSchema {
  @PrimaryColumn('varchar')
  id!: string;

  @Column({ type: 'varchar', length: 10 })
  tipo!: TipoAtivo;

  @Column({ type: 'varchar', length: 80 })
  descricao!: string;

  @Column({ type: 'numeric', precision: 18, scale: 6, nullable: true })
  quantidade!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  valorUnitario!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  valorBruto!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  rendimento!: string;
}
