import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Formacao } from '../formacoes/entities/formacao.entity';
import { Formando } from '../formandos/entities/formando.entity';
import { Formador } from '../formadores/entities/formador.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { FormandoFormacao } from '../formando-formacao/entities/formando-formacao.entity';

export interface DashboardFiltros {
  inicio_de?: string;
  inicio_ate?: string;
  formador_id?: string;
  tipo?: string;
  formato?: string;
  certificado?: string;
}

const PALETTE = [
  '#8a4c72',
  '#b55a94',
  '#d676b1',
  '#6a3a56',
  '#4a2740',
  '#e8a5cd',
  '#a9608e',
  '#c97ba8',
  '#7d4466',
  '#f0c3de',
];

export interface PieItem {
  id: string;
  label: string;
  value: number;
  color: string;
  percent: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Formacao)
    private readonly formacoesRepository: Repository<Formacao>,
    @InjectRepository(Formando)
    private readonly formandosRepository: Repository<Formando>,
    @InjectRepository(Formador)
    private readonly formadoresRepository: Repository<Formador>,
    @InjectRepository(Empresa)
    private readonly empresasRepository: Repository<Empresa>,
    @InjectRepository(FormandoFormacao)
    private readonly formandoFormacaoRepository: Repository<FormandoFormacao>,
  ) {}

  async totais() {
    const [formandos, formadores, formacoes, empresas] = await Promise.all([
      this.formandosRepository.count(),
      this.formadoresRepository.count(),
      this.formacoesRepository.count(),
      this.empresasRepository.count(),
    ]);
    return { formandos, formadores, formacoes, empresas };
  }

  private buildFormacaoFiltro(filtros: DashboardFiltros): Record<string, unknown> {
    const where: Record<string, unknown> = {};
    if (filtros.tipo) where.tipo = filtros.tipo;
    if (filtros.formato) where.formato = filtros.formato;
    if (filtros.certificado) where.acesso_certificado = filtros.certificado;
    if (filtros.formador_id) {
      where.formadorFormacoes = { formadorId: filtros.formador_id };
    }
    return where;
  }

  async formacoes(filtros: DashboardFiltros = {}): Promise<PieItem[]> {
    const where = this.buildFormacaoFiltro(filtros);

    if (filtros.inicio_de || filtros.inicio_ate) {
      where.createdAt = Between(
        filtros.inicio_de ? new Date(`${filtros.inicio_de}T00:00:00`) : new Date(0),
        filtros.inicio_ate
          ? new Date(`${filtros.inicio_ate}T23:59:59`)
          : new Date('9999-12-31T23:59:59'),
      );
    }

    const formacoes = await this.formacoesRepository.find({
      where,
      relations: { formandoFormacoes: true },
      order: { nome: 'ASC' },
    });

    const total = formacoes.reduce(
      (acc, f) => acc + (f.formandoFormacoes?.length ?? 0),
      0,
    );

    return formacoes.map((f, i) => {
      const value = f.formandoFormacoes?.length ?? 0;
      return {
        id: f.id,
        label: f.nome,
        value,
        color: PALETTE[i % PALETTE.length],
        percent: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
      };
    });
  }

  async formandosPorEmpresa(): Promise<Record<string, string | number>[]> {
    const associacoes = await this.formandoFormacaoRepository.find({
      relations: { formando: { empresa: true }, formacao: true },
    });

    const mapa = new Map<
      string,
      { empresa: string; formacoes: Map<string, number> }
    >();

    for (const a of associacoes) {
      const empresaNome = a.formando?.empresa?.nome;
      if (!empresaNome || !a.formacao?.nome) continue;
      let entry = mapa.get(empresaNome);
      if (!entry) {
        entry = { empresa: empresaNome, formacoes: new Map() };
        mapa.set(empresaNome, entry);
      }
      entry.formacoes.set(
        a.formacao.nome,
        (entry.formacoes.get(a.formacao.nome) ?? 0) + 1,
      );
    }

    return [...mapa.values()].map((e) => {
      const row: Record<string, string | number> = { empresa: e.empresa };
      for (const [formacao, count] of e.formacoes) {
        row[formacao] = count;
      }
      return row;
    });
  }

  async reportRows(
    filtros: DashboardFiltros = {},
  ): Promise<Record<string, unknown>[]> {
    const where = this.buildFormacaoFiltro(filtros);
    if (filtros.inicio_de || filtros.inicio_ate) {
      where.createdAt = Between(
        filtros.inicio_de ? new Date(`${filtros.inicio_de}T00:00:00`) : new Date(0),
        filtros.inicio_ate
          ? new Date(`${filtros.inicio_ate}T23:59:59`)
          : new Date('9999-12-31T23:59:59'),
      );
    }
    const formacoes = await this.formacoesRepository.find({
      where,
      relations: { formandoFormacoes: true, formadorFormacoes: true },
      order: { nome: 'ASC' },
    });
    return formacoes.map((f) => ({
      id: f.id,
      nome: f.nome,
      tipo: f.tipo,
      formato: f.formato,
      carga_horaria: f.carga_horaria,
      local: f.local ?? '',
      acesso_certificado: f.acesso_certificado ?? '',
      num_formandos: f.formandoFormacoes?.length ?? 0,
      num_formadores: f.formadorFormacoes?.length ?? 0,
      created_at: f.createdAt?.toLocaleString('pt-PT'),
    }));
  }
}
