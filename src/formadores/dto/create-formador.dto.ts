import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateFormadorDto {
  @IsString()
  @MaxLength(150)
  nome!: string;

  @IsString()
  @MaxLength(150)
  bi!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contacto?: string;

  @IsString()
  sexo!: string;
}
