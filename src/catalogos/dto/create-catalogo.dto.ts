import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCatalogoDto {
  @IsNotEmpty()
  @IsString()
  nome: string;
}
