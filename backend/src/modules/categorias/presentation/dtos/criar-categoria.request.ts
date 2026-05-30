import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import type { TipoLancamento } from '@financas-pessoais/shared';

export class CriarCategoriaRequest {
  @IsString()
  @MaxLength(80)
  nome!: string;

  @IsIn(['RECEITA', 'DESPESA'])
  tipo!: TipoLancamento;

  @IsOptional()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, { message: 'cor deve ser hexadecimal (ex.: #22c55e)' })
  cor?: string;
}
