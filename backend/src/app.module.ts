import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { PropriedadesModule } from './propriedades/propriedades.module';
import { DiagnosticosModule } from './diagnosticos/diagnosticos.module';
import { MarketplaceModule } from './marketplace/marketplace.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    PropriedadesModule,
    DiagnosticosModule,
    MarketplaceModule,
  ],
})
export class AppModule {}
