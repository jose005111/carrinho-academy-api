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
import { AnosLetivosService } from './anos-letivos.service';
import { CreateAnoLetivoDto } from './dto/create-ano-letivo.dto';
import { UpdateAnoLetivoDto } from './dto/update-ano-letivo.dto';

@UseGuards(JwtAuthGuard)
@Controller('anos-letivos')
export class AnosLetivosController {
  constructor(private readonly anosLetivosService: AnosLetivosService) {}

  @Get()
  findAll(@Query('ativos') ativos?: string) {
    return this.anosLetivosService.findAll(ativos === 'true');
  }

  @Post()
  create(
    @Body() dto: CreateAnoLetivoDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.anosLetivosService.create(dto, user?.id ?? null, req.ip ?? null);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAnoLetivoDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.anosLetivosService.update(id, dto, user?.id ?? null, req.ip ?? null);
  }

  @Post(':id/ativar')
  ativar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.anosLetivosService.setAtivo(id, true, user?.id ?? null, req.ip ?? null);
  }

  @Post(':id/desativar')
  desativar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.anosLetivosService.setAtivo(id, false, user?.id ?? null, req.ip ?? null);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.anosLetivosService.remove(id, user?.id ?? null, req.ip ?? null);
  }
}
