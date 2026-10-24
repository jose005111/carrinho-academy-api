import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';

export class UpdateAnoLetivoDto {
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? undefined : Number(value)))
  @IsInt()
  ano?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
