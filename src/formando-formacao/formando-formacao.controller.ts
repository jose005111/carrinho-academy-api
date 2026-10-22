import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FormandoFormacaoService } from './formando-formacao.service';

class AssociarFormacaoDto {
  @IsUUID()
  @IsNotEmpty()
  formando_id: string;

  @IsUUID()
  @IsNotEmpty()
  formaco_id: string;
}

@UseGuards(JwtAuthGuard)
@Controller('formando_formacaos')
export class FormandoFormacaoController {
  constructor(
    private readonly formandoFormacaoService: FormandoFormacaoService,
  ) {}

  @Post()
  async associar(@Body() dto: AssociarFormacaoDto) {
    await this.formandoFormacaoService.associar(dto.formando_id, dto.formaco_id);
    return {
      message: 'Formação associada ao formando com sucesso!',
      formando_id: dto.formando_id,
      formaco_id: dto.formaco_id,
    };
  }

  @Delete()
  @HttpCode(200)
  async remover(@Body() dto: AssociarFormacaoDto) {
    await this.formandoFormacaoService.remover(dto.formando_id, dto.formaco_id);
    return { message: 'Formação removida do formando com sucesso!' };
  }
}
