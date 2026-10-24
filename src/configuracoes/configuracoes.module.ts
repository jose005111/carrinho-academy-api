import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Configuracao } from './entities/configuracao.entity';
import { ConfiguracoesService } from './configuracoes.service';
import { ConfiguracoesController } from './configuracoes.controller';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { PermissoesModule } from '../permissoes/permissoes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Configuracao]),
    AuditoriaModule,
    PermissoesModule,
  ],
  controllers: [ConfiguracoesController],
  providers: [ConfiguracoesService],
  exports: [ConfiguracoesService],
})
export class ConfiguracoesModule {}
