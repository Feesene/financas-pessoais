'use server';

import type {
  ConsumoCategoriaDTO,
  EvolucaoMensalItemDTO,
  EvolucaoReservaItemDTO,
  GastoPorCategoriaItemDTO,
  PosicaoCarteiraDTO,
  PrevistoPagoItemDTO,
  ResumoMensalDTO,
  SaldosReservaDTO,
} from '@financas-pessoais/shared';
import { apiRequest, type ApiResult } from '../core';
import { mesAnterior } from '../../competencia';
import type { DashboardData } from '../dashboard';

/**
 * Carrega todos os dados do painel em uma única server action. Actions
 * disparadas do cliente são serializadas pelo React, então agregar a
 * materialização do ano e as oito consultas aqui troca ~20 idas ao servidor
 * por uma só — no servidor as consultas rodam em paralelo contra a API.
 */
export async function carregarDashboard(competencia: string): Promise<ApiResult<DashboardData>> {
  const ano = competencia.slice(0, 4);

  // Materializa o ano inteiro em uma chamada (alimenta resumo, consumo e
  // previsto vs pago). Falha aqui não impede a leitura do painel existente.
  await apiRequest('/recorrencias/materializar', {
    method: 'POST',
    body: JSON.stringify({ competencia: `${ano}-01`, ate: `${ano}-12` }),
  });

  let inicio6m = competencia;
  for (let i = 0; i < 5; i++) inicio6m = mesAnterior(inicio6m);

  const comp = encodeURIComponent(competencia);
  const [
    resumo,
    consumo,
    evolucao,
    porCategoria,
    reservas,
    carteira,
    evolucaoReservas,
    previstoPago,
  ] = await Promise.all([
    apiRequest<ResumoMensalDTO>(`/lancamentos/resumo?competencia=${comp}`),
    apiRequest<ConsumoCategoriaDTO[]>(`/categorias/consumo?competencia=${comp}`),
    apiRequest<EvolucaoMensalItemDTO[]>(`/relatorios/evolucao?de=${inicio6m}&ate=${comp}`),
    apiRequest<GastoPorCategoriaItemDTO[]>(`/relatorios/por-categoria?de=${comp}&ate=${comp}`),
    apiRequest<SaldosReservaDTO>('/reservas/saldos'),
    apiRequest<PosicaoCarteiraDTO>('/carteira/posicao'),
    apiRequest<EvolucaoReservaItemDTO[]>(`/reservas/evolucao-anual?ano=${ano}`),
    apiRequest<PrevistoPagoItemDTO[]>(`/relatorios/previsto-pago?de=${ano}-01&ate=${ano}-12`),
  ]);

  if (!resumo.ok) return resumo;
  if (!consumo.ok) return consumo;
  if (!evolucao.ok) return evolucao;
  if (!porCategoria.ok) return porCategoria;
  if (!reservas.ok) return reservas;
  if (!carteira.ok) return carteira;
  if (!evolucaoReservas.ok) return evolucaoReservas;
  if (!previstoPago.ok) return previstoPago;

  return {
    ok: true,
    data: {
      resumo: resumo.data,
      consumo: consumo.data,
      evolucao: evolucao.data,
      porCategoria: porCategoria.data,
      reservas: reservas.data,
      carteira: carteira.data,
      evolucaoReservas: evolucaoReservas.data,
      previstoPago: previstoPago.data,
    },
  };
}
