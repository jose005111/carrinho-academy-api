import {
  Body,
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
import { FormacoesService } from './formacoes.service';
import { CreateFormacaoDto } from './dto/create-formacao.dto';
import { UpdateFormacaoDto } from './dto/update-formacao.dto';
import { FormandoFormacaoService } from '../formando-formacao/formando-formacao.service';
import {
  generatePdf,
  generateXlsx,
  parseImportFile,
  setPdfHeaders,
  setXlsxHeaders,
  timestamp,
} from '../common/reports/report';

@UseGuards(JwtAuthGuard)
export abstract class FormacoesBaseController {
  constructor(
    protected readonly formacoesService: FormacoesService,
    protected readonly formandoFormacaoService: FormandoFormacaoService,
  ) {}

  @Post()
  create(@Body() dto: CreateFormacaoDto) {
    return this.formacoesService.create(dto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.formacoesService.findAllMapped(query);
  }

  @Get('export_pdf')
  async exportPdf(@Query() query: Record<string, string>, @Res() res: Response) {
    const rows = await this.formacoesService.reportRows(query);
    setPdfHeaders(res, `cursos_${timestamp()}.pdf`);
    generatePdf(res, {
      title: 'Relatório de Formações',
      subtitle: `Carinho Academy • ${new Date().toLocaleString('pt-PT')}`,
      columns: [
        { header: 'Nome', key: 'nome', width: 150 },
        { header: 'Tipo', key: 'tipo', width: 80 },
        { header: 'Formato', key: 'formato', width: 70 },
        { header: 'Carga Horária', key: 'carga_horaria', width: 60 },
        { header: 'Local', key: 'local', width: 90 },
        { header: 'Certificado', key: 'acesso_certificado', width: 70 },
        { header: 'Nº Formandos', key: 'num_formandos', width: 55 },
      ],
      rows,
    });
  }

  @Get('export_xlsx')
  async exportXlsx(@Query() query: Record<string, string>, @Res() res: Response) {
    const rows = await this.formacoesService.reportRows(query);
    setXlsxHeaders(res, `cursos_${timestamp()}.xlsx`);
    await generateXlsx(res, {
      title: 'Relatório de Formações',
      subtitle: `Carinho Academy • Gerado em ${new Date().toLocaleString('pt-PT')}`,
      columns: [
        { header: 'Nome', key: 'nome', width: 28 },
        { header: 'Tipo', key: 'tipo', width: 16 },
        { header: 'Formato', key: 'formato', width: 14 },
        { header: 'Carga Horária', key: 'carga_horaria', width: 14 },
        { header: 'Carga Horária Anual', key: 'carga_horaria_anual', width: 14 },
        { header: 'Local', key: 'local', width: 18 },
        { header: 'Certificado', key: 'acesso_certificado', width: 14 },
        { header: 'Nº Formandos', key: 'num_formandos', width: 12 },
        { header: 'Nº Formadores', key: 'num_formadores', width: 12 },
      ],
      rows,
    });
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: Express.Multer.File) {
    const parsed = await parseImportFile(file);
    return this.formacoesService.importFromFile(parsed);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formacoesService.findOne(id);
  }

  @Get(':id/formandos')
  findFormandos(@Param('id') id: string) {
    return this.formandoFormacaoService.findFormandosDaFormacao(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFormacaoDto) {
    return this.formacoesService.update(id, dto);
  }

  @Put(':id')
  @HttpCode(200)
  replace(@Param('id') id: string, @Body() dto: UpdateFormacaoDto) {
    return this.formacoesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formacoesService.remove(id);
  }
}
