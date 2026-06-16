import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Guard de chave de API. O backend é uma superfície pública na nuvem e não tem login
 * próprio, então toda requisição precisa portar o header `x-api-key` igual à env `API_KEY`.
 * Só o frontend (que detém o segredo) consegue chamar a API; uma chamada direta sem o
 * header recebe 401. (CORS não basta — não barra clientes fora do navegador.)
 *
 * Sem `API_KEY` definida (dev local) o guard libera tudo, preservando o fluxo local.
 *
 * Rotas de saúde (`/health/*`) são isentas: o keep-alive é chamado pelo Vercel Cron, que não
 * porta o header `x-api-key`. A rota se protege por conta própria via `CRON_SECRET`. (spec RF-004, EC-3)
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly expectedKey = process.env.API_KEY?.trim();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.path.startsWith('/health')) {
      return true;
    }

    if (!this.expectedKey) {
      return true;
    }

    const provided = request.header('x-api-key');

    if (provided && provided === this.expectedKey) {
      return true;
    }

    throw new UnauthorizedException('API key inválida ou ausente.');
  }
}
