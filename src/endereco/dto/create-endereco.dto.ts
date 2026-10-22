import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateEnderecoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  provincia: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  municipio: string;
}
