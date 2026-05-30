import { Matches } from 'class-validator';

const COMPETENCIA = /^\d{4}-(0[1-9]|1[0-2])$/;

export class CompararQueryRequest {
  @Matches(COMPETENCIA, { message: 'a deve estar no formato AAAA-MM' })
  a!: string;

  @Matches(COMPETENCIA, { message: 'b deve estar no formato AAAA-MM' })
  b!: string;
}
