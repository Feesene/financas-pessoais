import type { OcorrenciaExcluidaRepository } from '../src/modules/lancamentos/domain/repositories/ocorrencia-excluida.repository';

/** Registro em memória de ocorrências excluídas, para testes. */
export class InMemoryOcorrenciaExcluidaRepository implements OcorrenciaExcluidaRepository {
  private readonly store = new Set<string>();

  private chave(origemRegraId: string, ocorrenciaIndice: number): string {
    return `${origemRegraId}#${ocorrenciaIndice}`;
  }

  async registrar(origemRegraId: string, ocorrenciaIndice: number): Promise<void> {
    this.store.add(this.chave(origemRegraId, ocorrenciaIndice));
  }

  async estaExcluida(origemRegraId: string, ocorrenciaIndice: number): Promise<boolean> {
    return this.store.has(this.chave(origemRegraId, ocorrenciaIndice));
  }
}
