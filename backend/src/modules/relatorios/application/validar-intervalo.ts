import { isCompetenciaValida } from '../domain/competencia';
import { IntervaloInvalidoError } from './errors/intervalo-invalido.error';

/** Valida um intervalo [de, ate] de competências; lança IntervaloInvalidoError se inválido. */
export function validarIntervalo(de: string, ate: string): void {
  if (!isCompetenciaValida(de) || !isCompetenciaValida(ate)) {
    throw new IntervaloInvalidoError('As competências devem estar no formato AAAA-MM.');
  }
  if (de > ate) {
    throw new IntervaloInvalidoError('A competência inicial não pode ser posterior à final.');
  }
}

/** Valida uma única competência; lança IntervaloInvalidoError se inválida. */
export function validarCompetencia(competencia: string, rotulo: string): void {
  if (!isCompetenciaValida(competencia)) {
    throw new IntervaloInvalidoError(`A competência ${rotulo} deve estar no formato AAAA-MM.`);
  }
}
