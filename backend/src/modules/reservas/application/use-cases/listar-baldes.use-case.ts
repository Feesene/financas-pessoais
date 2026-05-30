import { Inject, Injectable } from '@nestjs/common';
import type { BaldeDTO } from '@financas-pessoais/shared';
import { BALDE_REPOSITORY, type BaldeRepository } from '../../domain/repositories/balde.repository';
import { baldeToDTO } from './criar-balde.use-case';

@Injectable()
export class ListarBaldesUseCase {
  constructor(@Inject(BALDE_REPOSITORY) private readonly baldes: BaldeRepository) {}

  async execute(): Promise<BaldeDTO[]> {
    const baldes = await this.baldes.findAll();
    return baldes.map(baldeToDTO);
  }
}
