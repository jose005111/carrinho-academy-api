import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { InscricaoEstado } from '../../inscricoes/enums/inscricao-estado.enum';

export class ResultadoInscricaoDto {
  @IsUUID()
  associado_id: string;

  @IsEnum(InscricaoEstado)
  estado: InscricaoEstado;
}

export class EncerrarTurmaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResultadoInscricaoDto)
  resultados: ResultadoInscricaoDto[];
}
