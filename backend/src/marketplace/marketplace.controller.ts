import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { CreateMatchDto } from './dto/create-match.dto';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}

  // GET /marketplace/ofertas?tipo=&bioma= (contract §4.4)
  @Get('ofertas')
  async listOfertas(@Query('tipo') tipo?: string, @Query('bioma') bioma?: string) {
    return this.marketplace.listOfertas(tipo, bioma);
  }

  // POST /marketplace/ofertas (contract §4.5)
  @Post('ofertas')
  async createOferta(@Body() dto: CreateOfertaDto) {
    return this.marketplace.createOferta(dto);
  }

  // POST /marketplace/match (contract §4.6)
  @Post('match')
  async createMatch(@Body() dto: CreateMatchDto) {
    return this.marketplace.createMatch(dto);
  }
}
