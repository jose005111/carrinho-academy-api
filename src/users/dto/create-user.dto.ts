import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Cargo } from '../../common/enums/cargo.enum';
import { CreatePerfilDto } from '../../perfil/dto/create-perfil.dto';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(Cargo)
  cargo?: Cargo;

  @ValidateNested()
  @Type(() => CreatePerfilDto)
  perfil: CreatePerfilDto;
}
