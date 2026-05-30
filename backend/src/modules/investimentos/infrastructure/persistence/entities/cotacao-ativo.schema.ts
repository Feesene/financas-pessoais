import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cotacao_ativo' })
@Index('uq_cotacao_ativo_ativo_competencia', ['ativoId', 'competencia'], { unique: true })
@Index('idx_cotacao_ativo_ativo', ['ativoId'])
export class CotacaoAtivoSchema {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  ativoId!: string;

  @Column({ type: 'varchar', length: 7 })
  competencia!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  valorUnitario!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  valorBruto!: string | null;
}
