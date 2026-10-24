import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSIONS_KEY = 'require_permissions';

export const RequirePermissions = (...codigos: string[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, codigos);
