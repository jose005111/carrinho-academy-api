import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService, toUserResponse } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/jwt-payload.type';
import { PermissoesService } from '../permissoes/permissoes.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly permissoesService: PermissoesService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const senhaValida = await bcrypt.compare(password, user.password);

    if (!senhaValida) {
      return null;
    }

    return user;
  }

  async login(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      cargo: user.cargo,
      tokenVersion: user.tokenVersion ?? 0,
    };

    const info = await this.permissoesService.getEffectiveInfo(user.id);

    return {
      access_token: this.jwtService.sign(payload),
      user: toUserResponse(user),
      permissoes: [...info.codigos].sort(),
    };
  }

  async me(userId: string) {
    const user = await this.usersService.findOneEntity(userId);
    const info = await this.permissoesService.getEffectiveInfo(userId);
    return {
      user: toUserResponse(user),
      permissoes: [...info.codigos].sort(),
    };
  }

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    return this.login(user);
  }
}
