import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilAcesso } from './entities/perfil-acesso.entity';
import { PerfilPermissao } from './entities/perfil-permissao.entity';
import { UtilizadorPermissao } from './entities/utilizador-permissao.entity';
import { Permissao } from '../permissoes/entities/permissao.entity';
import { User } from '../users/entities/user.entity';
import { PermissoesModule } from '../permissoes/permissoes.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { PerfisService } from './perfis.service';
import { UtilizadoresAdminService } from './utilizadores-admin.service';
import {
  PerfisController,
  PermissoesController,
} from './perfis.controller';
import { UtilizadoresAdminController } from './utilizadores-admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PerfilAcesso,
      PerfilPermissao,
      UtilizadorPermissao,
      Permissao,
      User,
    ]),
    PermissoesModule,
    AuditoriaModule,
  ],
  controllers: [
    PerfisController,
    PermissoesController,
    UtilizadoresAdminController,
  ],
  providers: [PerfisService, UtilizadoresAdminService],
  exports: [PerfisService, UtilizadoresAdminService],
})
export class PerfisModule {}
