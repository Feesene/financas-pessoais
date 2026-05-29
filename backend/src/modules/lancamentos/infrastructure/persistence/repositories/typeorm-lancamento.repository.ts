import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lancamento } from '../../../domain/entities/lancamento';
import type { LancamentoRepository } from '../../../domain/repositories/lancamento.repository';
import { LancamentoSchema } from '../entities/lancamento.schema';
import { LancamentoMapper } from '../mappers/lancamento.mapper';

@Injectable()
export class TypeOrmLancamentoRepository implements LancamentoRepository {
  constructor(
    @InjectRepository(LancamentoSchema)
    private readonly repo: Repository<LancamentoSchema>,
  ) {}

  async save(lancamento: Lancamento): Promise<void> {
    await this.repo.save(LancamentoMapper.toPersistence(lancamento));
  }

  async findByCompetencia(competencia: string): Promise<Lancamento[]> {
    const rows = await this.repo.find({ where: { competencia } });
    return rows.map(LancamentoMapper.toDomain);
  }

  async findById(id: string): Promise<Lancamento | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? LancamentoMapper.toDomain(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
