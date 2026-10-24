import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permissao } from './entities/permissao.entity';
import { PermissoesService } from './permissoes.service';
import { PerfilAcesso } from '../perfis/entities/perfil-acesso.entity';
import { PerfilPermissao } from '../perfis/entities/perfil-permissao.entity';
import { UtilizadorPermissao } from '../perfis/entities/utilizador-permissao.entity';
import { User } from '../users/entities/user.entity';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permissao,
      PerfilAcesso,
      PerfilPermissao,
      UtilizadorPermissao,
      User,
    ]),
  ],
  providers: [PermissoesService, PermissionsGuard],
  exports: [PermissoesService, PermissionsGuard],
})
export class PermissoesModule {}
