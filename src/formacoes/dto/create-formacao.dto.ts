import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

const HORA_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export class CreateFormacaoDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsString()
  tipo: string;

  @IsNotEmpty()
  @IsString()
  formato: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsNotEmpty()
  @Matches(HORA_REGEX, {
    message: 'carga_horaria deve estar no formato HH:mm (ex: 02:30)',
  })
  carga_horaria!: string;

  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== null && value !== ''
      ? Number(value)
      : undefined,
  )
  @IsInt({ message: 'carga_horaria_anual deve ser um número inteiro' })
  @Min(1)
  carga_horaria_anual?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value ? 'sim' : 'nao';
    if (typeof value === 'string') {
      return ['sim', 's', 'true', '1'].includes(value.trim().toLowerCase())
        ? 'sim'
        : 'nao';
    }
    return 'nao';
  })
  @IsString()
  acesso_certificado?: string;

  @IsOptional()
  @IsString()
  nota?: string;

  @IsOptional()
  @IsString()
  local?: string;

  @IsOptional()
  @IsDateString()
  inicio?: string;
}
