import { RegraRecorrente, type RegraRecorrenteProps } from './regra-recorrente';
import { RegraRecorrenteInvalidaError } from '../errors/regra-recorrente-invalida.error';

function base(overrides: Partial<RegraRecorrenteProps> = {}): RegraRecorrenteProps {
  return {
    id: 'r-1',
    tipo: 'DESPESA',
    categoriaId: 'c-1',
    descricao: null,
    valorBase: 100,
    frequencia: 'MENSAL',
    competenciaInicio: '2026-01',
    competenciaFim: null,
    numeroParcelas: null,
    ativa: true,
    ...overrides,
  };
}

describe('RegraRecorrente.criar', () => {
  it('rejeita valor <= 0', () => {
    expect(() => RegraRecorrente.criar(base({ valorBase: 0 }))).toThrow(
      RegraRecorrenteInvalidaError,
    );
  });

  it('rejeita frequência diferente de MENSAL', () => {
    expect(() =>
      RegraRecorrente.criar(base({ frequencia: 'SEMANAL' as never })),
    ).toThrow(RegraRecorrenteInvalidaError);
  });

  it('rejeita competência de início mal formatada', () => {
    expect(() => RegraRecorrente.criar(base({ competenciaInicio: '2026/01' }))).toThrow(
      RegraRecorrenteInvalidaError,
    );
  });

  it('rejeita fim anterior ao início', () => {
    expect(() =>
      RegraRecorrente.criar(base({ competenciaInicio: '2026-05', competenciaFim: '2026-04' })),
    ).toThrow(RegraRecorrenteInvalidaError);
  });

  it('rejeita número de parcelas inválido', () => {
    expect(() => RegraRecorrente.criar(base({ numeroParcelas: 0 }))).toThrow(
      RegraRecorrenteInvalidaError,
    );
    expect(() => RegraRecorrente.criar(base({ numeroParcelas: 1.5 }))).toThrow(
      RegraRecorrenteInvalidaError,
    );
  });

  it('normaliza descrição em branco para null', () => {
    const regra = RegraRecorrente.criar(base({ descricao: '   ' }));
    expect(regra.descricao).toBeNull();
  });
});

describe('RegraRecorrente.ativaEmCompetencia (recorrência sem fim)', () => {
  const regra = RegraRecorrente.criar(base({ competenciaInicio: '2026-03' }));

  it('não materializa antes do início', () => {
    expect(regra.ativaEmCompetencia('2026-02')).toBe(false);
  });

  it('materializa no mês de início', () => {
    expect(regra.ativaEmCompetencia('2026-03')).toBe(true);
  });

  it('materializa meses depois', () => {
    expect(regra.ativaEmCompetencia('2027-01')).toBe(true);
  });

  it('não materializa quando inativa', () => {
    const inativa = RegraRecorrente.criar(base({ competenciaInicio: '2026-03', ativa: false }));
    expect(inativa.ativaEmCompetencia('2026-04')).toBe(false);
  });
});

describe('RegraRecorrente.ativaEmCompetencia (recorrência com fim)', () => {
  const regra = RegraRecorrente.criar(
    base({ competenciaInicio: '2026-01', competenciaFim: '2026-06' }),
  );

  it('materializa dentro do intervalo', () => {
    expect(regra.ativaEmCompetencia('2026-06')).toBe(true);
  });

  it('não materializa após o fim', () => {
    expect(regra.ativaEmCompetencia('2026-07')).toBe(false);
  });
});

describe('RegraRecorrente.ativaEmCompetencia (parcelamento)', () => {
  const regra = RegraRecorrente.criar(
    base({ competenciaInicio: '2026-01', numeroParcelas: 3, valorBase: 100 }),
  );

  it('materializa as N competências', () => {
    expect(regra.ativaEmCompetencia('2026-01')).toBe(true);
    expect(regra.ativaEmCompetencia('2026-02')).toBe(true);
    expect(regra.ativaEmCompetencia('2026-03')).toBe(true);
  });

  it('não materializa além de N', () => {
    expect(regra.ativaEmCompetencia('2026-04')).toBe(false);
  });

  it('indiceNaCompetencia é 1-based a partir do início', () => {
    expect(regra.indiceNaCompetencia('2026-01')).toBe(1);
    expect(regra.indiceNaCompetencia('2026-03')).toBe(3);
  });
});

describe('RegraRecorrente.valorDaOcorrencia', () => {
  it('recorrência retorna sempre o valor base', () => {
    const regra = RegraRecorrente.criar(base({ valorBase: 250 }));
    expect(regra.valorDaOcorrencia(1)).toBe(250);
    expect(regra.valorDaOcorrencia(99)).toBe(250);
  });

  it('distribui parcelas com resíduo na última (100/3)', () => {
    const regra = RegraRecorrente.criar(base({ valorBase: 100, numeroParcelas: 3 }));
    expect(regra.valorDaOcorrencia(1)).toBe(33.33);
    expect(regra.valorDaOcorrencia(2)).toBe(33.33);
    expect(regra.valorDaOcorrencia(3)).toBe(33.34);
  });

  it('soma das parcelas é igual ao total', () => {
    const total = 100;
    const n = 3;
    const regra = RegraRecorrente.criar(base({ valorBase: total, numeroParcelas: n }));
    let soma = 0;
    for (let i = 1; i <= n; i++) soma += regra.valorDaOcorrencia(i);
    expect(Number(soma.toFixed(2))).toBe(total);
  });

  it('divisão exata distribui igualmente', () => {
    const regra = RegraRecorrente.criar(base({ valorBase: 90, numeroParcelas: 3 }));
    expect(regra.valorDaOcorrencia(1)).toBe(30);
    expect(regra.valorDaOcorrencia(3)).toBe(30);
  });
});

describe('RegraRecorrente.labelOcorrencia', () => {
  it('retorna k/N para parcelamento', () => {
    const regra = RegraRecorrente.criar(base({ numeroParcelas: 12 }));
    expect(regra.labelOcorrencia(3)).toBe('3/12');
  });

  it('retorna null para recorrência', () => {
    const regra = RegraRecorrente.criar(base());
    expect(regra.labelOcorrencia(3)).toBeNull();
  });
});

describe('RegraRecorrente.encerrar / comFim', () => {
  it('encerrar marca inativa preservando o resto', () => {
    const regra = RegraRecorrente.criar(base());
    const encerrada = regra.encerrar();
    expect(encerrada.ativa).toBe(false);
    expect(encerrada.id).toBe(regra.id);
  });

  it('comFim define o fim e mantém ativa', () => {
    const regra = RegraRecorrente.criar(base({ competenciaInicio: '2026-01' }));
    const comFim = regra.comFim('2026-04');
    expect(comFim.competenciaFim).toBe('2026-04');
    expect(comFim.ativa).toBe(true);
    expect(comFim.ativaEmCompetencia('2026-05')).toBe(false);
  });
});
