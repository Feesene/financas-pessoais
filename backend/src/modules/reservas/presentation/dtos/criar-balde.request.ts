import { IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class CriarBaldeRequest {
  @IsString()
  @MaxLength(80)
  nome!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  saldoInicial?: number;

  @IsOptional()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, { message: 'cor deve ser hexadecimal (ex.: #22c55e)' })
  cor?: string;
}
