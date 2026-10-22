import { IsUUID } from 'class-validator';

export class AssociarFormacaoDto {
  @IsUUID()
  formacaoId: string;
}
