import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormadorFormacao } from './entities/formador-formacao.entity';

@Injectable()
export class FormadorFormacaoService {
  constructor(
    @InjectRepository(FormadorFormacao)
    private readonly formadorFormacaoRepository: Repository<FormadorFormacao>,
  ) {}

  async associar(
    formadorId: string,
    formacaoId: string,
    supervisor = false,
  ): Promise<FormadorFormacao> {
    const existente = await this.formadorFormacaoRepository.findOne({
      where: { formadorId, formacaoId },
    });

    if (existente) {
      throw new ConflictException(
        'Este formador ja esta associado a esta formacao',
      );
    }

    const associacao = this.formadorFormacaoRepository.create({
      formadorId,
      formacaoId,
      supervisor,
    });

    return this.formadorFormacaoRepository.save(associacao);
  }

  async atualizarSupervisor(
    formadorId: string,
    formacaoId: string,
    supervisor: boolean,
  ): Promise<FormadorFormacao> {
    const associacao = await this.formadorFormacaoRepository.findOne({
      where: { formadorId, formacaoId },
    });

    if (!associacao) {
      throw new NotFoundException('Associacao nao encontrada');
    }

    associacao.supervisor = supervisor;
    return this.formadorFormacaoRepository.save(associacao);
  }

  async remover(formadorId: string, formacaoId: string): Promise<void> {
    const associacao = await this.formadorFormacaoRepository.findOne({
      where: { formadorId, formacaoId },
    });

    if (!associacao) {
      throw new NotFoundException('Associacao nao encontrada');
    }

    await this.formadorFormacaoRepository.remove(associacao);
  }

  // Todas as formacoes de um formador
  findFormacoesDoFormador(formadorId: string): Promise<FormadorFormacao[]> {
    return this.formadorFormacaoRepository.find({
      where: { formadorId },
      relations: ['formacao'],
    });
  }

  // Todos os formadores de uma formacao
  findFormadoresDaFormacao(formacaoId: string): Promise<FormadorFormacao[]> {
    return this.formadorFormacaoRepository.find({
      where: { formacaoId },
      relations: ['formador'],
    });
  }
}
