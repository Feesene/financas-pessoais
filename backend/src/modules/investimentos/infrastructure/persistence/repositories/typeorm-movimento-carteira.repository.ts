import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovimentoCarteira } from '../../../domain/entities/movimento-carteira';
import type { MovimentoCarteiraRepository } from '../../../domain/repositories/movimento-carteira.repository';
import { MovimentoCarteiraSchema } from '../entities/movimento-carteira.schema';
import { MovimentoCarteiraMapper } from '../mappers/movimento-carteira.mapper';

@Injectable()
export class TypeOrmMovimentoCarteiraRepository implements MovimentoCarteiraRepository {
  constructor(
    @InjectRepository(MovimentoCarteiraSchema)
    private readonly repo: Repository<MovimentoCarteiraSchema>,
  ) {}

  async save(movimento: MovimentoCarteira): Promise<void> {
    await this.repo.save(MovimentoCarteiraMapper.toPersistence(movimento));
  }

  async findById(id: string): Promise<MovimentoCarteira | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? MovimentoCarteiraMapper.toDomain(row) : null;
  }

  async findAll(): Promise<MovimentoCarteira[]> {
    const rows = await this.repo.find({ order: { competencia: 'ASC' } });
    return rows.map(MovimentoCarteiraMapper.toDomain);
  }

  async findByAtivoId(ativoId: string): Promise<MovimentoCarteira[]> {
    const rows = await this.repo.find({ where: { ativoId }, order: { competencia: 'ASC' } });
    return rows.map(MovimentoCarteiraMapper.toDomain);
  }

  async existsByAtivoId(ativoId: string): Promise<boolean> {
    return (await this.repo.countBy({ ativoId })) > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
