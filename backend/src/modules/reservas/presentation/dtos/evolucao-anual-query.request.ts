import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class EvolucaoAnualQueryRequest {
  @Type(() => Number)
  @IsInt({ message: 'ano deve ser um inteiro de 4 dígitos' })
  @Min(1000, { message: 'ano deve ser um inteiro de 4 dígitos' })
  @Max(9999, { message: 'ano deve ser um inteiro de 4 dígitos' })
  ano!: number;
}
