import { Matches } from 'class-validator';
import { CriarRegraRequest } from './criar-regra.request';

const COMPETENCIA = /^\d{4}-(0[1-9]|1[0-2])$/;

export class EditarRegraRequest extends CriarRegraRequest {
  @Matches(COMPETENCIA, { message: 'aPartirDe deve estar no formato AAAA-MM' })
  aPartirDe!: string;
}
