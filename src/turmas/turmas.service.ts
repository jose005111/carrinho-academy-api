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
import { EncerrarTurmaDto } from './dto/encerrar-turma.dto';
import { TurmaEstado } from './enums/turma-estado.enum';
import { Formacao } from '../formacoes/entities/formacao.entity';
import { ConfiguracoesService } from '../configuracoes/configuracoes.service';
import { InscricoesService } from '../inscricoes/inscricoes.service';
import { AuditoriaService } from '../auditoria/auditoria.service';

export interface CatalogoResumo {
  id: string;
  nome: string;
}

export interface TurmaResponse {
  id: string;
  codigo: string | null;
  ano: number;
  data_inicio: Date | null;
  data_fim: Date | null;
  lotacao: number;
  estado: TurmaEstado;
  vagas: number | null;
  inscritos: number;
  dias: number | null;
  formacao_id: string;
  formacao: { id: string; nome: string; carga_horaria: number } | null;
  tipo: CatalogoResumo | null;
  formato: CatalogoResumo | null;
  acesso_certificado: string | null;
  carga_diaria: number;
  local: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TurmasService {
  constructor(
    @InjectRepository(Turma)
    private readonly turmasRepository: Repository<Turma>,
    @InjectRepository(Formacao)
    private readonly formacoesRepository: Repository<Formacao>,
    private readonly configuracoesService: ConfiguracoesService,
    private readonly inscricoesService: InscricoesService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  private calcularDias(turma: Turma): number | null {
    if (
      turma.cargaDiaria > 0 &&
      turma.formacao &&
      turma.formacao.carga_horaria > 0
    ) {
      return Math.ceil(turma.formacao.carga_horaria / turma.cargaDiaria);
    }
    return null;
  }

  private toResponse(turma: Turma & { inscritos?: number }): TurmaResponse {
    const inscritos = turma.inscritos ?? 0;
    return {
      id: turma.id,
      codigo: turma.codigo,
      ano: turma.ano,
      data_inicio: turma.dataInicio,
      data_fim: turma.dataFim,
      lotacao: turma.lotacao,
      estado: turma.estado,
      vagas: turma.lotacao > 0 ? Math.max(turma.lotacao - inscritos, 0) : null,
      inscritos,
      dias: this.calcularDias(turma),
      formacao_id: turma.formacaoId,
      formacao: turma.formacao
        ? {
            id: turma.formacao.id,
            nome: turma.formacao.nome,
            carga_horaria: turma.formacao.carga_horaria,
          }
        : null,
      tipo: turma.tipo ? { id: turma.tipo.id, nome: turma.tipo.nome } : null,
      formato: turma.formato
        ? { id: turma.formato.id, nome: turma.formato.nome }
        : null,
      acesso_certificado: turma.acessoCertificado,
      carga_diaria: turma.cargaDiaria,
      local: turma.local,
      createdAt: turma.createdAt,
      updatedAt: turma.updatedAt,
    };
  }

  async findEntity(id: string): Promise<Turma> {
    const turma = await this.turmasRepository.findOne({
      where: { id },
      relations: { formacao: true, tipo: true, formato: true, inscricoes: true },
    });
    if (!turma) throw new NotFoundException('Turma não encontrada');
    return turma;
  }

  async create(
    dto: CreateTurmaDto,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<TurmaResponse> {
    const formacao = await this.formacoesRepository.findOne({
      where: { id: dto.formacao_id },
    });
    if (!formacao) throw new NotFoundException('Formação não encontrada');

    const dataInicio = dto.data_inicio ? new Date(dto.data_inicio) : null;
    const dataFim = dto.data_fim ? new Date(dto.data_fim) : null;
    const ano =
      dto.ano ?? (dataInicio ? dataInicio.getFullYear() : new Date().getFullYear());

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
      tipoId: dto.tipo_id ?? null,
      formatoId: dto.formato_id ?? null,
      acessoCertificado: dto.acesso_certificado ?? null,
      cargaDiaria: dto.carga_diaria ?? 0,
      local: dto.local ?? null,
      ano,
      dataInicio,
      dataFim,
      lotacao: dto.lotacao ?? 0,
      estado: TurmaEstado.PENDENTE,
      codigo,
    });

    const saved = await this.turmasRepository.save(turma);
    await this.auditoriaService.registrar({
      utilizadorId,
      accao: 'turmas:criar',
      entidade: 'turmas',
      entidadeId: saved.id,
      depois: {
        formacao_id: saved.formacaoId,
        ano: saved.ano,
        estado: saved.estado,
        codigo: saved.codigo,
      },
      ip,
    });
    return this.findOne(saved.id);
  }

  async findAll(query: Record<string, string> = {}): Promise<TurmaResponse[]> {
    const qb = this.turmasRepository
      .createQueryBuilder('turma')
      .leftJoinAndSelect('turma.formacao', 'formacao')
      .leftJoinAndSelect('turma.tipo', 'tipo')
      .leftJoinAndSelect('turma.formato', 'formato')
      .loadRelationCountAndMap('turma.inscritos', 'turma.inscricoes')
      .orderBy('turma.data_inicio', 'DESC');

    if (query.ano) qb.andWhere('turma.ano = :ano', { ano: Number(query.ano) });
    if (query.formacao_id) {
      qb.andWhere('turma.formacao_id = :formacaoId', {
        formacaoId: query.formacao_id,
      });
    }
    if (query.estado) qb.andWhere('turma.estado = :estado', { estado: query.estado });

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

  async update(
    id: string,
    dto: UpdateTurmaDto,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<TurmaResponse> {
    const turma = await this.findEntity(id);

    if (dto.formacao_id && dto.formacao_id !== turma.formacaoId) {
      const formacao = await this.formacoesRepository.findOne({
        where: { id: dto.formacao_id },
      });
      if (!formacao) throw new NotFoundException('Formação não encontrada');
      turma.formacaoId = dto.formacao_id;
    }

    if (dto.tipo_id !== undefined) turma.tipoId = dto.tipo_id;
    if (dto.formato_id !== undefined) turma.formatoId = dto.formato_id;
    if (dto.acesso_certificado !== undefined)
      turma.acessoCertificado = dto.acesso_certificado;
    if (dto.carga_diaria !== undefined) turma.cargaDiaria = dto.carga_diaria;
    if (dto.local !== undefined) turma.local = dto.local;

    if (dto.data_inicio !== undefined) {
      turma.dataInicio = dto.data_inicio ? new Date(dto.data_inicio) : null;
    }
    if (dto.data_fim !== undefined) {
      turma.dataFim = dto.data_fim ? new Date(dto.data_fim) : null;
    }
    if (dto.lotacao !== undefined) turma.lotacao = dto.lotacao;
    if (dto.estado !== undefined) turma.estado = dto.estado;

    if (dto.ano !== undefined) turma.ano = dto.ano;
    else if (turma.dataInicio) turma.ano = turma.dataInicio.getFullYear();

    await this.turmasRepository.save(turma);
    await this.auditoriaService.registrar({
      utilizadorId,
      accao: 'turmas:editar',
      entidade: 'turmas',
      entidadeId: turma.id,
      depois: { id: turma.id, estado: turma.estado },
      ip,
    });
    return this.findOne(id);
  }

  async encerrar(
    id: string,
    dto: EncerrarTurmaDto,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<TurmaResponse> {
    const turma = await this.findEntity(id);

    if (turma.estado === TurmaEstado.CANCELADA) {
      throw new BadRequestException('Uma turma cancelada não pode ser encerrada.');
    }

    const inscricoes = turma.inscricoes ?? [];
    const mapa = new Map(
      dto.resultados.map((r) => [r.associado_id, r.estado]),
    );

    const emFalta = inscricoes.filter((i) => !mapa.has(i.associadoId));
    if (emFalta.length > 0) {
      throw new BadRequestException(
        `É obrigatório definir o resultado de todos os formandos (em falta: ${emFalta.length}).`,
      );
    }

    for (const resultado of dto.resultados) {
      await this.inscricoesService.atualizarEstado(
        id,
        resultado.associado_id,
        resultado.estado,
      );
    }

    turma.estado = TurmaEstado.ENCERRADO;
    if (!turma.dataFim) turma.dataFim = new Date();
    await this.turmasRepository.save(turma);

    await this.auditoriaService.registrar({
      utilizadorId,
      accao: 'turmas:encerrar',
      entidade: 'turmas',
      entidadeId: turma.id,
      depois: {
        estado: turma.estado,
        resultados: dto.resultados.map((r) => ({
          associado_id: r.associado_id,
          estado: r.estado,
        })),
      },
      ip,
    });

    return this.findOne(id);
  }

  async cancelar(
    id: string,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<TurmaResponse> {
    const turma = await this.findEntity(id);
    turma.estado = TurmaEstado.CANCELADA;
    await this.turmasRepository.save(turma);
    await this.auditoriaService.registrar({
      utilizadorId,
      accao: 'turmas:cancelar',
      entidade: 'turmas',
      entidadeId: turma.id,
      depois: { estado: turma.estado },
      ip,
    });
    return this.findOne(id);
  }

  async iniciar(
    id: string,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<TurmaResponse> {
    const turma = await this.findEntity(id);

    if (turma.estado !== TurmaEstado.PENDENTE) {
      throw new BadRequestException(
        'Apenas turmas pendentes podem ser iniciadas.',
      );
    }

    turma.estado = TurmaEstado.EM_CURSO;
    if (!turma.dataInicio) turma.dataInicio = new Date();
    await this.turmasRepository.save(turma);

    await this.auditoriaService.registrar({
      utilizadorId,
      accao: 'turmas:iniciar',
      entidade: 'turmas',
      entidadeId: turma.id,
      depois: { estado: turma.estado },
      ip,
    });

    return this.findOne(id);
  }

  async listarInscritos(id: string): Promise<Record<string, unknown>[]> {
    await this.findEntity(id);
    const inscricoes = await this.inscricoesService.findByTurma(id);
    return inscricoes.map((i) => ({
      inscricao_id: i.id,
      associado_id: i.associadoId,
      nome: i.associado?.nome ?? '',
      matricula: i.associado?.matricula ?? '',
      estado: i.estado,
    }));
  }

  async remove(
    id: string,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<void> {
    const turma = await this.findEntity(id);
    await this.turmasRepository.remove(turma);
    await this.auditoriaService.registrar({
      utilizadorId,
      accao: 'turmas:eliminar',
      entidade: 'turmas',
      entidadeId: id,
      antes: { codigo: turma.codigo, estado: turma.estado },
      ip,
    });
  }
}
