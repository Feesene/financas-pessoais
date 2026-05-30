/**
 * Registro das ocorrências de regra que foram excluídas manualmente.
 * Permite que a rematerialização de um mês não recrie uma ocorrência apagada.
 */
export interface OcorrenciaExcluidaRepository {
  /** Marca a ocorrência (regra, índice) como excluída. Idempotente. */
  registrar(origemRegraId: string, ocorrenciaIndice: number): Promise<void>;
  /** Indica se a ocorrência (regra, índice) foi excluída. */
  estaExcluida(origemRegraId: string, ocorrenciaIndice: number): Promise<boolean>;
}

export const OCORRENCIA_EXCLUIDA_REPOSITORY = Symbol('OcorrenciaExcluidaRepository');
