import { Module } from '@nestjs/common';
import { RootController } from './root.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [RootController],
})
export class RootModule {}
