import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Turma } from './entities/turma.entity';
import { CreateTurmaDto } from './dto/create-turma.dto';
import { UpdateTurmaDto } from './dto/update-turma.dto';
import { TurmaEstado } from './enums/turma-estado.enum';
import { Formacao } from '../formacoes/entities/formacao.entity';
import { ConfiguracoesService } from '../configuracoes/configuracoes.service';

export interface TurmaResponse {
  id: string;
  codigo: string | null;
  ano: number;
  data_inicio: Date | null;
  data_fim: Date | null;
  lotacao: number;
  cancelada: boolean;
  estado: TurmaEstado;
  vagas: number | null;
  inscritos: number;
  formacao_id: string;
  formacao: Formacao | null;
  createdAt: Date;
  updatedAt: Date;
}

export function estadoDaTurma(turma: {
  cancelada: boolean;
  dataInicio: Date | null;
  dataFim: Date | null;
}): TurmaEstado {
  if (turma.cancelada) return TurmaEstado.CANCELADA;
  const agora = new Date();
  if (turma.dataInicio && agora < turma.dataInicio) return TurmaEstado.AGENDADA;
  if (turma.dataFim && agora > turma.dataFim) return TurmaEstado.CONCLUIDA;
  return TurmaEstado.EM_CURSO;
}

@Injectable()
export class TurmasService {
  constructor(
    @InjectRepository(Turma)
    private readonly turmasRepository: Repository<Turma>,
    @InjectRepository(Formacao)
    private readonly formacoesRepository: Repository<Formacao>,
    private readonly configuracoesService: ConfiguracoesService,
  ) {}

  private toResponse(turma: Turma & { inscritos?: number }): TurmaResponse {
    const inscritos = turma.inscritos ?? 0;
    return {
      id: turma.id,
      codigo: turma.codigo,
      ano: turma.ano,
      data_inicio: turma.dataInicio,
      data_fim: turma.dataFim,
      lotacao: turma.lotacao,
      cancelada: turma.cancelada,
      estado: estadoDaTurma(turma),
      vagas: turma.lotacao > 0 ? Math.max(turma.lotacao - inscritos, 0) : null,
      inscritos,
      formacao_id: turma.formacaoId,
      formacao: turma.formacao ?? null,
      createdAt: turma.createdAt,
      updatedAt: turma.updatedAt,
    };
  }

  async findEntity(id: string): Promise<Turma> {
    const turma = await this.turmasRepository.findOne({
      where: { id },
      relations: { formacao: true, inscricoes: true },
    });
    if (!turma) throw new NotFoundException('Turma não encontrada');
    return turma;
  }

  async create(dto: CreateTurmaDto): Promise<TurmaResponse> {
    const formacao = await this.formacoesRepository.findOne({
      where: { id: dto.formacao_id },
    });
    if (!formacao) throw new NotFoundException('Formação não encontrada');

    const dataInicio = dto.data_inicio ? new Date(dto.data_inicio) : null;
    const dataFim = dto.data_fim ? new Date(dto.data_fim) : null;
    const ano = dto.ano ?? (dataInicio ? dataInicio.getFullYear() : new Date().getFullYear());

    if (
      dataFim &&
      dataFim < new Date() &&
      !(await this.configuracoesService.getBoolean('permitir_turma_passado', true))
    ) {
      throw new BadRequestException(
        'Não é permitido criar turmas com data de fim no passado.',
      );
    }

    const prefixo = await this.configuracoesService.getString(
      'prefixo_codigo_turma',
      'TRM',
    );
    const codigo = `${prefixo}-${ano}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    const turma = this.turmasRepository.create({
      formacaoId: dto.formacao_id,
      ano,
      dataInicio,
      dataFim,
      lotacao: dto.lotacao ?? 0,
      cancelada: false,
      codigo,
    });

    const saved = await this.turmasRepository.save(turma);
    return this.toResponse({ ...saved, inscritos: 0 });
  }

  async findAll(query: Record<string, string> = {}): Promise<TurmaResponse[]> {
    const qb = this.turmasRepository
      .createQueryBuilder('turma')
      .leftJoinAndSelect('turma.formacao', 'formacao')
      .loadRelationCountAndMap('turma.inscritos', 'turma.inscricoes')
      .orderBy('turma.data_inicio', 'DESC');

    if (query.ano) qb.andWhere('turma.ano = :ano', { ano: Number(query.ano) });
    if (query.formacao_id) {
      qb.andWhere('turma.formacao_id = :formacaoId', {
        formacaoId: query.formacao_id,
      });
    }

    const turmas = await qb.getMany();
    return turmas.map((turma) =>
      this.toResponse({
        ...turma,
        inscritos: (turma as Turma & { inscritos?: number }).inscritos ?? 0,
      }),
    );
  }

  async findOne(id: string): Promise<TurmaResponse> {
    const turma = await this.findEntity(id);
    return this.toResponse({
      ...turma,
      inscritos: turma.inscricoes?.length ?? 0,
    });
  }

  async update(id: string, dto: UpdateTurmaDto): Promise<TurmaResponse> {
    const turma = await this.findEntity(id);

    if (dto.formacao_id && dto.formacao_id !== turma.formacaoId) {
      const formacao = await this.formacoesRepository.findOne({
        where: { id: dto.formacao_id },
      });
      if (!formacao) throw new NotFoundException('Formação não encontrada');
      turma.formacaoId = dto.formacao_id;
    }

    if (dto.data_inicio !== undefined) {
      turma.dataInicio = dto.data_inicio ? new Date(dto.data_inicio) : null;
    }
    if (dto.data_fim !== undefined) {
      turma.dataFim = dto.data_fim ? new Date(dto.data_fim) : null;
    }
    if (dto.lotacao !== undefined) turma.lotacao = dto.lotacao;
    if (dto.ano !== undefined) turma.ano = dto.ano;
    else if (turma.dataInicio) turma.ano = turma.dataInicio.getFullYear();

    await this.turmasRepository.save(turma);
    return this.findOne(id);
  }

  async cancelar(id: string): Promise<TurmaResponse> {
    const turma = await this.findEntity(id);
    turma.cancelada = true;
    await this.turmasRepository.save(turma);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const turma = await this.findEntity(id);
    await this.turmasRepository.remove(turma);
  }
}
