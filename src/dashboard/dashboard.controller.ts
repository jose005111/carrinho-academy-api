import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DashboardService, DashboardFiltros } from './dashboard.service';
import { generatePdf, setPdfHeaders, timestamp } from '../common/reports/report';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('totais')
  totais() {
    return this.dashboardService.totais();
  }

  @Get('formacoes')
  formacoes(@Query() filtros: DashboardFiltros) {
    return this.dashboardService.formacoes(filtros);
  }

  @Get('formandos_empresa')
  formandosPorEmpresa() {
    return this.dashboardService.formandosPorEmpresa();
  }

  @Get('export_formacoes')
  async exportFormacoes(
    @Query() filtros: DashboardFiltros,
    @Res() res: Response,
  ) {
    const rows = await this.dashboardService.reportRows(filtros);
    setPdfHeaders(
      res,
      `relatorio_formacoes_${new Date().toISOString().split('T')[0]}.pdf`,
    );
    generatePdf(res, {
      title: 'Relatório de Formações',
      subtitle: `Carinho Academy • Gerado em ${new Date().toLocaleString('pt-PT')}`,
      columns: [
        { header: 'Nome', key: 'nome', width: 140 },
        { header: 'Tipo', key: 'tipo', width: 80 },
        { header: 'Formato', key: 'formato', width: 70 },
        { header: 'Carga Horária', key: 'carga_horaria', width: 55 },
        { header: 'Local', key: 'local', width: 90 },
        { header: 'Certificado', key: 'acesso_certificado', width: 65 },
        { header: 'Nº Formandos', key: 'num_formandos', width: 50 },
        { header: 'Nº Formadores', key: 'num_formadores', width: 50 },
        { header: 'Criado em', key: 'created_at', width: 90 },
      ],
      rows,
    });
  }
}
