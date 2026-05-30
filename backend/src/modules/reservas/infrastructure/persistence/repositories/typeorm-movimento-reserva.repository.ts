import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovimentoReserva } from '../../../domain/entities/movimento-reserva';
import type { MovimentoReservaRepository } from '../../../domain/repositories/movimento-reserva.repository';
import { MovimentoReservaSchema } from '../entities/movimento-reserva.schema';
import { MovimentoReservaMapper } from '../mappers/movimento-reserva.mapper';

@Injectable()
export class TypeOrmMovimentoReservaRepository implements MovimentoReservaRepository {
  constructor(
    @InjectRepository(MovimentoReservaSchema)
    private readonly repo: Repository<MovimentoReservaSchema>,
  ) {}

  async save(movimento: MovimentoReserva): Promise<void> {
    await this.repo.save(MovimentoReservaMapper.toPersistence(movimento));
  }

  async findById(id: string): Promise<MovimentoReserva | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? MovimentoReservaMapper.toDomain(row) : null;
  }

  async findAll(): Promise<MovimentoReserva[]> {
    const rows = await this.repo.find({ order: { competencia: 'ASC' } });
    return rows.map(MovimentoReservaMapper.toDomain);
  }

  async findByBaldeId(baldeId: string): Promise<MovimentoReserva[]> {
    const rows = await this.repo.find({ where: { baldeId }, order: { competencia: 'ASC' } });
    return rows.map(MovimentoReservaMapper.toDomain);
  }

  async findByCompetencia(competencia: string): Promise<MovimentoReserva[]> {
    const rows = await this.repo.find({ where: { competencia }, order: { criadoEm: 'DESC' } });
    return rows.map(MovimentoReservaMapper.toDomain);
  }

  async existsByBaldeId(baldeId: string): Promise<boolean> {
    return (await this.repo.countBy({ baldeId })) > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
