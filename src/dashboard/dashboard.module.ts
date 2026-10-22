import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formacao } from '../formacoes/entities/formacao.entity';
import { Formando } from '../formandos/entities/formando.entity';
import { Formador } from '../formadores/entities/formador.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { FormandoFormacao } from '../formando-formacao/entities/formando-formacao.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Formacao, Formando, Formador, Empresa, FormandoFormacao])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
