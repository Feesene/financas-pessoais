import { Inject, Injectable } from '@nestjs/common';
import type { AtivoDTO } from '@financas-pessoais/shared';
import { ATIVO_REPOSITORY, type AtivoRepository } from '../../domain/repositories/ativo.repository';
import { ativoToDTO } from './criar-ativo.use-case';

@Injectable()
export class ListarAtivosUseCase {
  constructor(@Inject(ATIVO_REPOSITORY) private readonly ativos: AtivoRepository) {}

  async execute(): Promise<AtivoDTO[]> {
    const ativos = await this.ativos.findAll();
    return ativos.map(ativoToDTO);
  }
}
