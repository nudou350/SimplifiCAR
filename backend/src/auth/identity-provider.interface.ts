/**
 * Abstraction over the identity source. The MVP ships a gov.br mock, but any
 * real OIDC (Authorization Code + PKCE) provider can implement this interface
 * and be swapped in via the IDENTITY_PROVIDER token without touching callers.
 */
export interface AuthenticatedUser {
  id: number;
  nome: string;
  cpf: string;
  confiabilidade: 'prata' | 'ouro';
}

export interface AuthResult {
  token: string;
  usuario: AuthenticatedUser;
}

export interface IdentityProvider {
  authenticate(input?: { codImovel?: string }): Promise<AuthResult>;
}

export const IDENTITY_PROVIDER = Symbol('IDENTITY_PROVIDER');
