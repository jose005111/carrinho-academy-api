import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InscricaoEstado } from '../../inscricoes/enums/inscricao-estado.enum';
import { IsEnum } from 'class-validator';

export class FiltrosCandidatosDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  empresaIds?: string[];

  @IsString()
  @IsOptional()
  genero?: string;

  @IsOptional()
  minFormacoes?: number;

  @IsOptional()
  maxFormacoes?: number;

  @IsString()
  @IsOptional()
  q?: string;
}

export class InscricaoBulkDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  associadoIds?: string[];

  @IsBoolean()
  @IsOptional()
  selecionarTodosFiltrados?: boolean;

  @ValidateNested()
  @Type(() => FiltrosCandidatosDto)
  @IsOptional()
  filtros?: FiltrosCandidatosDto;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  excluirIds?: string[];
}

export class AtualizarEstadoInscricaoDto {
  @IsEnum(InscricaoEstado)
  estado: InscricaoEstado;
}
