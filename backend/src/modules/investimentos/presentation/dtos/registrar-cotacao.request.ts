import { IsNumber, IsOptional, Min } from 'class-validator';

export class RegistrarCotacaoRequest {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorUnitario?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorBruto?: number | null;
}
