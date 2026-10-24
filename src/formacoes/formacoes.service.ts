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

@Injectable()
export class FormacoesService {
  constructor(
    @InjectRepository(Formacao)
    private readonly formacoesRepository: Repository<Formacao>,
  ) {}

  create(dto: CreateFormacaoDto): Promise<Formacao> {
    const formacao = this.formacoesRepository.create({
      nome: dto.nome?.trim() || 'Formação',
      descricao: dto.descricao,
      nota: dto.nota,
      carga_horaria: dto.carga_horaria ?? 0,
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
    if (query.descricao) where.descricao = ILike(`%${query.descricao}%`);
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
    if (dto.nome !== undefined) formacao.nome = dto.nome.trim() || formacao.nome;
    if (dto.descricao !== undefined) formacao.descricao = dto.descricao;
    if (dto.nota !== undefined) formacao.nota = dto.nota;
    if (dto.carga_horaria !== undefined) formacao.carga_horaria = dto.carga_horaria;
    return this.formacoesRepository.save(formacao);
  }

  async remove(id: string): Promise<void> {
    const formacao = await this.findOne(id);
    try {
      await this.formacoesRepository.remove(formacao);
    } catch {
      throw new ConflictException(
        'Esta formação não pode ser eliminada porque tem formandos/formadores/turmas associados.',
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
      descricao: f.descricao ?? '',
      nota: f.nota ?? '',
      carga_horaria: f.carga_horaria,
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
      const nome = (row.nome ?? '').trim() || 'Formação';

      const existe = await this.formacoesRepository.findOne({
        where: { nome },
      });
      if (existe) {
        relatorio.repetidos += 1;
        continue;
      }

      await this.formacoesRepository.save(
        this.formacoesRepository.create({
          nome,
          descricao: row.descricao?.trim() || undefined,
          nota: row.nota?.trim() || undefined,
          carga_horaria: Number(row.carga_horaria) || 0,
        }),
      );
      relatorio.importados += 1;
    }

    relatorio.message = `${relatorio.importados} formação(ões) importada(s) com sucesso.`;
    return relatorio;
  }
}
