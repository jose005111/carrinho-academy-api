import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cargo } from '../enums/cargo.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const cargosPermitidos = this.reflector.getAllAndOverride<Cargo[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!cargosPermitidos || cargosPermitidos.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return cargosPermitidos.includes(user?.cargo);
  }
}
