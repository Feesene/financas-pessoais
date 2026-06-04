'use server';

import type { CategoriaDTO, ConsumoCategoriaDTO, MetaMensalDTO } from '@financas-pessoais/shared';
import { apiRequest, type ApiResult } from '../core';
import type { AtualizarCategoriaBody, CriarCategoriaBody, DefinirMetaBody } from '../categorias';

export async function listarCategorias(): Promise<ApiResult<CategoriaDTO[]>> {
  return apiRequest<CategoriaDTO[]>('/categorias');
}

export async function criarCategoria(body: CriarCategoriaBody): Promise<ApiResult<CategoriaDTO>> {
  return apiRequest<CategoriaDTO>('/categorias', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function atualizarCategoria(
  id: string,
  body: AtualizarCategoriaBody,
): Promise<ApiResult<CategoriaDTO>> {
  return apiRequest<CategoriaDTO>(`/categorias/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function excluirCategoria(id: string): Promise<ApiResult<void>> {
  return apiRequest<void>(`/categorias/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function definirMeta(
  id: string,
  body: DefinirMetaBody,
): Promise<ApiResult<MetaMensalDTO>> {
  return apiRequest<MetaMensalDTO>(`/categorias/${encodeURIComponent(id)}/metas`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function removerMeta(id: string, competencia: string): Promise<ApiResult<void>> {
  return apiRequest<void>(
    `/categorias/${encodeURIComponent(id)}/metas?competencia=${encodeURIComponent(competencia)}`,
    { method: 'DELETE' },
  );
}

export async function consumoCategorias(
  competencia: string,
): Promise<ApiResult<ConsumoCategoriaDTO[]>> {
  return apiRequest<ConsumoCategoriaDTO[]>(
    `/categorias/consumo?competencia=${encodeURIComponent(competencia)}`,
  );
}
