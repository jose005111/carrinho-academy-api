import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsNotEmpty } from 'class-validator';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConfiguracoesService } from './configuracoes.service';

class AtualizarConfiguracaoDto {
  @IsNotEmpty()
  valor: unknown;
}

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('configuracoes')
export class ConfiguracoesController {
  constructor(private readonly configuracoesService: ConfiguracoesService) {}

  @Get()
  @RequirePermissions('configuracoes:ver')
  findAllAgrupado() {
    return this.configuracoesService.findAllAgrupado();
  }

  @Public()
  @Get('publicas')
  findAllPublicas() {
    return this.configuracoesService.findAllPublicas();
  }

  @Patch(':chave')
  @RequirePermissions('configuracoes:editar')
  atualizar(
    @Param('chave') chave: string,
    @Body() dto: AtualizarConfiguracaoDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.configuracoesService.atualizar(
      chave,
      dto.valor,
      user?.id ?? null,
      req.ip ?? null,
    );
  }
}
