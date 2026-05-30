import { Matches } from 'class-validator';

const COMPETENCIA = /^\d{4}-(0[1-9]|1[0-2])$/;

export class IntervaloQueryRequest {
  @Matches(COMPETENCIA, { message: 'de deve estar no formato AAAA-MM' })
  de!: string;

  @Matches(COMPETENCIA, { message: 'ate deve estar no formato AAAA-MM' })
  ate!: string;
}
