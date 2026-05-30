import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Balde } from '../../../domain/entities/balde';
import type { BaldeRepository } from '../../../domain/repositories/balde.repository';
import { BaldeSchema } from '../entities/balde.schema';
import { BaldeMapper } from '../mappers/balde.mapper';

@Injectable()
export class TypeOrmBaldeRepository implements BaldeRepository {
  constructor(
    @InjectRepository(BaldeSchema)
    private readonly repo: Repository<BaldeSchema>,
  ) {}

  async save(balde: Balde): Promise<void> {
    await this.repo.save(BaldeMapper.toPersistence(balde));
  }

  async findAll(): Promise<Balde[]> {
    const rows = await this.repo.find({ order: { nome: 'ASC' } });
    return rows.map(BaldeMapper.toDomain);
  }

  async findById(id: string): Promise<Balde | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? BaldeMapper.toDomain(row) : null;
  }

  async findByNome(nome: string): Promise<Balde | null> {
    const row = await this.repo.findOne({ where: { nome: ILike(nome.trim()) } });
    return row ? BaldeMapper.toDomain(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
