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
import { FormadoresService } from './formadores.service';
import { CreateFormadorDto } from './dto/create-formador.dto';
import { UpdateFormadorDto } from './dto/update-formador.dto';
import { FormadorFormacaoService } from '../formador-formacao/formador-formacao.service';
import { AssociarFormacaoFormadorDto } from '../formador-formacao/dto/associar-formacao-formador.dto';
import { AtualizarSupervisorDto } from '../formador-formacao/dto/atualizar-supervisor.dto';
import {
  generatePdf,
  generateXlsx,
  parseImportFile,
  setPdfHeaders,
  setXlsxHeaders,
  timestamp,
} from '../common/reports/report';

@UseGuards(JwtAuthGuard)
@Controller('formadores')
export class FormadoresController {
  constructor(
    private readonly formadoresService: FormadoresService,
    private readonly formadorFormacaoService: FormadorFormacaoService,
  ) {}

  @Post()
  create(@Body() dto: CreateFormadorDto) {
    return this.formadoresService.create(dto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.formadoresService.findAll(query);
  }

  @Get('export_pdf')
  async exportPdf(@Query() query: Record<string, string>, @Res() res: Response) {
    const rows = await this.formadoresService.reportRows(query);
    setPdfHeaders(res, `formadores_${timestamp()}.pdf`);
    generatePdf(res, {
      title: 'Relatório de Formadores',
      subtitle: `Carinho Academy • ${new Date().toLocaleString('pt-PT')}`,
      columns: [
        { header: 'Nome', key: 'nome', width: 180 },
        { header: 'BI', key: 'bi', width: 100 },
        { header: 'Sexo', key: 'sexo', width: 50 },
        { header: 'Contacto', key: 'contacto', width: 90 },
        { header: 'Formações (principal)', key: 'num_principal', width: 70 },
        { header: 'Formações (supervisor)', key: 'num_supervisor', width: 70 },
      ],
      rows,
    });
  }

  @Get('export_xlsx')
  async exportXlsx(@Query() query: Record<string, string>, @Res() res: Response) {
    const rows = await this.formadoresService.reportRows(query);
    setXlsxHeaders(res, `formadores_${timestamp()}.xlsx`);
    await generateXlsx(res, {
      title: 'Relatório de Formadores',
      subtitle: `Carinho Academy • Gerado em ${new Date().toLocaleString('pt-PT')}`,
      columns: [
        { header: 'Nome', key: 'nome', width: 30 },
        { header: 'BI', key: 'bi', width: 20 },
        { header: 'Sexo', key: 'sexo', width: 10 },
        { header: 'Contacto', key: 'contacto', width: 18 },
        { header: 'Formações (principal)', key: 'num_principal', width: 14 },
        { header: 'Formações (supervisor)', key: 'num_supervisor', width: 14 },
      ],
      rows,
    });
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: Express.Multer.File) {
    const parsed = await parseImportFile(file);
    return this.formadoresService.importFromFile(parsed);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formadoresService.findOne(id);
  }

  @Get(':id/formacoes')
  findFormacoes(@Param('id') id: string) {
    return this.formadorFormacaoService.findFormacoesDoFormador(id);
  }

  @Post(':id/formacoes')
  associarFormacao(
    @Param('id') id: string,
    @Body() dto: AssociarFormacaoFormadorDto,
  ) {
    return this.formadorFormacaoService.associar(
      id,
      dto.formacaoId,
      dto.supervisor,
    );
  }

  @Patch(':id/formacoes/:formacaoId')
  atualizarSupervisor(
    @Param('id') id: string,
    @Param('formacaoId') formacaoId: string,
    @Body() dto: AtualizarSupervisorDto,
  ) {
    return this.formadorFormacaoService.atualizarSupervisor(
      id,
      formacaoId,
      dto.supervisor,
    );
  }

  @Delete(':id/formacoes/:formacaoId')
  removerFormacao(
    @Param('id') id: string,
    @Param('formacaoId') formacaoId: string,
  ) {
    return this.formadorFormacaoService.remover(id, formacaoId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFormadorDto) {
    return this.formadoresService.update(id, dto);
  }

  @Put(':id')
  @HttpCode(200)
  replace(@Param('id') id: string, @Body() dto: UpdateFormadorDto) {
    return this.formadoresService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formadoresService.remove(id);
  }
}
