import { parseCorsOrigins } from './app-setup';

describe('parseCorsOrigins', () => {
  it('divide a lista por vírgula e apara os espaços', () => {
    const env = { CORS_ORIGINS: ' https://a.vercel.app , https://b.vercel.app ' } as NodeJS.ProcessEnv;
    expect(parseCorsOrigins(env)).toEqual(['https://a.vercel.app', 'https://b.vercel.app']);
  });

  it('ignora entradas vazias entre vírgulas', () => {
    const env = { CORS_ORIGINS: 'https://a.vercel.app,,' } as NodeJS.ProcessEnv;
    expect(parseCorsOrigins(env)).toEqual(['https://a.vercel.app']);
  });

  it('falha fechada em produção sem CORS_ORIGINS (bloqueia tudo)', () => {
    const env = { NODE_ENV: 'production' } as NodeJS.ProcessEnv;
    expect(parseCorsOrigins(env)).toEqual([]);
  });

  it('libera qualquer origem fora de produção quando CORS_ORIGINS está ausente', () => {
    const env = { NODE_ENV: 'development' } as NodeJS.ProcessEnv;
    expect(parseCorsOrigins(env)).toEqual(['*']);
  });
});
