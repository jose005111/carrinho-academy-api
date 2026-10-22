import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Formacao } from './entities/formacao.entity';
import { CreateFormacaoDto } from './dto/create-formacao.dto';
import { UpdateFormacaoDto } from './dto/update-formacao.dto';
import { ImportReport, ParsedImport } from '../common/reports/report';

export interface FormacaoFilters {
  nome?: string;
  tipo?: string;
  formato?: string;
  local?: string;
  acesso_certificado?: string;
  inicio_de?: string;
  inicio_ate?: string;
  formador_id?: string;
}

@Injectable()
export class FormacoesService {
  constructor(
    @InjectRepository(Formacao)
    private readonly formacoesRepository: Repository<Formacao>,
  ) {}

  create(dto: CreateFormacaoDto): Promise<Formacao> {
    const formacao = this.formacoesRepository.create({
      ...dto,
      inicio: dto.inicio ? new Date(dto.inicio) : undefined,
    });
    return this.formacoesRepository.save(formacao);
  }

  findAll(query: Record<string, string> = {}): Promise<Formacao[]> {
    const where: FindOptionsWhere<Formacao> = this.buildWhere(query);
    return this.formacoesRepository.find({
      where,
      relations: {
        formandoFormacoes: true,
        formadorFormacoes: { formador: true },
      },
      order: { nome: 'ASC' },
    });
  }

  async findAllMapped(
    query: Record<string, string> = {},
  ): Promise<Array<Formacao & { formandos: number }>> {
    const formacoes = await this.findAll(query);
    return formacoes.map((f) => ({
      ...f,
      formandos: f.formandoFormacoes?.length ?? 0,
    }));
  }

  buildWhere(query: Record<string, string> = {}): FindOptionsWhere<Formacao> {
    const where: FindOptionsWhere<Formacao> = {};
    if (query.nome) where.nome = ILike(`%${query.nome}%`);
    if (query.tipo) where.tipo = ILike(`%${query.tipo}%`);
    if (query.formato) where.formato = ILike(`%${query.formato}%`);
    if (query.local) where.local = ILike(`%${query.local}%`);
    if (query.acesso_certificado) {
      where.acesso_certificado = ILike(`%${query.acesso_certificado}%`);
    }
    return where;
  }

  async findOne(id: string): Promise<Formacao> {
    const formacao = await this.formacoesRepository.findOne({
      where: { id },
      relations: {
        formandoFormacoes: { formando: true },
        formadorFormacoes: { formador: true },
      },
    });

    if (!formacao) {
      throw new NotFoundException('Formacao nao encontrada');
    }

    return formacao;
  }

  async update(id: string, dto: UpdateFormacaoDto): Promise<Formacao> {
    const formacao = await this.findOne(id);
    Object.assign(formacao, dto);
    if (dto.inicio) {
      formacao.inicio = new Date(dto.inicio);
    }
    return this.formacoesRepository.save(formacao);
  }

  async remove(id: string): Promise<void> {
    const formacao = await this.findOne(id);
    try {
      await this.formacoesRepository.remove(formacao);
    } catch {
      throw new ConflictException(
        'Esta formação não pode ser eliminada porque tem formandos/formadores associados.',
      );
    }
  }

  async reportRows(
    query: Record<string, string> = {},
  ): Promise<Record<string, unknown>[]> {
    const formacoes = await this.findAll(query);
    return formacoes.map((f) => ({
      id: f.id,
      nome: f.nome,
      tipo: f.tipo,
      formato: f.formato,
      carga_horaria: f.carga_horaria,
      carga_horaria_anual: f.carga_horaria_anual ?? '',
      local: f.local ?? '',
      acesso_certificado: f.acesso_certificado ?? '',
      num_formandos: f.formandoFormacoes?.length ?? 0,
      num_formadores: f.formadorFormacoes?.length ?? 0,
    }));
  }

  async importFromFile(parsed: ParsedImport): Promise<ImportReport> {
    const relatorio: ImportReport = {
      message: '',
      total: parsed.rows.length,
      importados: 0,
      repetidos: 0,
      invalidos: 0,
      erros: [],
    };

    for (const [indice, row] of parsed.rows.entries()) {
      const linha = indice + 2;
      const nome = (row.nome ?? '').trim();
      if (!nome) {
        relatorio.invalidos += 1;
        if (relatorio.erros.length < 50) {
          relatorio.erros.push({ linha, motivo: 'Nome em falta' });
        }
        continue;
      }

      const existe = await this.formacoesRepository.findOne({
        where: { nome, tipo: (row.tipo ?? '').trim() || undefined },
      });
      if (existe) {
        relatorio.repetidos += 1;
        continue;
      }

      let cargaHoraria = (row.carga_horaria ?? '').trim();
      if (cargaHoraria && !/^\d{1,2}:\d{2}$/.test(cargaHoraria)) {
        const onlyDigits = cargaHoraria.replace(/\D/g, '');
        cargaHoraria = onlyDigits.length === 4
          ? `${onlyDigits.slice(0, 2)}:${onlyDigits.slice(2)}`
          : '00:00';
      }

      await this.formacoesRepository.save(
        this.formacoesRepository.create({
          nome,
          tipo: (row.tipo ?? '').trim() || 'Curso',
          formato: (row.formato ?? '').trim() || 'Presencial',
          descricao: row.descricao?.trim() || undefined,
          nota: row.nota?.trim() || undefined,
          carga_horaria: cargaHoraria || '00:00',
          carga_horaria_anual: row.carga_horaria_anual
            ? Number(row.carga_horaria_anual) || undefined
            : undefined,
          local: row.local?.trim() || undefined,
          acesso_certificado: row.acesso_certificado?.trim() || undefined,
        }),
      );
      relatorio.importados += 1;
    }

    relatorio.message = `${relatorio.importados} formação(ões) importada(s) com sucesso.`;
    return relatorio;
  }
}
