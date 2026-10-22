import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formando } from './entities/formando.entity';
import { FormandosService } from './formandos.service';
import { FormandosController } from './formandos.controller';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Endereco } from '../endereco/entities/endereco.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Formando, Empresa, Endereco])],
  controllers: [FormandosController],
  providers: [FormandosService],
  exports: [FormandosService],
})
export class FormandosModule {}
