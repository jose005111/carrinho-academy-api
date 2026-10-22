import { PartialType } from '@nestjs/mapped-types';
import { CreateFormandoDto } from './create-formando.dto';

export class UpdateFormandoDto extends PartialType(CreateFormandoDto) {}
