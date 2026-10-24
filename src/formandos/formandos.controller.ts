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
import { FormandosService } from './formandos.service';
import { CreateFormandoDto } from './dto/create-formando.dto';
import { UpdateFormandoDto } from './dto/update-formando.dto';
import {
  generatePdf,
  generateXlsx,
  parseImportFile,
  setPdfHeaders,
  setXlsxHeaders,
  timestamp,
} from '../common/reports/report';

@UseGuards(JwtAuthGuard)
@Controller('formandos')
export class FormandosController {
  constructor(private readonly formandosService: FormandosService) {}

  @Post()
  create(@Body() createFormandoDto: CreateFormandoDto) {
    return this.formandosService.create(createFormandoDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.formandosService.findAll(query);
  }

  @Get('em-curso')
  emCurso() {
    return this.formandosService.findEmCurso();
  }

  @Get('export_pdf')
  async exportPdf(@Query() query: Record<string, string>, @Res() res: Response) {
    const rows = await this.formandosService.reportRows(query);
    setPdfHeaders(res, `formandos_${timestamp()}.pdf`);
    generatePdf(res, {
      title: 'Relatório de Formandos',
      subtitle: `Carinho Academy • ${new Date().toLocaleString('pt-PT')}`,
      columns: [
        { header: 'Matrícula', key: 'matricula', width: 70 },
        { header: 'Nome', key: 'nome', width: 160 },
        { header: 'Sexo', key: 'sexo', width: 40 },
        { header: 'BI', key: 'bi', width: 80 },
        { header: 'Função', key: 'funcao', width: 100 },
        { header: 'Área/Direção', key: 'area', width: 100 },
        { header: 'Empresa', key: 'empresa', width: 120 },
        { header: 'Nº Formações', key: 'num_formacoes', width: 60 },
      ],
      rows,
    });
  }

  @Get('export_xlsx')
  async exportXlsx(@Query() query: Record<string, string>, @Res() res: Response) {
    const rows = await this.formandosService.reportRows(query);
    setXlsxHeaders(res, `formandos_${timestamp()}.xlsx`);
    await generateXlsx(res, {
      title: 'Relatório de Formandos',
      subtitle: `Carinho Academy • Gerado em ${new Date().toLocaleString('pt-PT')}`,
      columns: [
        { header: 'Matrícula', key: 'matricula', width: 14 },
        { header: 'Nome', key: 'nome', width: 30 },
        { header: 'Sexo', key: 'sexo', width: 8 },
        { header: 'BI', key: 'bi', width: 16 },
        { header: 'Função', key: 'funcao', width: 18 },
        { header: 'Área/Direção', key: 'area', width: 20 },
        { header: 'Empresa', key: 'empresa', width: 24 },
        { header: 'Nº Formações', key: 'num_formacoes', width: 12 },
      ],
      rows,
    });
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: Express.Multer.File) {
    const parsed = await parseImportFile(file);
    return this.formandosService.importFromFile(parsed);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formandosService.findOne(id);
  }

  @Get(':id/formacoes')
  formacoes(@Param('id') id: string) {
    return this.formandosService.formacoesComEstado(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFormandoDto: UpdateFormandoDto) {
    return this.formandosService.update(id, updateFormandoDto);
  }

  @Put(':id')
  @HttpCode(200)
  replace(@Param('id') id: string, @Body() updateFormandoDto: UpdateFormandoDto) {
    return this.formandosService.update(id, updateFormandoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formandosService.remove(id);
  }
}
