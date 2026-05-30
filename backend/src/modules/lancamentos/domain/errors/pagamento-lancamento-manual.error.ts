import { LancamentoInvalidoError } from './lancamento-invalido.error';

/** Tentativa de marcar como pago um lançamento manual (sem origem em recorrência). */
export class PagamentoLancamentoManualError extends LancamentoInvalidoError {
  constructor() {
    super('Apenas recorrências podem ser marcadas como pagas.');
  }
}
