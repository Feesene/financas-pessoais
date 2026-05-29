// Base para erros de domínio, lançados pelas regras de negócio.
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
