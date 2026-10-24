import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { AuditoriaService } from './auditoria.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @RequirePermissions('auditoria:ver')
  listar(@Query() query: Record<string, string>) {
    return this.auditoriaService.listar(query);
  }
}
