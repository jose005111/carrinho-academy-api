import { Cargo } from '../../common/enums/cargo.enum';

export type JwtPayload = {
  sub: string; // id do utilizador
  email: string;
  cargo: Cargo;
};
