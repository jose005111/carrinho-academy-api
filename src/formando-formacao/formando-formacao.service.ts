import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormandoFormacao } from './entities/formando-formacao.entity';

@Injectable()
export class FormandoFormacaoService {
  constructor(
    @InjectRepository(FormandoFormacao)
    private readonly formandoFormacaoRepository: Repository<FormandoFormacao>,
  ) {}

  async associar(
    formandoId: string,
    formacaoId: string,
  ): Promise<FormandoFormacao> {
    const existente = await this.formandoFormacaoRepository.findOne({
      where: { formandoId, formacaoId },
    });

    if (existente) {
      throw new ConflictException(
        'Este formando ja esta associado a esta formacao',
      );
    }

    const associacao = this.formandoFormacaoRepository.create({
      formandoId,
      formacaoId,
    });

    const saved = await this.formandoFormacaoRepository.save(associacao);

    if (saved.formando) {
      saved.formando.totFormacoes = (saved.formando.totFormacoes ?? 0) + 1;
      await this.formandoFormacaoRepository.manager.save(saved.formando);
    }

    return saved;
  }

  async remover(formandoId: string, formacaoId: string): Promise<void> {
    const associacao = await this.formandoFormacaoRepository.findOne({
      where: { formandoId, formacaoId },
      relations: { formando: true },
    });

    if (!associacao) {
      throw new NotFoundException('Associacao nao encontrada');
    }

    await this.formandoFormacaoRepository.remove(associacao);

    if (associacao.formando) {
      associacao.formando.totFormacoes = Math.max(
        (associacao.formando.totFormacoes ?? 1) - 1,
        0,
      );
      await this.formandoFormacaoRepository.manager.save(associacao.formando);
    }
  }

  // Todas as formacoes de um formando
  findFormacoesDoFormando(formandoId: string): Promise<FormandoFormacao[]> {
    return this.formandoFormacaoRepository.find({
      where: { formandoId },
      relations: ['formacao'],
    });
  }

  // Todos os formandos de uma formacao
  findFormandosDaFormacao(formacaoId: string): Promise<FormandoFormacao[]> {
    return this.formandoFormacaoRepository.find({
      where: { formacaoId },
      relations: ['formando'],
    });
  }
}
