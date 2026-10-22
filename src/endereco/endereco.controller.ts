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
import { EnderecoService } from './endereco.service';
import { CreateEnderecoDto } from './dto/create-endereco.dto';
import { UpdateEnderecoDto } from './dto/update-endereco.dto';
import {
  generatePdf,
  generateXlsx,
  parseImportFile,
  setPdfHeaders,
  setXlsxHeaders,
  timestamp,
} from '../common/reports/report';

@UseGuards(JwtAuthGuard)
@Controller('enderecos')
export class EnderecoController {
  constructor(private readonly enderecoService: EnderecoService) {}

  @Post()
  create(@Body() createEnderecoDto: CreateEnderecoDto) {
    return this.enderecoService.create(createEnderecoDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.enderecoService.findAll(query);
  }

  @Get('export_pdf')
  async exportPdf(@Query() query: Record<string, string>, @Res() res: Response) {
    const rows = await this.enderecoService.reportRows(query);
    setPdfHeaders(res, `enderecos_${timestamp()}.pdf`);
    generatePdf(res, {
      title: 'Relatório de Endereços',
      subtitle: `Carinho Academy • ${new Date().toLocaleString('pt-PT')}`,
      columns: [
        { header: 'Província', key: 'provincia', width: 180 },
        { header: 'Município', key: 'municipio', width: 180 },
      ],
      rows,
    });
  }

  @Get('export_xlsx')
  async exportXlsx(@Query() query: Record<string, string>, @Res() res: Response) {
    const rows = await this.enderecoService.reportRows(query);
    setXlsxHeaders(res, `enderecos_${timestamp()}.xlsx`);
    await generateXlsx(res, {
      title: 'Relatório de Endereços',
      subtitle: `Carinho Academy • Gerado em ${new Date().toLocaleString('pt-PT')}`,
      columns: [
        { header: 'Província', key: 'provincia', width: 24 },
        { header: 'Município', key: 'municipio', width: 24 },
      ],
      rows,
    });
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: Express.Multer.File) {
    const parsed = await parseImportFile(file);
    return this.enderecoService.importFromFile(parsed);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enderecoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEnderecoDto: UpdateEnderecoDto) {
    return this.enderecoService.update(id, updateEnderecoDto);
  }

  @Put(':id')
  @HttpCode(200)
  replace(@Param('id') id: string, @Body() updateEnderecoDto: UpdateEnderecoDto) {
    return this.enderecoService.update(id, updateEnderecoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enderecoService.remove(id);
  }
}
