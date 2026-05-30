import { Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ocorrencias_excluidas' })
export class OcorrenciaExcluidaSchema {
  @PrimaryColumn('uuid')
  origemRegraId!: string;

  @PrimaryColumn({ type: 'int' })
  ocorrenciaIndice!: number;
}
