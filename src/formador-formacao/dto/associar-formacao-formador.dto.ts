import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class AssociarFormacaoFormadorDto {
  @IsUUID()
  formacaoId: string;

  @IsOptional()
  @IsBoolean()
  supervisor?: boolean;
}
