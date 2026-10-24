import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { PermissoesService } from '../../permissoes/permissoes.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissoesService: PermissoesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new UnauthorizedException('Autenticação necessária');

    const info = await this.permissoesService.getEffectiveInfo(user.id);

    if (info.tokenVersion !== (user.tokenVersion ?? 0)) {
      throw new UnauthorizedException(
        'Sessão expirada. Inicie sessão novamente.',
      );
    }

    if (info.isSuperAdmin) return true;

    const permitido = required.every((codigo) => info.codigos.has(codigo));
    if (!permitido) {
      throw new ForbiddenException('Sem permissão para realizar esta acção');
    }

    return true;
  }
}
