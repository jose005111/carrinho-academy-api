import { IsBoolean } from 'class-validator';

export class AtualizarSupervisorDto {
  @IsBoolean()
  supervisor: boolean;
}
