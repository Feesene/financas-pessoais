/**
 * Gate de autenticação (Edge Runtime). Protege todas as rotas de aplicação: sem sessão
 * válida, redireciona para `/login?redirectTo=<rota>`. Ver spec §1.1, RF-004, EC-8.
 *
 * Importa apenas `token.ts` (Edge-safe) — nunca `session.ts`/`next/headers`.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from './lib/auth/config';
import { verifySessionToken } from './lib/auth/token';

/** Rotas/prefixos liberados sem sessão (a própria tela de login). */
const PUBLIC_PATHS = ['/login'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (session) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = '';
  loginUrl.searchParams.set('redirectTo', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  /**
   * Allowlist de assets/infra via matcher negativo (EC-8): exclui os internos do Next
   * (`_next/static`, `_next/image`), o favicon e arquivos com extensão (assets estáticos).
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
