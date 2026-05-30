import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CotacaoAtivo } from '../../../domain/entities/cotacao-ativo';
import type { CotacaoAtivoRepository } from '../../../domain/repositories/cotacao-ativo.repository';
import { CotacaoAtivoSchema } from '../entities/cotacao-ativo.schema';
import { CotacaoAtivoMapper } from '../mappers/cotacao-ativo.mapper';

@Injectable()
export class TypeOrmCotacaoAtivoRepository implements CotacaoAtivoRepository {
  constructor(
    @InjectRepository(CotacaoAtivoSchema)
    private readonly repo: Repository<CotacaoAtivoSchema>,
  ) {}

  async save(cotacao: CotacaoAtivo): Promise<void> {
    await this.repo.save(CotacaoAtivoMapper.toPersistence(cotacao));
  }

  async findByAtivo(ativoId: string): Promise<CotacaoAtivo[]> {
    const rows = await this.repo.find({ where: { ativoId }, order: { competencia: 'ASC' } });
    return rows.map(CotacaoAtivoMapper.toDomain);
  }

  async findMaisRecentePorAtivo(ativoId: string): Promise<CotacaoAtivo | null> {
    const row = await this.repo.findOne({ where: { ativoId }, order: { competencia: 'DESC' } });
    return row ? CotacaoAtivoMapper.toDomain(row) : null;
  }

  async findByAtivoECompetencia(
    ativoId: string,
    competencia: string,
  ): Promise<CotacaoAtivo | null> {
    const row = await this.repo.findOne({ where: { ativoId, competencia } });
    return row ? CotacaoAtivoMapper.toDomain(row) : null;
  }

  async delete(ativoId: string, competencia: string): Promise<boolean> {
    const result = await this.repo.delete({ ativoId, competencia });
    return (result.affected ?? 0) > 0;
  }
}
