import { Transform } from 'class-transformer';
import { IsInt } from 'class-validator';

export class CreateAnoLetivoDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  ano: number;
}
