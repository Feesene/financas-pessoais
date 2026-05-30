import { IsInt, IsNumber, Max, Min } from 'class-validator';
import type { ProjecaoParametrosDTO } from '@financas-pessoais/shared';

export class CalcularProjecaoRequest implements ProjecaoParametrosDTO {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  entrada!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  aporteMensal!: number;

  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  taxaAnual!: number;

  @IsInt()
  @Min(1)
  @Max(60)
  anos!: number;
}
