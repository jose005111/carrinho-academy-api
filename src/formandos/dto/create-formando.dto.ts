import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateFormandoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  sexo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  bi: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  matricula?: string;

  @IsUUID()
  @IsOptional()
  funcao_id?: string;

  @IsUUID()
  @IsOptional()
  area_id?: string;

  @IsInt()
  @IsOptional()
  totFormacoes?: number;

  @IsUUID()
  @IsOptional()
  empresaId?: string;

  @IsUUID()
  @IsOptional()
  empresa_id?: string;

  @IsUUID()
  @IsOptional()
  enderecoId?: string;

  @IsUUID()
  @IsOptional()
  endereco_id?: string;
}
