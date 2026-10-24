import { Body, Controller, Delete, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { LocalAuthGuard } from "../common/guards/local-auth.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";

class SignupDto {
  user: {
    nome: string;
    email: string;
    password: string;
    role?: number | string;
  };
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("signup")
  signup(@Body() dto: SignupDto) {
    return this.usersService.signup(dto.user);
  }

  @UseGuards(LocalAuthGuard)
  @Post("login")
  login(@Body() _dto: LoginDto, @CurrentUser() user: User) {
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: User) {
    return this.authService.me(user.id);
  }

  @Delete("logout")
  logout() {
    return { message: "Sessão terminada com sucesso!" };
  }
}
