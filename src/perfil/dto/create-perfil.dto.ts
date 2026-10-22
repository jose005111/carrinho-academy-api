import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePerfilDto {
  @IsString()
  @MaxLength(150)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  foto?: string;
}
