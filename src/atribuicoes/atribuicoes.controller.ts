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
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AtribuicoesService } from './atribuicoes.service';
import {
  AtualizarEstadoInscricaoDto,
  InscricaoBulkDto,
} from './dto/atribuicoes.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('turmas')
export class AtribuicoesController {
  constructor(private readonly atribuicoesService: AtribuicoesService) {}

  @Get(':turmaId/candidatos')
  @RequirePermissions('atribuicoes:ver')
  candidatos(
    @Param('turmaId') turmaId: string,
    @Query() query: Record<string, string>,
  ) {
    return this.atribuicoesService.listarCandidatos(turmaId, query);
  }

  @Post(':turmaId/inscricoes/bulk')
  @RequirePermissions('atribuicoes:inscrever')
  inscreverBulk(
    @Param('turmaId') turmaId: string,
    @Body() dto: InscricaoBulkDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.atribuicoesService.inscreverBulk(
      turmaId,
      dto,
      user?.id ?? null,
      req.ip ?? null,
    );
  }

  @Patch(':turmaId/inscricoes/:associadoId')
  @RequirePermissions('atribuicoes:inscrever')
  atualizarEstado(
    @Param('turmaId') turmaId: string,
    @Param('associadoId') associadoId: string,
    @Body() dto: AtualizarEstadoInscricaoDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.atribuicoesService.atualizarEstadoInscricao(
      turmaId,
      associadoId,
      dto.estado,
      user?.id ?? null,
      req.ip ?? null,
    );
  }

  @Delete(':turmaId/inscricoes/:associadoId')
  @RequirePermissions('atribuicoes:inscrever')
  remover(
    @Param('turmaId') turmaId: string,
    @Param('associadoId') associadoId: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.atribuicoesService.removerInscricao(
      turmaId,
      associadoId,
      user?.id ?? null,
      req.ip ?? null,
    );
  }
}
