import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ativo } from '../../../domain/entities/ativo';
import type { AtivoRepository } from '../../../domain/repositories/ativo.repository';
import { AtivoSchema } from '../entities/ativo.schema';
import { AtivoMapper } from '../mappers/ativo.mapper';

@Injectable()
export class TypeOrmAtivoRepository implements AtivoRepository {
  constructor(
    @InjectRepository(AtivoSchema)
    private readonly repo: Repository<AtivoSchema>,
  ) {}

  async save(ativo: Ativo): Promise<void> {
    await this.repo.save(AtivoMapper.toPersistence(ativo));
  }

  async findAll(): Promise<Ativo[]> {
    const rows = await this.repo.find({ order: { tipo: 'ASC', descricao: 'ASC' } });
    return rows.map(AtivoMapper.toDomain);
  }

  async findById(id: string): Promise<Ativo | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? AtivoMapper.toDomain(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
