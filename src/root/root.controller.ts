import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

class SignupUserDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(4)
  password: string;

  @IsOptional()
  @IsNumber()
  role?: number;
}

class SignupDto {
  @ValidateNested()
  @Type(() => SignupUserDto)
  user: SignupUserDto;
}

@Controller()
export class RootController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.usersService.signup(dto.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('logout')
  logout() {
    return { message: 'Sessão terminada com sucesso!' };
  }
}
