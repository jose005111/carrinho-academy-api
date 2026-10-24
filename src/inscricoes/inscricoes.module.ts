import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inscricao } from './entities/inscricao.entity';
import { InscricoesService } from './inscricoes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Inscricao])],
  providers: [InscricoesService],
  exports: [InscricoesService],
})
export class InscricoesModule {}
