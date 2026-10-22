import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormandoFormacao } from './entities/formando-formacao.entity';
import { FormandoFormacaoService } from './formando-formacao.service';
import { FormandoFormacaoController } from './formando-formacao.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FormandoFormacao])],
  controllers: [FormandoFormacaoController],
  providers: [FormandoFormacaoService],
  exports: [FormandoFormacaoService],
})
export class FormandoFormacaoModule {}
