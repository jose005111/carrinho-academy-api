import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formacao } from './entities/formacao.entity';
import { FormacoesService } from './formacoes.service';
import { FormacoesController } from './formacoes.controller';
import { CursosController } from './cursos.controller';
import { FormacosController } from './formacos.controller';
import { FormandoFormacaoModule } from '../formando-formacao/formando-formacao.module';

@Module({
  imports: [TypeOrmModule.forFeature([Formacao]), FormandoFormacaoModule],
  controllers: [FormacoesController, CursosController, FormacosController],
  providers: [FormacoesService],
  exports: [FormacoesService],
})
export class FormacoesModule {}
