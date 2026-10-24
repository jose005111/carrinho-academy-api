import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateCatalogoDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
