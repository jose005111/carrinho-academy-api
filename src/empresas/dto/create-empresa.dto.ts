import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateEmpresaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome: string;
}
