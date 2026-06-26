import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PropriedadesService } from './propriedades.service';

@Controller('propriedades')
export class PropriedadesController {
  constructor(private readonly propriedades: PropriedadesService) {}

  // POST /propriedades/upload (contract §4.7) — declared before :codImovel to avoid route clash.
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Envie o arquivo .RET no campo "file".');
    }
    return this.propriedades.uploadRet(file.buffer);
  }

  // GET /propriedades/:codImovel (contract §4.1) — Consulta Rápida.
  @Get(':codImovel')
  async findOne(@Param('codImovel') codImovel: string) {
    return this.propriedades.findByCodImovel(codImovel);
  }
}
