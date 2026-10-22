import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Perfil } from '../perfil/entities/perfil.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PerfilModule } from '../perfil/perfil.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Perfil]), PerfilModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
