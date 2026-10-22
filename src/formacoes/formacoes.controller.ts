import { Controller } from '@nestjs/common';
import { FormacoesService } from './formacoes.service';
import { FormandoFormacaoService } from '../formando-formacao/formando-formacao.service';
import { FormacoesBaseController } from './formacoes.base';

@Controller('formacoes')
export class FormacoesController extends FormacoesBaseController {
  constructor(
    formacoesService: FormacoesService,
    formandoFormacaoService: FormandoFormacaoService,
  ) {
    super(formacoesService, formandoFormacaoService);
  }
}
