import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Cargo } from '../common/enums/cargo.enum';
import { EfeitoPermissao } from './entities/utilizador-permissao.entity';
import {
  ExtraPermissaoInput,
  UtilizadoresAdminService,
} from './utilizadores-admin.service';

class CriarUtilizadorDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsUUID()
  @IsOptional()
  perfilAcessoId?: string;

  @IsEnum(Cargo)
  @IsOptional()
  cargo?: Cargo;
}

class AtualizarUtilizadorDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsUUID()
  @IsOptional()
  perfilAcessoId?: string;

  @IsEnum(Cargo)
  @IsOptional()
  cargo?: Cargo;
}

class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  novaSenha: string;
}

class ExtraPermissaoDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsEnum(EfeitoPermissao)
  efeito: EfeitoPermissao;

  @IsString()
  @IsOptional()
  expiraEm?: string;

  @IsString()
  @IsOptional()
  motivo?: string;
}

class SetPermissoesExtraDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtraPermissaoDto)
  permissoes: ExtraPermissaoDto[];
}

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('utilizadores')
export class UtilizadoresAdminController {
  constructor(
    private readonly utilizadoresAdminService: UtilizadoresAdminService,
  ) {}

  @Get()
  @RequirePermissions('utilizadores:ver')
  listar(@Query() query: Record<string, string>) {
    return this.utilizadoresAdminService.listar(query);
  }

  @Post()
  @RequirePermissions('utilizadores:criar')
  criar(
    @Body() dto: CriarUtilizadorDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.utilizadoresAdminService.criar(dto, user?.id, req.ip);
  }

  @Patch(':id')
  @RequirePermissions('utilizadores:editar')
  atualizar(
    @Param('id') id: string,
    @Body() dto: AtualizarUtilizadorDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.utilizadoresAdminService.atualizar(id, dto, user?.id, req.ip);
  }

  @Patch(':id/ativar')
  @RequirePermissions('utilizadores:editar')
  ativar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.utilizadoresAdminService.setActivo(id, true, user?.id, req.ip);
  }

  @Patch(':id/desativar')
  @RequirePermissions('utilizadores:editar')
  desativar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.utilizadoresAdminService.setActivo(id, false, user?.id, req.ip);
  }

  @Post(':id/reset-password')
  @RequirePermissions('utilizadores:editar')
  resetarPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.utilizadoresAdminService.resetarPassword(
      id,
      dto.novaSenha,
      user?.id,
      req.ip,
    );
  }

  @Get(':id/permissoes')
  @RequirePermissions('utilizadores:gerir')
  getPermissoes(@Param('id') id: string) {
    return this.utilizadoresAdminService.getPermissoes(id);
  }

  @Put(':id/permissoes-extra')
  @RequirePermissions('utilizadores:gerir')
  setPermissoesExtra(
    @Param('id') id: string,
    @Body() dto: SetPermissoesExtraDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    const lista: ExtraPermissaoInput[] = dto.permissoes.map((p) => ({
      codigo: p.codigo,
      efeito: p.efeito,
      expiraEm: p.expiraEm ?? null,
      motivo: p.motivo ?? null,
    }));
    return this.utilizadoresAdminService.setPermissoesExtra(
      id,
      lista,
      user?.id,
      req.ip,
    );
  }
}
