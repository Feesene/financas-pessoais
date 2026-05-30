import { Inject, Injectable } from '@nestjs/common';
import type { RegraRecorrenteDTO } from '@financas-pessoais/shared';
import {
  REGRA_RECORRENTE_REPOSITORY,
  type RegraRecorrenteRepository,
} from '../../domain/repositories/regra-recorrente.repository';
import { RegraNaoEncontradaError } from '../errors/regra-nao-encontrada.error';
import { toRegraDTO } from '../dtos/regra.dto';

@Injectable()
export class EncerrarRegraUseCase {
  constructor(
    @Inject(REGRA_RECORRENTE_REPOSITORY) private readonly regras: RegraRecorrenteRepository,
  ) {}

  async execute(id: string): Promise<RegraRecorrenteDTO> {
    const regra = await this.regras.findById(id);
    if (!regra) {
      throw new RegraNaoEncontradaError(id);
    }

    const encerrada = regra.encerrar();
    await this.regras.save(encerrada);
    return toRegraDTO(encerrada);
  }
}
