import type {
  ComparacaoMesesDTO,
  ConsolidadoDTO,
  EvolucaoMensalItemDTO,
  FormatoExportacao,
  GastoPorCategoriaItemDTO,
  PrevistoPagoItemDTO,
} from '@financas-pessoais/shared';
import { unwrap } from './http';
import * as actions from './actions/relatorios';

export const relatoriosApi = {
  async consolidadoPorAno(ano: number): Promise<ConsolidadoDTO> {
    return unwrap(await actions.consolidadoPorAno(ano));
  },

  async consolidado(de: string, ate: string): Promise<ConsolidadoDTO> {
    return unwrap(await actions.consolidadoPorIntervalo(de, ate));
  },

  async porCategoria(de: string, ate: string): Promise<GastoPorCategoriaItemDTO[]> {
    return unwrap(await actions.porCategoria(de, ate));
  },

  async evolucao(de: string, ate: string): Promise<EvolucaoMensalItemDTO[]> {
    return unwrap(await actions.evolucao(de, ate));
  },

  async previstoPago(de: string, ate: string): Promise<PrevistoPagoItemDTO[]> {
    return unwrap(await actions.previstoPago(de, ate));
  },

  async comparar(a: string, b: string): Promise<ComparacaoMesesDTO> {
    return unwrap(await actions.comparar(a, b));
  },

  /** Baixa o consolidado no formato escolhido e dispara o download no navegador. */
  async exportar(formato: FormatoExportacao, de: string, ate: string): Promise<void> {
    const { base64, contentType } = unwrap(await actions.exportarRelatorio(formato, de, ate));

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: contentType });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `consolidado-${de}-a-${ate}.${formato}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  },
};
