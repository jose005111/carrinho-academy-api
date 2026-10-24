import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turma } from '../turmas/entities/turma.entity';
import { Inscricao } from '../inscricoes/entities/inscricao.entity';
import { Formando } from '../formandos/entities/formando.entity';
import { ConfiguracoesModule } from '../configuracoes/configuracoes.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { PermissoesModule } from '../permissoes/permissoes.module';
import { AtribuicoesService } from './atribuicoes.service';
import { AtribuicoesController } from './atribuicoes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Turma, Inscricao, Formando]),
    ConfiguracoesModule,
    AuditoriaModule,
    PermissoesModule,
  ],
  controllers: [AtribuicoesController],
  providers: [AtribuicoesService],
})
export class AtribuicoesModule {}
