import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { MockGovBrProvider } from './mock-govbr.provider';
import { IDENTITY_PROVIDER } from './identity-provider.interface';

@Module({
  controllers: [AuthController],
  providers: [
    {
      // Swap MockGovBrProvider for a real OIDC provider here to go live.
      provide: IDENTITY_PROVIDER,
      useClass: MockGovBrProvider,
    },
  ],
})
export class AuthModule {}
