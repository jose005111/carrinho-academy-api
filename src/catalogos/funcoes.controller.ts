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
import { CatalogosService } from './catalogos.service';
import { CreateCatalogoDto } from './dto/create-catalogo.dto';
import { UpdateCatalogoDto } from './dto/update-catalogo.dto';

@UseGuards(JwtAuthGuard)
@Controller('funcoes')
export class FuncoesController {
  constructor(private readonly catalogosService: CatalogosService) {}

  @Get()
  findAll(@Query('ativos') ativos?: string) {
    return this.catalogosService.findAll('funcoes', ativos === 'true');
  }

  @Post()
  create(
    @Body() dto: CreateCatalogoDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.catalogosService.create('funcoes', dto, user?.id ?? null, req.ip ?? null);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCatalogoDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.catalogosService.update('funcoes', id, dto, user?.id ?? null, req.ip ?? null);
  }

  @Post(':id/ativar')
  ativar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.catalogosService.setAtivo('funcoes', id, true, user?.id ?? null, req.ip ?? null);
  }

  @Post(':id/desativar')
  desativar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.catalogosService.setAtivo('funcoes', id, false, user?.id ?? null, req.ip ?? null);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.catalogosService.remove('funcoes', id, user?.id ?? null, req.ip ?? null);
  }
}
