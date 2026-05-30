import type { MovimentoCarteira } from '../entities/movimento-carteira';

export interface MovimentoCarteiraRepository {
  save(movimento: MovimentoCarteira): Promise<void>;
  findById(id: string): Promise<MovimentoCarteira | null>;
  findAll(): Promise<MovimentoCarteira[]>;
  findByAtivoId(ativoId: string): Promise<MovimentoCarteira[]>;
  /** true se o ativo possui ao menos um movimento. */
  existsByAtivoId(ativoId: string): Promise<boolean>;
  /** Remove um movimento; retorna false se o id não existir. */
  delete(id: string): Promise<boolean>;
}

export const MOVIMENTO_CARTEIRA_REPOSITORY = Symbol('MovimentoCarteiraRepository');
