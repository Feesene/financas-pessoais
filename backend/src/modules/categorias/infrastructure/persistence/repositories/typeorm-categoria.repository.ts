import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TipoLancamento } from '@financas-pessoais/shared';
import { Categoria } from '../../../domain/entities/categoria';
import type { CategoriaRepository } from '../../../domain/repositories/categoria.repository';
import { CategoriaSchema } from '../entities/categoria.schema';
import { CategoriaMapper } from '../mappers/categoria.mapper';

@Injectable()
export class TypeOrmCategoriaRepository implements CategoriaRepository {
  constructor(
    @InjectRepository(CategoriaSchema)
    private readonly repo: Repository<CategoriaSchema>,
  ) {}

  async save(categoria: Categoria): Promise<void> {
    await this.repo.save(CategoriaMapper.toPersistence(categoria));
  }

  async findAll(): Promise<Categoria[]> {
    const rows = await this.repo.find({ order: { tipo: 'ASC', nome: 'ASC' } });
    return rows.map(CategoriaMapper.toDomain);
  }

  async findById(id: string): Promise<Categoria | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? CategoriaMapper.toDomain(row) : null;
  }

  async findByNomeETipo(nome: string, tipo: TipoLancamento): Promise<Categoria | null> {
    const row = await this.repo.findOne({ where: { nome: nome.trim(), tipo } });
    return row ? CategoriaMapper.toDomain(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
