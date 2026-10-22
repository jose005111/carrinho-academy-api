import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formador } from './entities/formador.entity';
import { FormadoresService } from './formadores.service';
import { FormadoresController } from './formadores.controller';
import { FormadorFormacaoModule } from '../formador-formacao/formador-formacao.module';

@Module({
  imports: [TypeOrmModule.forFeature([Formador]), FormadorFormacaoModule],
  controllers: [FormadoresController],
  providers: [FormadoresService],
  exports: [FormadoresService],
})
export class FormadoresModule {}
