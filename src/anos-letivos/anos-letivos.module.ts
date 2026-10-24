import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnoLetivo } from './entities/ano-letivo.entity';
import { AnosLetivosService } from './anos-letivos.service';
import { AnosLetivosController } from './anos-letivos.controller';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [TypeOrmModule.forFeature([AnoLetivo]), AuditoriaModule],
  controllers: [AnosLetivosController],
  providers: [AnosLetivosService],
  exports: [AnosLetivosService],
})
export class AnosLetivosModule {}
