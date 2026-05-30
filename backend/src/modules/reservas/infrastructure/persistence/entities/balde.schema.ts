import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'baldes' })
@Index('uq_baldes_nome', ['nome'], { unique: true })
export class BaldeSchema {
  @PrimaryColumn('varchar')
  id!: string;

  @Column({ type: 'varchar', length: 80 })
  nome!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  saldoInicial!: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  cor!: string | null;
}
