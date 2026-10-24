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

  async listar(query: Record<string, string> = {}) {
    const qb = this.auditoriaRepository.createQueryBuilder('a');

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

    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);

    qb.orderBy('a.created_at', 'DESC').skip((page - 1) * limit).take(limit);

    const [rows, total] = await qb.getManyAndCount();
    return { data: rows, meta: { total, page, limit } };
  }
}
