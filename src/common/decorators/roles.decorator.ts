import { SetMetadata } from '@nestjs/common';
import { Cargo } from '../enums/cargo.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...cargos: Cargo[]) => SetMetadata(ROLES_KEY, cargos);
