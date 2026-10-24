import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsBoolean, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PerfisService } from './perfis.service';
import { PermissoesService } from '../permissoes/permissoes.service';

class CriarPerfilDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsArray()
  @IsString({ each: true })
  permissoes: string[];
}

class EditarPerfilDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

class SetPermissoesDto {
  @IsArray()
  @IsString({ each: true })
  permissoes: string[];
}

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('perfis')
export class PerfisController {
  constructor(private readonly perfisService: PerfisService) {}

  @Get()
  @RequirePermissions('perfis:ver')
  listar() {
    return this.perfisService.listar();
  }

  @Get(':id')
  @RequirePermissions('perfis:ver')
  findOne(@Param('id') id: string) {
    return this.perfisService.findOne(id);
  }

  @Post()
  @RequirePermissions('perfis:criar')
  criar(
    @Body() dto: CriarPerfilDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.perfisService.criar(dto, user?.id, req.ip);
  }

  @Patch(':id')
  @RequirePermissions('perfis:editar')
  editar(
    @Param('id') id: string,
    @Body() dto: EditarPerfilDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.perfisService.editar(id, dto, user?.id, req.ip);
  }

  @Put(':id/permissoes')
  @RequirePermissions('perfis:gerir')
  setPermissoes(
    @Param('id') id: string,
    @Body() dto: SetPermissoesDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.perfisService.setPermissoes(id, dto.permissoes, user?.id, req.ip);
  }

  @Post(':id/clonar')
  @RequirePermissions('perfis:criar')
  clonar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.perfisService.clonar(id, user?.id, req.ip);
  }

  @Delete(':id')
  @RequirePermissions('perfis:eliminar')
  eliminar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.perfisService.eliminar(id, user?.id, req.ip);
  }
}

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissoes')
export class PermissoesController {
  constructor(private readonly permissoesService: PermissoesService) {}

  @Get()
  @RequirePermissions('perfis:ver')
  catalogo() {
    return this.permissoesService.catalogoAgrupado();
  }
}
