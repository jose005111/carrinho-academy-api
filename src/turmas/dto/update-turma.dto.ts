import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateTurmaDto } from './create-turma.dto';
import { TurmaEstado } from '../enums/turma-estado.enum';

export class UpdateTurmaDto extends PartialType(CreateTurmaDto) {
  @IsOptional()
  @IsEnum(TurmaEstado)
  estado?: TurmaEstado;
}
