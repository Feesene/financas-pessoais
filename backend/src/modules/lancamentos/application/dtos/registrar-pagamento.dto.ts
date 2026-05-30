import type { LancamentoDTO } from '@financas-pessoais/shared';

export interface RegistrarPagamentoInput {
  id: string;
  pago: boolean;
  valorPago?: number | null;
}

export type RegistrarPagamentoOutput = LancamentoDTO;
