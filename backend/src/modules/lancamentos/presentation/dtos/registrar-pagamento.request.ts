import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class RegistrarPagamentoRequest {
  @IsBoolean()
  pago!: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valorPago?: number;
}
