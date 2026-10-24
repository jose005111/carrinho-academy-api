import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formando } from './entities/formando.entity';
import { FormandosService } from './formandos.service';
import { FormandosController } from './formandos.controller';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Endereco } from '../endereco/entities/endereco.entity';
import { Inscricao } from '../inscricoes/entities/inscricao.entity';
import { FormandoFormacao } from '../formando-formacao/entities/formando-formacao.entity';
import { Funcao } from '../catalogos/entities/funcao.entity';
import { Area } from '../catalogos/entities/area.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Formando,
      Empresa,
      Endereco,
      Inscricao,
      FormandoFormacao,
      Funcao,
      Area,
    ]),
  ],
  controllers: [FormandosController],
  providers: [FormandosService],
  exports: [FormandosService],
})
export class FormandosModule {}
