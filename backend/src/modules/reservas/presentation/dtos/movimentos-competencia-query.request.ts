import { IsString, Matches } from 'class-validator';

export class MovimentosCompetenciaQueryRequest {
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'competencia deve estar no formato AAAA-MM' })
  competencia!: string;
}
