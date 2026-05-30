import { Inject, Injectable } from '@nestjs/common';
import type { RegraRecorrenteDTO } from '@financas-pessoais/shared';
import {
  REGRA_RECORRENTE_REPOSITORY,
  type RegraRecorrenteRepository,
} from '../../domain/repositories/regra-recorrente.repository';
import { toRegraDTO } from '../dtos/regra.dto';

@Injectable()
export class ListarRegrasUseCase {
  constructor(
    @Inject(REGRA_RECORRENTE_REPOSITORY) private readonly regras: RegraRecorrenteRepository,
  ) {}

  async execute(): Promise<RegraRecorrenteDTO[]> {
    const regras = await this.regras.findAll();
    return regras.map(toRegraDTO);
  }
}
