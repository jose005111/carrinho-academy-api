import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tipo } from './entities/tipo.entity';
import { Formato } from './entities/formato.entity';
import { Funcao } from './entities/funcao.entity';
import { Area } from './entities/area.entity';
import { CatalogosService } from './catalogos.service';
import { TiposController } from './tipos.controller';
import { FormatosController } from './formatos.controller';
import { FuncoesController } from './funcoes.controller';
import { AreasController } from './areas.controller';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tipo, Formato, Funcao, Area]),
    AuditoriaModule,
  ],
  controllers: [
    TiposController,
    FormatosController,
    FuncoesController,
    AreasController,
  ],
  providers: [CatalogosService],
  exports: [CatalogosService],
})
export class CatalogosModule {}
