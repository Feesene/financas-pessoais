import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { OcorrenciaExcluidaRepository } from '../../../domain/repositories/ocorrencia-excluida.repository';
import { OcorrenciaExcluidaSchema } from '../entities/ocorrencia-excluida.schema';

@Injectable()
export class TypeOrmOcorrenciaExcluidaRepository implements OcorrenciaExcluidaRepository {
  constructor(
    @InjectRepository(OcorrenciaExcluidaSchema)
    private readonly repo: Repository<OcorrenciaExcluidaSchema>,
  ) {}

  async registrar(origemRegraId: string, ocorrenciaIndice: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .values({ origemRegraId, ocorrenciaIndice })
      .orIgnore()
      .execute();
  }

  async estaExcluida(origemRegraId: string, ocorrenciaIndice: number): Promise<boolean> {
    return this.repo.existsBy({ origemRegraId, ocorrenciaIndice });
  }
}
