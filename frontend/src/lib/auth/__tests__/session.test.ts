import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';

// `session.ts` importa `next/headers` no topo; mockamos para rodar fora do Next.
const cookieStore = new Map<string, { value: string }>();
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => cookieStore.get(name),
    set: (name: string, value: string) => cookieStore.set(name, { value }),
    delete: (name: string) => cookieStore.delete(name),
  }),
}));

import { signSession, verifySessionToken, sanitizeRedirectTo, getSession } from '../session';
import { SESSION_COOKIE } from '../config';

const SECRET = 'segredo-de-teste-com-mais-de-32-bytes-aqui!!';

beforeEach(() => {
  cookieStore.clear();
  process.env.APP_PASSWORD = 'senha-secreta';
  process.env.AUTH_SECRET = SECRET;
  process.env.AUTH_SESSION_TTL = '604800';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('signSession / verifySessionToken', () => {
  it('faz round-trip: token assinado é validado e traz sub=owner', async () => {
    const token = await signSession();
    expect(token).toBeTypeOf('string');
    const claims = await verifySessionToken(token);
    expect(claims?.sub).toBe('owner');
    expect(claims?.exp).toBeTypeOf('number');
  });

  it('rejeita token adulterado (assinatura inválida) → null', async () => {
    const token = await signSession();
    const tampered = `${token!.slice(0, -3)}aaa`;
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it('rejeita token expirado → null', async () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    const expired = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('owner')
      .setIssuedAt(past - 60)
      .setExpirationTime(past)
      .sign(new TextEncoder().encode(SECRET));
    expect(await verifySessionToken(expired)).toBeNull();
  });

  it('rejeita token assinado com segredo antigo após rotação → null', async () => {
    const token = await signSession();
    process.env.AUTH_SECRET = 'um-segredo-totalmente-diferente-com-32-bytes!!';
    expect(await verifySessionToken(token)).toBeNull();
  });

  it('retorna null quando a auth não está configurada (fail-safe)', async () => {
    delete process.env.AUTH_SECRET;
    expect(await signSession()).toBeNull();
    expect(await verifySessionToken('qualquer.coisa.aqui')).toBeNull();
  });
});

describe('getSession (via cookie)', () => {
  it('lê e valida o cookie de sessão', async () => {
    const token = await signSession();
    cookieStore.set(SESSION_COOKIE, { value: token! });
    const claims = await getSession();
    expect(claims?.sub).toBe('owner');
  });

  it('retorna null sem cookie', async () => {
    expect(await getSession()).toBeNull();
  });
});

describe('sanitizeRedirectTo', () => {
  it('aceita caminhos internos', () => {
    expect(sanitizeRedirectTo('/orcamento')).toBe('/orcamento');
    expect(sanitizeRedirectTo('/reservas?ano=2026')).toBe('/reservas?ano=2026');
  });

  it('rejeita open redirect e cai em "/"', () => {
    expect(sanitizeRedirectTo('//evil.com')).toBe('/');
    expect(sanitizeRedirectTo('https://evil.com')).toBe('/');
    expect(sanitizeRedirectTo('evil.com')).toBe('/');
    expect(sanitizeRedirectTo('/path\\with\\backslash')).toBe('/');
    expect(sanitizeRedirectTo(undefined)).toBe('/');
    expect(sanitizeRedirectTo('')).toBe('/');
  });
});
