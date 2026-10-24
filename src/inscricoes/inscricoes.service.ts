import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inscricao } from './entities/inscricao.entity';
import { InscricaoEstado } from './enums/inscricao-estado.enum';
import { InscricaoOrigem } from './enums/inscricao-origem.enum';
import { Turma } from '../turmas/entities/turma.entity';

export interface CriarInscricaoInput {
  turmaId: string;
  associadoId: string;
  estado?: InscricaoEstado;
  origem?: InscricaoOrigem;
  criadoPor?: string | null;
  observacao?: string | null;
}

@Injectable()
export class InscricoesService {
  constructor(
    @InjectRepository(Inscricao)
    private readonly inscricoesRepository: Repository<Inscricao>,
  ) {}

  async findByTurma(turmaId: string): Promise<Inscricao[]> {
    return this.inscricoesRepository.find({
      where: { turmaId },
      relations: { associado: { empresa: true } },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(turmaId: string, associadoId: string): Promise<Inscricao | null> {
    return this.inscricoesRepository.findOne({
      where: { turmaId, associadoId },
    });
  }

  async criar(
    input: CriarInscricaoInput,
    turma: Turma,
  ): Promise<Inscricao> {
    const existente = await this.findOne(input.turmaId, input.associadoId);
    if (existente) {
      // idempotente: já existe, não duplica
      return existente;
    }

    let estado = input.estado ?? InscricaoEstado.INSCRITO;
    let origem = input.origem ?? InscricaoOrigem.MANUAL;

    // Se a turma terminou no passado, a inscrição entra como concluída/retroactiva
    if (turma.dataFim && turma.dataFim < new Date()) {
      estado = InscricaoEstado.CONCLUIDO;
      origem = InscricaoOrigem.RETROATIVA;
    }

    const inscricao = this.inscricoesRepository.create({
      turmaId: input.turmaId,
      associadoId: input.associadoId,
      estado,
      origem,
      dataInscricao: new Date(),
      dataConclusao:
        estado === InscricaoEstado.CONCLUIDO ? new Date() : null,
      criadoPor: input.criadoPor ?? null,
      observacao: input.observacao ?? null,
    });

    return this.inscricoesRepository.save(inscricao);
  }

  async atualizarEstado(
    turmaId: string,
    associadoId: string,
    estado: InscricaoEstado,
  ): Promise<Inscricao> {
    const inscricao = await this.findOne(turmaId, associadoId);
    if (!inscricao) throw new NotFoundException('Inscrição não encontrada');

    inscricao.estado = estado;
    inscricao.dataConclusao =
      estado === InscricaoEstado.CONCLUIDO ? new Date() : inscricao.dataConclusao;

    return this.inscricoesRepository.save(inscricao);
  }

  async remover(turmaId: string, associadoId: string): Promise<void> {
    const inscricao = await this.findOne(turmaId, associadoId);
    if (!inscricao) throw new NotFoundException('Inscrição não encontrada');
    await this.inscricoesRepository.remove(inscricao);
  }

  async countInscritos(turmaId: string): Promise<number> {
    return this.inscricoesRepository.count({
      where: { turmaId, estado: InscricaoEstado.INSCRITO },
    });
  }
}
