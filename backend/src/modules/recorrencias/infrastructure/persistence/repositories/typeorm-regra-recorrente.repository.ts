import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegraRecorrente } from '../../../domain/entities/regra-recorrente';
import type { RegraRecorrenteRepository } from '../../../domain/repositories/regra-recorrente.repository';
import { RegraRecorrenteSchema } from '../entities/regra-recorrente.schema';
import { RegraRecorrenteMapper } from '../mappers/regra-recorrente.mapper';

@Injectable()
export class TypeOrmRegraRecorrenteRepository implements RegraRecorrenteRepository {
  constructor(
    @InjectRepository(RegraRecorrenteSchema)
    private readonly repo: Repository<RegraRecorrenteSchema>,
  ) {}

  async save(regra: RegraRecorrente): Promise<void> {
    await this.repo.save(RegraRecorrenteMapper.toPersistence(regra));
  }

  async findAll(): Promise<RegraRecorrente[]> {
    const rows = await this.repo.find({ order: { competenciaInicio: 'DESC' } });
    return rows.map(RegraRecorrenteMapper.toDomain);
  }

  async findById(id: string): Promise<RegraRecorrente | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? RegraRecorrenteMapper.toDomain(row) : null;
  }

  async findAtivasNaCompetencia(competencia: string): Promise<RegraRecorrente[]> {
    const rows = await this.repo
      .createQueryBuilder('regra')
      .where('regra.ativa = :ativa', { ativa: true })
      .andWhere('regra.competenciaInicio <= :competencia', { competencia })
      .andWhere('(regra.competenciaFim IS NULL OR regra.competenciaFim >= :competencia)', {
        competencia,
      })
      .getMany();
    // O limite de parcela (índice <= N) é reavaliado no domínio via ativaEmCompetencia.
    return rows.map(RegraRecorrenteMapper.toDomain);
  }
}
