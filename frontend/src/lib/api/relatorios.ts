import type {
  ComparacaoMesesDTO,
  ConsolidadoDTO,
  EvolucaoMensalItemDTO,
  FormatoExportacao,
  GastoPorCategoriaItemDTO,
  PrevistoPagoItemDTO,
} from '@financas-pessoais/shared';
import { API_URL, ApiError, request } from './http';

function intervalo(de: string, ate: string): string {
  return `de=${encodeURIComponent(de)}&ate=${encodeURIComponent(ate)}`;
}

export const relatoriosApi = {
  consolidadoPorAno(ano: number): Promise<ConsolidadoDTO> {
    return request<ConsolidadoDTO>(`/relatorios/consolidado?ano=${ano}`);
  },

  consolidado(de: string, ate: string): Promise<ConsolidadoDTO> {
    return request<ConsolidadoDTO>(`/relatorios/consolidado?${intervalo(de, ate)}`);
  },

  porCategoria(de: string, ate: string): Promise<GastoPorCategoriaItemDTO[]> {
    return request<GastoPorCategoriaItemDTO[]>(`/relatorios/por-categoria?${intervalo(de, ate)}`);
  },

  evolucao(de: string, ate: string): Promise<EvolucaoMensalItemDTO[]> {
    return request<EvolucaoMensalItemDTO[]>(`/relatorios/evolucao?${intervalo(de, ate)}`);
  },

  previstoPago(de: string, ate: string): Promise<PrevistoPagoItemDTO[]> {
    return request<PrevistoPagoItemDTO[]>(`/relatorios/previsto-pago?${intervalo(de, ate)}`);
  },

  comparar(a: string, b: string): Promise<ComparacaoMesesDTO> {
    return request<ComparacaoMesesDTO>(
      `/relatorios/comparar?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`,
    );
  },

  /** Baixa o consolidado no formato escolhido e dispara o download no navegador. */
  async exportar(formato: FormatoExportacao, de: string, ate: string): Promise<void> {
    const url = `${API_URL}/relatorios/exportar?formato=${formato}&${intervalo(de, ate)}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new ApiError(response.status, `Erro ${response.status} ao exportar relatório.`);
    }

    const blob = await response.blob();
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
