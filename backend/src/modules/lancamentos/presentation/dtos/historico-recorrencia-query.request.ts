import { IsNotEmpty, IsString } from 'class-validator';

export class HistoricoRecorrenciaQueryRequest {
  @IsString()
  @IsNotEmpty({ message: 'regraId é obrigatório' })
  regraId!: string;
}
