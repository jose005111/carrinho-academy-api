import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Turma } from '../turmas/entities/turma.entity';
import { Inscricao } from '../inscricoes/entities/inscricao.entity';
import { InscricaoEstado } from '../inscricoes/enums/inscricao-estado.enum';
import { InscricaoOrigem } from '../inscricoes/enums/inscricao-origem.enum';
import { TurmaEstado } from '../turmas/enums/turma-estado.enum';
import { Formando } from '../formandos/entities/formando.entity';
import { ConfiguracoesService } from '../configuracoes/configuracoes.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { InscricaoBulkDto, FiltrosCandidatosDto } from './dto/atribuicoes.dto';
import {
  estadosExcluidos,
  excedeLotacao,
  turmaEncerrada,
} from './atribuicoes.logica';

export type MotivoIgnorado =
  | 'JA_TEM_FORMACAO'
  | 'JA_INSCRITO'
  | 'TURMA_CHEIA'
  | 'ASSOCIADO_INEXISTENTE';

export interface ResultadoInscricaoBulk {
  inseridos: number;
  ignorados: Array<{ associadoId: string; motivo: MotivoIgnorado }>;
}

interface FiltrosNormalizados {
  empresaIds?: string[];
  genero?: string;
  minFormacoes?: number;
  maxFormacoes?: number;
  q?: string;
}

@Injectable()
export class AtribuicoesService {
  constructor(
    @InjectRepository(Turma)
    private readonly turmasRepository: Repository<Turma>,
    @InjectRepository(Inscricao)
    private readonly inscricoesRepository: Repository<Inscricao>,
    @InjectRepository(Formando)
    private readonly formandosRepository: Repository<Formando>,
    private readonly configuracoesService: ConfiguracoesService,
    private readonly auditoriaService: AuditoriaService,
    private readonly dataSource: DataSource,
  ) {}

  private async carregarTurma(turmaId: string): Promise<Turma> {
    const turma = await this.turmasRepository.findOne({
      where: { id: turmaId },
      relations: { formacao: true },
    });
    if (!turma) throw new NotFoundException('Turma não encontrada');
    return turma;
  }

  private normalizarFiltros(
    filtros: FiltrosCandidatosDto | undefined,
  ): FiltrosNormalizados {
    const f = filtros ?? {};
    const empresaIds = Array.isArray(f.empresaIds)
      ? f.empresaIds.map((s) => s.trim()).filter(Boolean)
      : [];
    return {
      empresaIds,
      genero: f.genero?.trim() || undefined,
      minFormacoes: f.minFormacoes ?? undefined,
      maxFormacoes: f.maxFormacoes ?? undefined,
      q: f.q?.trim() || undefined,
    };
  }

  private buildCandidatosQuery(
    turma: Turma,
    filtros: FiltrosNormalizados,
    estadosExcluidos: InscricaoEstado[],
  ): SelectQueryBuilder<Formando> {
    const qb = this.formandosRepository
      .createQueryBuilder('f')
      .leftJoin('f.empresa', 'empresa');

    qb.where(
      `NOT EXISTS (
        SELECT 1 FROM inscricoes i
        INNER JOIN turmas t ON t.id = i.turma_id
        WHERE i.associado_id = f.id
          AND t.formacao_id = :formacaoId
          AND i.estado IN (:...estadosExcluidos)
      )`,
      { formacaoId: turma.formacaoId, estadosExcluidos },
    );

    if (filtros.empresaIds?.length) {
      qb.andWhere('empresa.id IN (:...empresaIds)', {
        empresaIds: filtros.empresaIds,
      });
    }
    if (filtros.genero) {
      qb.andWhere('f.genero = :genero', { genero: filtros.genero });
    }
    if (filtros.q) {
      qb.andWhere(
        '(f.nome ILIKE :q OR f.matricula ILIKE :q OR f.bi ILIKE :q)',
        { q: `%${filtros.q}%` },
      );
    }
    if (filtros.minFormacoes !== undefined) {
      qb.andWhere(
        `(SELECT COUNT(*) FROM inscricoes ic WHERE ic.associado_id = f.id AND ic.estado = 'CONCLUIDO') >= :minFormacoes`,
        { minFormacoes: filtros.minFormacoes },
      );
    }
    if (filtros.maxFormacoes !== undefined) {
      qb.andWhere(
        `(SELECT COUNT(*) FROM inscricoes ic WHERE ic.associado_id = f.id AND ic.estado = 'CONCLUIDO') <= :maxFormacoes`,
        { maxFormacoes: filtros.maxFormacoes },
      );
    }

    return qb;
  }

  async listarCandidatos(turmaId: string, query: Record<string, string>) {
    const turma = await this.carregarTurma(turmaId);
    const incluirDesistentes = await this.configuracoesService.getBoolean(
      'incluir_desistentes_nas_sugestoes',
      true,
    );

    const filtros = this.normalizarFiltros({
      empresaIds: query.empresaId
        ? String(query.empresaId).split(',')
        : query.empresaIds
          ? String(query.empresaIds).split(',')
          : undefined,
      genero: query.genero,
      minFormacoes: query.minFormacoes
        ? Number(query.minFormacoes)
        : undefined,
      maxFormacoes: query.maxFormacoes
        ? Number(query.maxFormacoes)
        : undefined,
      q: query.q,
    });

    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);

    const qb = this.buildCandidatosQuery(
      turma,
      filtros,
      estadosExcluidos(incluirDesistentes),
    );

    qb.select(['f.id', 'f.nome', 'f.matricula', 'f.genero', 'empresa.id', 'empresa.nome'])
      .addSelect(
        `(SELECT COUNT(*) FROM inscricoes ic WHERE ic.associado_id = f.id AND ic.estado = 'CONCLUIDO')`,
        'total_formacoes',
      )
      .addSelect(
        `(SELECT MAX(ic2.data_conclusao) FROM inscricoes ic2 WHERE ic2.associado_id = f.id AND ic2.estado = 'CONCLUIDO')`,
        'ultima_formacao_em',
      );

    const ordem: Record<string, string> = {
      nome: 'f.nome',
      matricula: 'f.matricula',
      total_formacoes: 'total_formacoes',
      ultima_formacao_em: 'ultima_formacao_em',
    };
    qb.orderBy(ordem[query.orderBy ?? ''] ?? 'f.nome', 'ASC');

    const total = await qb.getCount();
    qb.skip((page - 1) * limit).take(limit);
    const raw = await qb.getRawMany();

    const inscritos = await this.inscricoesRepository.count({
      where: { turmaId, estado: InscricaoEstado.INSCRITO },
    });
    const vagas =
      turma.lotacao > 0 ? Math.max(turma.lotacao - inscritos, 0) : null;

    return {
      data: raw.map((r) => ({
        id: r.f_id,
        nome: r.f_nome,
        matricula: r.f_matricula,
        genero: r.f_genero,
        empresa: r.empresa_nome ?? null,
        empresa_id: r.empresa_id ?? null,
        total_formacoes: Number(r.total_formacoes ?? 0),
        ultima_formacao_em: r.ultima_formacao_em ?? null,
      })),
      meta: {
        total,
        page,
        limit,
        vagas,
        lotacao: turma.lotacao,
      },
    };
  }

  async resolverIdsCandidatos(
    turma: Turma,
    filtros: FiltrosNormalizados,
  ): Promise<string[]> {
    const incluirDesistentes = await this.configuracoesService.getBoolean(
      'incluir_desistentes_nas_sugestoes',
      true,
    );
    const qb = this.buildCandidatosQuery(
      turma,
      filtros,
      estadosExcluidos(incluirDesistentes),
    );
    qb.select('f.id', 'id');
    const rows = await qb.getRawMany<{ id: string }>();
    return rows.map((r) => r.id);
  }

  async inscreverBulk(
    turmaId: string,
    dto: InscricaoBulkDto,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<ResultadoInscricaoBulk> {
    const turma = await this.carregarTurma(turmaId);
    const incluirDesistentes = await this.configuracoesService.getBoolean(
      'incluir_desistentes_nas_sugestoes',
      true,
    );
    const maxFormandos = await this.configuracoesService.getNumber(
      'max_formandos_por_turma',
      0,
    );
    const estados = estadosExcluidos(incluirDesistentes);

    let associadoIds: string[];
    if (dto.selecionarTodosFiltrados) {
      const ids = await this.resolverIdsCandidatos(
        turma,
        this.normalizarFiltros(dto.filtros),
      );
      const excluir = new Set(dto.excluirIds ?? []);
      associadoIds = ids.filter((id) => !excluir.has(id));
    } else {
      associadoIds = dto.associadoIds ?? [];
    }

    const resultado: ResultadoInscricaoBulk = { inseridos: 0, ignorados: [] };
    const idsUnicos = [...new Set(associadoIds)];

    await this.dataSource.transaction(async (manager) => {
      let inscritosAtual = await manager.count(Inscricao, {
        where: { turmaId, estado: InscricaoEstado.INSCRITO },
      });

      for (const associadoId of idsUnicos) {
        const associado = await manager.findOne(Formando, {
          where: { id: associadoId },
        });
        if (!associado) {
          resultado.ignorados.push({
            associadoId,
            motivo: 'ASSOCIADO_INEXISTENTE',
          });
          continue;
        }

        const existente = await manager.findOne(Inscricao, {
          where: { turmaId, associadoId },
        });
        if (existente) {
          resultado.ignorados.push({ associadoId, motivo: 'JA_INSCRITO' });
          continue;
        }

        const jaTemFormacao = await manager
          .createQueryBuilder(Inscricao, 'i')
          .innerJoin('i.turma', 't')
          .where('i.associado_id = :associadoId', { associadoId })
          .andWhere('t.formacao_id = :formacaoId', {
            formacaoId: turma.formacaoId,
          })
          .andWhere('i.estado IN (:...estadosExcluidos)', {
            estadosExcluidos: estados,
          })
          .getExists();
        if (jaTemFormacao) {
          resultado.ignorados.push({
            associadoId,
            motivo: 'JA_TEM_FORMACAO',
          });
          continue;
        }

        if (excedeLotacao(inscritosAtual, maxFormandos)) {
          resultado.ignorados.push({ associadoId, motivo: 'TURMA_CHEIA' });
          continue;
        }

        const concluida = turmaEncerrada(turma.estado);
        const estado = concluida
          ? InscricaoEstado.CONCLUIDO
          : InscricaoEstado.INSCRITO;
        const origem = concluida
          ? InscricaoOrigem.RETROATIVA
          : InscricaoOrigem.MANUAL;

        await manager.save(
          manager.create(Inscricao, {
            turmaId,
            associadoId,
            estado,
            origem,
            dataInscricao: new Date(),
            dataConclusao: concluida ? new Date() : null,
            criadoPor: utilizadorId ?? null,
          }),
        );
        if (!concluida) inscritosAtual += 1;
        resultado.inseridos += 1;
      }
    });

    await this.auditoriaService.registrar({
      utilizadorId,
      accao: 'atribuicoes:inscrever',
      entidade: 'turmas',
      entidadeId: turmaId,
      antes: { associadoIds: idsUnicos },
      depois: resultado,
      ip,
    });

    return resultado;
  }

  async atualizarEstadoInscricao(
    turmaId: string,
    associadoId: string,
    estado: InscricaoEstado,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<Inscricao> {
    const inscricao = await this.inscricoesRepository.findOne({
      where: { turmaId, associadoId },
    });
    if (!inscricao) throw new NotFoundException('Inscrição não encontrada');

    inscricao.estado = estado;
    inscricao.dataConclusao =
      estado === InscricaoEstado.CONCLUIDO
        ? new Date()
        : inscricao.dataConclusao;

    const salva = await this.inscricoesRepository.save(inscricao);

    await this.auditoriaService.registrar({
      utilizadorId,
      accao: 'atribuicoes:atualizar_estado',
      entidade: 'inscricoes',
      entidadeId: inscricao.id,
      antes: { estado: inscricao.estado },
      depois: { estado },
      ip,
    });

    return salva;
  }

  async removerInscricao(
    turmaId: string,
    associadoId: string,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<void> {
    const inscricao = await this.inscricoesRepository.findOne({
      where: { turmaId, associadoId },
    });
    if (!inscricao) throw new NotFoundException('Inscrição não encontrada');
    await this.inscricoesRepository.remove(inscricao);

    await this.auditoriaService.registrar({
      utilizadorId,
      accao: 'atribuicoes:remover',
      entidade: 'inscricoes',
      entidadeId: inscricao.id,
      antes: { turmaId, associadoId, estado: inscricao.estado },
      ip,
    });
  }
}
