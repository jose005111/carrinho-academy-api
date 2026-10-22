import { PartialType } from '@nestjs/mapped-types';
import { CreateFormadorDto } from './create-formador.dto';

export class UpdateFormadorDto extends PartialType(CreateFormadorDto) {}
