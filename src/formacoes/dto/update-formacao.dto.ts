import { PartialType } from '@nestjs/mapped-types';
import { CreateFormacaoDto } from './create-formacao.dto';

export class UpdateFormacaoDto extends PartialType(CreateFormacaoDto) {}
