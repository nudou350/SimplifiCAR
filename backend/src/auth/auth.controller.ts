import { Body, Controller, Inject, Post } from '@nestjs/common';
import {
  IDENTITY_PROVIDER,
  IdentityProvider,
} from './identity-provider.interface';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IdentityProvider,
  ) {}

  // POST /auth/govbr/mock  (contract §4.3) — no DB required.
  @Post('govbr/mock')
  async govbrMock(@Body() body: LoginDto) {
    return this.identityProvider.authenticate(body);
  }
}
