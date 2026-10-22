import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import {
  generatePdf,
  generateXlsx,
  parseImportFile,
  setPdfHeaders,
  setXlsxHeaders,
  timestamp,
} from '../common/reports/report';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function imageFilter(
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!IMAGE_MIMES.includes(file.mimetype)) {
    cb(
      new BadRequestException(
        'Formato de imagem inválido. Utilize JPG, PNG, WEBP ou GIF',
      ),
      false,
    );
    return;
  }
  cb(null, true);
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.usersService.findAll(query);
  }

  @Get('export_pdf')
  async exportPdf(@Query() query: Record<string, string>, @Res() res: Response) {
    const rows = await this.usersService.reportRows(query);
    setPdfHeaders(res, `users_${timestamp()}.pdf`);
    generatePdf(res, {
      title: 'Relatório de Utilizadores',
      subtitle: `Carinho Academy • ${new Date().toLocaleString('pt-PT')}`,
      columns: [
        { header: 'Nome', key: 'nome', width: 180 },
        { header: 'Email', key: 'email', width: 200 },
        { header: 'Cargo', key: 'role', width: 90 },
      ],
      rows,
    });
  }

  @Get('export_xlsx')
  async exportXlsx(@Query() query: Record<string, string>, @Res() res: Response) {
    const rows = await this.usersService.reportRows(query);
    setXlsxHeaders(res, `users_${timestamp()}.xlsx`);
    await generateXlsx(res, {
      title: 'Relatório de Utilizadores',
      subtitle: `Carinho Academy • Gerado em ${new Date().toLocaleString('pt-PT')}`,
      columns: [
        { header: 'Nome', key: 'nome', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Cargo', key: 'role', width: 14 },
      ],
      rows,
    });
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: Express.Multer.File) {
    const parsed = await parseImportFile(file);
    return this.usersService.importFromFile(parsed);
  }

  @Put()
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const extension = extname(file.originalname).toLowerCase() || '.png';
          cb(null, `${Date.now()}-${randomUUID()}${extension}`);
        },
      }),
      fileFilter: imageFilter,
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
  )
  async atualizarPerfil(
    @CurrentUser() user: User,
    @Body() body: Record<string, string>,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const fotoUrl = file ? `/uploads/${file.filename}` : undefined;
    return this.usersService.atualizarPerfil(user.id, {
      nome: body.nome,
      email: body.email,
      password: body.password,
      password_confirmation: body.password_confirmation,
      foto: fotoUrl,
      removerFoto: body.remover_foto === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  excluir(@Param('id') id: string) {
    return this.usersService.excluir(id);
  }
}
