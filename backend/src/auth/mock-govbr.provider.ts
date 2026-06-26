import { Injectable } from '@nestjs/common';
import { AuthResult, IdentityProvider } from './identity-provider.interface';

/**
 * Fixed gov.br mock for the MVP. Returns the seeded demo user "João C."
 * regardless of input. Confirms identity only — it does NOT fetch the CAR;
 * the property link comes from the cod_imovel or the `.RET` upload.
 */
@Injectable()
export class MockGovBrProvider implements IdentityProvider {
  async authenticate(): Promise<AuthResult> {
    return {
      token: 'mock-jwt',
      usuario: {
        id: 1,
        nome: 'João C.',
        cpf: '***.***.***-**',
        confiabilidade: 'ouro',
      },
    };
  }
}
