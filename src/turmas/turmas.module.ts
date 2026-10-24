import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turma } from './entities/turma.entity';
import { Formacao } from '../formacoes/entities/formacao.entity';
import { TurmasService } from './turmas.service';
import { TurmasController } from './turmas.controller';
import { ConfiguracoesModule } from '../configuracoes/configuracoes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Turma, Formacao]),
    ConfiguracoesModule,
  ],
  controllers: [TurmasController],
  providers: [TurmasService],
  exports: [TurmasService],
})
export class TurmasModule {}
