import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateTurmaDto {
  @IsUUID()
  formacao_id: string;

  @IsString()
  data_inicio: string;

  @IsString()
  @IsOptional()
  data_fim?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  lotacao?: number;

  @IsInt()
  @IsOptional()
  ano?: number;
}
