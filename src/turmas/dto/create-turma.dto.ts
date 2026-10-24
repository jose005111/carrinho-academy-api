import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateTurmaDto {
  @IsUUID()
  formacao_id: string;

  @IsOptional()
  @IsUUID()
  tipo_id?: string;

  @IsOptional()
  @IsUUID()
  formato_id?: string;

  @IsOptional()
  @IsString()
  acesso_certificado?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsInt()
  @Min(0)
  carga_diaria?: number;

  @IsOptional()
  @IsString()
  local?: string;

  @IsOptional()
  @IsString()
  data_inicio?: string;

  @IsOptional()
  @IsString()
  data_fim?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsInt()
  @Min(0)
  lotacao?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsInt()
  ano?: number;
}
