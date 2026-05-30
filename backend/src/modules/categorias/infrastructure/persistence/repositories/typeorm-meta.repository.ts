import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetaMensal } from '../../../domain/entities/meta-mensal';
import type { MetaRepository } from '../../../domain/repositories/meta.repository';
import { MetaMensalSchema } from '../entities/meta-mensal.schema';
import { MetaMensalMapper } from '../mappers/meta-mensal.mapper';

@Injectable()
export class TypeOrmMetaRepository implements MetaRepository {
  constructor(
    @InjectRepository(MetaMensalSchema)
    private readonly repo: Repository<MetaMensalSchema>,
  ) {}

  async save(meta: MetaMensal): Promise<void> {
    // Upsert por (categoriaId, competencia): remove a existente e grava a nova.
    const existente = await this.repo.findOne({
      where: { categoriaId: meta.categoriaId, competencia: meta.competencia },
    });
    if (existente && existente.id !== meta.id) {
      await this.repo.delete({ id: existente.id });
    }
    await this.repo.save(MetaMensalMapper.toPersistence(meta));
  }

  async findByCompetencia(competencia: string): Promise<MetaMensal[]> {
    const rows = await this.repo.find({ where: { competencia } });
    return rows.map(MetaMensalMapper.toDomain);
  }

  async findByCategoriaECompetencia(
    categoriaId: string,
    competencia: string,
  ): Promise<MetaMensal | null> {
    const row = await this.repo.findOne({ where: { categoriaId, competencia } });
    return row ? MetaMensalMapper.toDomain(row) : null;
  }

  async delete(categoriaId: string, competencia: string): Promise<boolean> {
    const result = await this.repo.delete({ categoriaId, competencia });
    return (result.affected ?? 0) > 0;
  }
}
