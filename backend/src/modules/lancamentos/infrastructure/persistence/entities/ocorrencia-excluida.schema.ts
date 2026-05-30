import { Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ocorrencias_excluidas' })
export class OcorrenciaExcluidaSchema {
  @PrimaryColumn('varchar')
  origemRegraId!: string;

  @PrimaryColumn({ type: 'int' })
  ocorrenciaIndice!: number;
}
