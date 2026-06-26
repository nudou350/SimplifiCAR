import { Controller, Param, ParseIntPipe, Post, Get } from '@nestjs/common';
import { DiagnosticosService } from './diagnosticos.service';

@Controller('diagnosticos')
export class DiagnosticosController {
  constructor(private readonly diagnosticos: DiagnosticosService) {}

  // GET /diagnosticos/:propriedadeId (contract §4.2)
  @Get(':propriedadeId')
  async findOne(@Param('propriedadeId', ParseIntPipe) propriedadeId: number) {
    return this.diagnosticos.findByPropriedadeId(propriedadeId);
  }

  // POST /diagnosticos/:id/retificacao (contract §4.8)
  @Post(':id/retificacao')
  async retificacao(@Param('id', ParseIntPipe) id: number) {
    return this.diagnosticos.gerarRetificacao(id);
  }
}
