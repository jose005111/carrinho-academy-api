import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Formando } from './entities/formando.entity';
import { CreateFormandoDto } from './dto/create-formando.dto';
import { UpdateFormandoDto } from './dto/update-formando.dto';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Endereco } from '../endereco/entities/endereco.entity';
import { ImportReport, ParsedImport } from '../common/reports/report';

function gerarMatricula(): string {
  return `FORM-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export interface FormandoFront extends Formando {
  area?: string;
  empresa_id?: string;
  endereco_id?: string;
  formacos: unknown[];
}

@Injectable()
export class FormandosService {
  constructor(
    @InjectRepository(Formando)
    private readonly formandosRepository: Repository<Formando>,
    @InjectRepository(Empresa)
    private readonly empresasRepository: Repository<Empresa>,
  ) {}

  async create(dto: CreateFormandoDto): Promise<Formando> {
    const empresaId = dto.empresaId ?? dto.empresa_id;
    if (!empresaId) {
      throw new NotFoundException('Empresa não informada');
    }
    const empresa = await this.empresasRepository.findOne({
      where: { id: empresaId },
    });
    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const formando = this.formandosRepository.create({
      nome: dto.nome,
      sexo: dto.sexo,
      bi: dto.bi,
      matricula: dto.matricula || gerarMatricula(),
      funcao: dto.funcao,
      areaDirecao: dto.areaDirecao ?? dto.area,
      totFormacoes: dto.totFormacoes ?? 0,
      empresa: { id: empresaId } as Empresa,
      endereco: dto.enderecoId ?? dto.endereco_id
        ? ({ id: (dto.enderecoId ?? dto.endereco_id) as string } as Endereco)
        : undefined,
    });

    return this.formandosRepository.save(formando);
  }

  findAll(query: Record<string, string> = {}): Promise<FormandoFront[]> {
    const where: FindOptionsWhere<Formando> = {};
    if (query.nome) where.nome = ILike(`%${query.nome}%`);
    if (query.bi) where.bi = ILike(`%${query.bi}%`);
    if (query.matricula) where.matricula = ILike(`%${query.matricula}%`);
    if (query.sexo) where.sexo = query.sexo;
    if (query.funcao) where.funcao = ILike(`%${query.funcao}%`);
    if (query.area || query.area_direcao) {
      where.areaDirecao = ILike(`%${query.area ?? query.area_direcao}%`);
    }
    if (query.empresa_id) {
      where.empresa = { id: query.empresa_id };
    }
    if (query.formacao_id) {
      where.formandoFormacoes = { formacaoId: query.formacao_id };
    }

    return this.formandosRepository
      .find({
        where,
        relations: {
          empresa: true,
          endereco: true,
          formandoFormacoes: { formacao: true },
        },
        order: { nome: 'ASC' },
      })
      .then((formandos) =>
        formandos.map((f) => ({
          ...f,
          area: f.areaDirecao,
          empresa_id: f.empresa?.id,
          endereco_id: f.endereco?.id,
          formacos: (f.formandoFormacoes ?? []).map((ff) => ff.formacao),
        })),
      );
  }

  async findOne(id: string): Promise<Formando> {
    const formando = await this.formandosRepository.findOne({
      where: { id },
      relations: { empresa: true, endereco: true, formandoFormacoes: true },
    });
    if (!formando) {
      throw new NotFoundException(`Formando com ID "${id}" não encontrado`);
    }
    return formando;
  }

  async update(id: string, dto: UpdateFormandoDto): Promise<Formando> {
    const formando = await this.findOne(id);
    Object.assign(formando, dto);
    if (dto.areaDirecao !== undefined) {
      formando.areaDirecao = dto.areaDirecao;
    }
    if (dto.area !== undefined) {
      formando.areaDirecao = dto.area;
    }
    const empresaId = dto.empresaId ?? dto.empresa_id;
    if (empresaId) {
      const empresa = await this.empresasRepository.findOne({
        where: { id: empresaId },
      });
      if (!empresa) throw new NotFoundException('Empresa não encontrada');
      formando.empresa = empresa;
    }
    const enderecoId = dto.enderecoId ?? dto.endereco_id;
    if (enderecoId) {
      formando.endereco = { id: enderecoId } as Endereco;
    }
    return this.formandosRepository.save(formando);
  }

  async remove(id: string): Promise<void> {
    const formando = await this.findOne(id);
    try {
      await this.formandosRepository.remove(formando);
    } catch {
      throw new ConflictException(
        'Este formando não pode ser eliminado porque tem formações associadas.',
      );
    }
  }

  async reportRows(
    query: Record<string, string> = {},
  ): Promise<Record<string, unknown>[]> {
    const formandos = await this.findAll(query);
    return formandos.map((f) => ({
      id: f.id,
      matricula: f.matricula,
      nome: f.nome,
      sexo: f.sexo,
      bi: f.bi,
      funcao: f.funcao ?? '',
      area: f.areaDirecao ?? '',
      empresa: f.empresa?.nome ?? '',
      num_formacoes: f.formacos?.length ?? 0,
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
      const bi = (row.bi ?? '').trim();

      if (!nome || !bi) {
        relatorio.invalidos += 1;
        if (relatorio.erros.length < 50) {
          relatorio.erros.push({
            linha,
            motivo: !nome ? 'Nome em falta' : 'BI em falta',
          });
        }
        continue;
      }

      const existe = await this.formandosRepository.findOne({ where: { bi } });
      if (existe) {
        relatorio.repetidos += 1;
        continue;
      }

      let empresaId: string | undefined;
      const empresaNome = (row.empresa ?? '').trim();
      if (empresaNome) {
        let empresa = await this.empresasRepository.findOne({
          where: { nome: empresaNome },
        });
        if (!empresa) {
          empresa = await this.empresasRepository.save(
            this.empresasRepository.create({ nome: empresaNome }),
          );
        }
        empresaId = empresa.id;
      } else if (row.empresa_id) {
        empresaId = row.empresa_id.trim();
      }
      if (!empresaId) {
        relatorio.invalidos += 1;
        if (relatorio.erros.length < 50) {
          relatorio.erros.push({ linha, motivo: 'Empresa não identificada' });
        }
        continue;
      }

      await this.formandosRepository.save(
        this.formandosRepository.create({
          nome,
          sexo: (row.sexo ?? '').trim() || 'Masculino',
          bi,
          matricula: (row.matricula ?? '').trim() || gerarMatricula(),
          funcao: row.funcao?.trim() || undefined,
          areaDirecao: row.area ?? row.area_direcao ?? undefined,
          totFormacoes: 0,
          empresa: { id: empresaId } as Empresa,
        }),
      );
      relatorio.importados += 1;
    }

    relatorio.message = `${relatorio.importados} formando(s) importado(s) com sucesso.`;
    return relatorio;
  }
}
