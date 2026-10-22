import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { EmpresasService } from './empresas.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import {
  generatePdf,
  generateXlsx,
  parseImportFile,
  setPdfHeaders,
  setXlsxHeaders,
  timestamp,
} from '../common/reports/report';

@UseGuards(JwtAuthGuard)
@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Post()
  create(@Body() createEmpresaDto: CreateEmpresaDto) {
    return this.empresasService.create(createEmpresaDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.empresasService.findAll(query);
  }

  @Get('export_pdf')
  async exportPdf(@Query() query: Record<string, string>, @Res() res: Response) {
    const rows = await this.empresasService.reportRows(query);
    setPdfHeaders(res, `empresas_${timestamp()}.pdf`);
    generatePdf(res, {
      title: 'Relatório de Empresas',
      subtitle: `Carinho Academy • ${new Date().toLocaleString('pt-PT')}`,
      columns: [
        { header: 'Nome', key: 'nome', width: 200 },
        { header: 'Nº de Formandos', key: 'num_formandos', width: 80 },
        { header: 'Criado em', key: 'createdAt', width: 90 },
      ],
      rows,
    });
  }

  @Get('export_xlsx')
  async exportXlsx(@Query() query: Record<string, string>, @Res() res: Response) {
    const rows = await this.empresasService.reportRows(query);
    setXlsxHeaders(res, `empresas_${timestamp()}.xlsx`);
    await generateXlsx(res, {
      title: 'Relatório de Empresas',
      subtitle: `Carinho Academy • Gerado em ${new Date().toLocaleString('pt-PT')}`,
      columns: [
        { header: 'Nome', key: 'nome', width: 30 },
        { header: 'Nº de Formandos', key: 'num_formandos', width: 18 },
        { header: 'Criado em', key: 'createdAt', width: 22 },
      ],
      rows,
    });
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: Express.Multer.File) {
    const parsed = await parseImportFile(file);
    return this.empresasService.importFromFile(parsed);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.empresasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmpresaDto: UpdateEmpresaDto) {
    return this.empresasService.update(id, updateEmpresaDto);
  }

  @Put(':id')
  @HttpCode(200)
  replace(@Param('id') id: string, @Body() updateEmpresaDto: UpdateEmpresaDto) {
    return this.empresasService.update(id, updateEmpresaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.empresasService.remove(id);
  }
}
