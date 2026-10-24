import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditoria } from './entities/auditoria.entity';

export interface RegistroAuditoria {
  utilizadorId?: string | null;
  accao: string;
  entidade: string;
  entidadeId?: string | null;
  antes?: unknown;
  depois?: unknown;
  ip?: string | null;
}

const VERBOS: Record<string, string> = {
  criar: 'criou',
  editar: 'editou',
  eliminar: 'eliminou',
  ativar: 'ativou',
  desativar: 'desativou',
  encerrar: 'encerrou',
  cancelar: 'cancelou',
  iniciar: 'iniciou',
  inscrever: 'inscreveu formandos em',
  atualizar_estado: 'atualizou o estado de',
  remover: 'removeu',
  resetar_password: 'redefiniu a password de',
  clonar: 'clonou',
  atualizar_permissoes: 'atualizou as permissões de',
};

const ENTIDADES: Record<string, string> = {
  tipos: 'tipo',
  formatos: 'formato',
  funcoes: 'função',
  areas: 'área',
  turmas: 'turma',
  configuracoes: 'configuração',
  users: 'utilizador',
  perfis: 'perfil',
  inscricoes: 'inscrição',
  anos_letivos: 'ano letivo',
  permissoes: 'permissão',
  utilizador_permissoes: 'permissões do utilizador',
};

function extrairValor(obj: unknown): string {
  if (!obj || typeof obj !== 'object') return '';
  const o = obj as Record<string, unknown>;
  for (const chave of ['nome', 'codigo', 'chave', 'ano', 'valor', 'estado', 'matricula']) {
    const v = o[chave];
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number') return String(v);
    if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  }
  return '';
}

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(Auditoria)
    private readonly auditoriaRepository: Repository<Auditoria>,
  ) {}

  async registrar(registro: RegistroAuditoria): Promise<Auditoria> {
    const entrada = this.auditoriaRepository.create({
      utilizadorId: registro.utilizadorId ?? null,
      accao: registro.accao,
      entidade: registro.entidade,
      entidadeId: registro.entidadeId ?? null,
      antes: registro.antes ?? null,
      depois: registro.depois ?? null,
      ip: registro.ip ?? null,
    });
    return this.auditoriaRepository.save(entrada);
  }

  private buildQuery(query: Record<string, string> = {}) {
    const qb = this.auditoriaRepository
      .createQueryBuilder('a')
      .leftJoin('users', 'u', 'u.id = a.utilizador_id')
      .leftJoin('perfil', 'p', 'p.id = u.perfil_id')
      .addSelect('p.nome', 'utilizador_nome');

    if (query.utilizadorId) {
      qb.andWhere('a.utilizador_id = :utilizadorId', {
        utilizadorId: query.utilizadorId,
      });
    }
    if (query.entidade) {
      qb.andWhere('a.entidade = :entidade', { entidade: query.entidade });
    }
    if (query.accao) {
      qb.andWhere('a.accao = :accao', { accao: query.accao });
    }
    if (query.dataInicio) {
      qb.andWhere('a.created_at >= :dataInicio', {
        dataInicio: new Date(query.dataInicio),
      });
    }
    if (query.dataFim) {
      qb.andWhere('a.created_at <= :dataFim', {
        dataFim: new Date(query.dataFim),
      });
    }

    return qb;
  }

  async listar(query: Record<string, string> = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);

    const totalQb = this.buildQuery(query);
    const total = await totalQb.getCount();

    const dataQb = this.buildQuery(query)
      .orderBy('a.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const raw = await dataQb.getRawMany();

    const data = raw.map((r) => {
      const utilizador: string | null = r.utilizador_nome ?? null;
      const entidade: string = r.a_entidade ?? '';
      const accao: string = r.a_accao ?? '';
      const verbo = accao.split(':').pop() ?? accao;
      const verboPt = VERBOS[verbo] ?? verbo;
      const entidadePt = ENTIDADES[entidade] ?? entidade;
      const valor = extrairValor(r.a_depois ?? r.a_antes);

      let descricao = `${utilizador ?? 'Sistema'} ${verboPt} ${entidadePt}`;
      if (valor) descricao += ` "${valor}"`;

      return {
        id: r.a_id,
        utilizador_id: r.a_utilizador_id ?? null,
        utilizador,
        accao,
        entidade,
        entidade_id: r.a_entidade_id ?? null,
        antes: r.a_antes ?? null,
        depois: r.a_depois ?? null,
        ip: r.a_ip ?? null,
        created_at: r.a_created_at ?? null,
        descricao,
      };
    });

    return { data, meta: { total, page, limit } };
  }
}
