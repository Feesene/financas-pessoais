import { calcularJurosCompostos } from './calcular-juros-compostos';

describe('calcularJurosCompostos', () => {
  it('retorna uma linha por ano', () => {
    const linhas = calcularJurosCompostos({
      entrada: 0,
      aporteMensal: 100,
      taxaAnual: 0.1,
      anos: 3,
    });
    expect(linhas.map((l) => l.ano)).toEqual([1, 2, 3]);
  });

  it('com taxa 0, investido = não investido em todos os anos', () => {
    const linhas = calcularJurosCompostos({
      entrada: 1000,
      aporteMensal: 200,
      taxaAnual: 0,
      anos: 5,
    });
    for (const linha of linhas) {
      expect(linha.saldoInvestido).toBeCloseTo(linha.saldoNaoInvestido, 8);
      expect(linha.jurosAcumulados).toBeCloseTo(0, 8);
    }
    const ultimo = linhas[linhas.length - 1];
    // entrada + aporte * 60 meses.
    expect(ultimo.totalAportado).toBe(1000 + 200 * 60);
  });

  it('aporte 0: só a entrada capitaliza (juros compostos puros)', () => {
    const linhas = calcularJurosCompostos({
      entrada: 1000,
      aporteMensal: 0,
      taxaAnual: 0.1,
      anos: 1,
    });
    const ano1 = linhas[0];
    expect(ano1.totalAportado).toBe(1000);
    expect(ano1.saldoNaoInvestido).toBe(1000);
    // Após 12 meses à taxa mensal equivalente, o saldo equivale à taxa anual: 1000 * 1.1.
    expect(ano1.saldoInvestido).toBeCloseTo(1100, 6);
    expect(ano1.jurosAcumulados).toBeCloseTo(100, 6);
  });

  it('entrada 0 e aporte 0: todos os saldos zerados', () => {
    const linhas = calcularJurosCompostos({
      entrada: 0,
      aporteMensal: 0,
      taxaAnual: 0.15,
      anos: 10,
    });
    for (const linha of linhas) {
      expect(linha.saldoInvestido).toBe(0);
      expect(linha.saldoNaoInvestido).toBe(0);
      expect(linha.jurosAcumulados).toBe(0);
    }
  });

  it('aporte ao fim do mês: valor confere com a fórmula da anuidade ordinary', () => {
    const taxaAnual = 0.12;
    const aporteMensal = 500;
    const anos = 2;
    const linhas = calcularJurosCompostos({ entrada: 0, aporteMensal, taxaAnual, anos });

    const i = Math.pow(1 + taxaAnual, 1 / 12) - 1;
    const n = anos * 12;
    const esperado = aporteMensal * ((Math.pow(1 + i, n) - 1) / i);

    expect(linhas[anos - 1].saldoInvestido).toBeCloseTo(esperado, 2);
  });

  it('jurosAcumulados = saldoInvestido − totalAportado', () => {
    const linhas = calcularJurosCompostos({
      entrada: 2000,
      aporteMensal: 300,
      taxaAnual: 0.08,
      anos: 4,
    });
    for (const linha of linhas) {
      expect(linha.jurosAcumulados).toBeCloseTo(linha.saldoInvestido - linha.totalAportado, 8);
    }
  });

  it('60 anos com taxa alta permanece finito (sem overflow)', () => {
    const linhas = calcularJurosCompostos({
      entrada: 1000,
      aporteMensal: 1000,
      taxaAnual: 0.5,
      anos: 60,
    });
    const ultimo = linhas[linhas.length - 1];
    expect(Number.isFinite(ultimo.saldoInvestido)).toBe(true);
  });
});
