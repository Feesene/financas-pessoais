import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/** Envelope de saúde devolvido pelo keep-alive (spec §3, §4.1). */
interface KeepAliveResponse {
  status: 'ok' | 'error';
  db: 'up' | 'down';
  timestamp: string;
}

/**
 * Endpoint de keep-alive chamado 1×/dia pelo Vercel Cron (spec §4.1) para impedir que o
 * projeto Supabase seja pausado por inatividade. Executa uma consulta trivial (`SELECT 1`)
 * reusando o pool TypeORM já gerenciado — não abre conexões novas (spec EC-5).
 *
 * Isento do `ApiKeyGuard` pelo prefixo `/health` (spec RF-004). Quando `CRON_SECRET` está
 * definido, exige o header `Authorization: Bearer <CRON_SECRET>` que a Vercel injeta
 * automaticamente nas invocações de cron — bloqueando terceiros (spec RF-005, EC-4, EC-9).
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  private readonly cronSecret = process.env.CRON_SECRET?.trim();

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get('keepalive')
  @HttpCode(HttpStatus.OK)
  async keepalive(
    @Headers('authorization') authorization?: string,
  ): Promise<KeepAliveResponse> {
    this.assertCronSecret(authorization);

    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', db: 'up', timestamp: new Date().toISOString() };
    } catch (error) {
      this.logger.error(
        `Keep-alive falhou ao consultar o banco: ${(error as Error).message}`,
      );
      throw new HttpException(
        { status: 'error', db: 'down', timestamp: new Date().toISOString() },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Valida o segredo do cron quando `CRON_SECRET` está definido. Em dev local (sem a env)
   * a checagem é relaxada, espelhando o fail-open do `ApiKeyGuard` (spec EC-9).
   */
  private assertCronSecret(authorization?: string): void {
    if (!this.cronSecret) {
      return;
    }

    if (authorization !== `Bearer ${this.cronSecret}`) {
      throw new UnauthorizedException('Cron secret inválido ou ausente.');
    }
  }
}
