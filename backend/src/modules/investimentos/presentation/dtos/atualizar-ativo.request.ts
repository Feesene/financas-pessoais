import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AtualizarAtivoRequest {
  @IsString()
  @MaxLength(80)
  descricao!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  quantidade?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorUnitario?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorBruto?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rendimento?: number;
}
