import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { TipoMovimentoCarteira } from '@financas-pessoais/shared';

@Entity({ name: 'movimentos_carteira' })
@Index('idx_movimentos_carteira_ativo_competencia', ['ativoId', 'competencia'])
export class MovimentoCarteiraSchema {
  @PrimaryColumn('varchar')
  id!: string;

  @Column({ type: 'varchar' })
  ativoId!: string;

  @Column({ type: 'varchar', length: 10 })
  tipo!: TipoMovimentoCarteira;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  valor!: string;

  @Column({ type: 'varchar', length: 7 })
  competencia!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descricao!: string | null;
}
