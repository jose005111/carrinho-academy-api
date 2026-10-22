import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormadorFormacao } from './entities/formador-formacao.entity';
import { FormadorFormacaoService } from './formador-formacao.service';

@Module({
  imports: [TypeOrmModule.forFeature([FormadorFormacao])],
  providers: [FormadorFormacaoService],
  exports: [FormadorFormacaoService],
})
export class FormadorFormacaoModule {}
