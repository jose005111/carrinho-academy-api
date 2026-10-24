import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TurmasService } from './turmas.service';
import { CreateTurmaDto } from './dto/create-turma.dto';
import { UpdateTurmaDto } from './dto/update-turma.dto';
import { EncerrarTurmaDto } from './dto/encerrar-turma.dto';

@UseGuards(JwtAuthGuard)
@Controller('turmas')
export class TurmasController {
  constructor(private readonly turmasService: TurmasService) {}

  @Post()
  create(
    @Body() dto: CreateTurmaDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.turmasService.create(dto, user?.id ?? null, req.ip ?? null);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.turmasService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.turmasService.findOne(id);
  }

  @Get(':id/inscritos')
  inscritos(@Param('id') id: string) {
    return this.turmasService.listarInscritos(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTurmaDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.turmasService.update(id, dto, user?.id ?? null, req.ip ?? null);
  }

  @Post(':id/cancelar')
  cancelar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.turmasService.cancelar(id, user?.id ?? null, req.ip ?? null);
  }

  @Post(':id/iniciar')
  iniciar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.turmasService.iniciar(id, user?.id ?? null, req.ip ?? null);
  }

  @Post(':id/encerrar')
  encerrar(
    @Param('id') id: string,
    @Body() dto: EncerrarTurmaDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.turmasService.encerrar(id, dto, user?.id ?? null, req.ip ?? null);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.turmasService.remove(id, user?.id ?? null, req.ip ?? null);
  }
}
