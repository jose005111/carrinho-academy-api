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
import { Genero } from '../common/enums/genero.enum';
import { Inscricao } from '../inscricoes/entities/inscricao.entity';
import { InscricaoEstado } from '../inscricoes/enums/inscricao-estado.enum';
import { TurmaEstado } from '../turmas/enums/turma-estado.enum';
import { FormandoFormacao } from '../formando-formacao/entities/formando-formacao.entity';
import { Funcao } from '../catalogos/entities/funcao.entity';
import { Area } from '../catalogos/entities/area.entity';

function gerarMatricula(): string {
  return `FORM-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

function generoFromSexo(sexo: string | null | undefined): Genero | null {
  const valor = (sexo ?? '').trim().toLowerCase();
  if (['homem', 'masculino', 'm'].includes(valor)) return Genero.M;
  if (['mulher', 'feminino', 'f'].includes(valor)) return Genero.F;
  if (['outro', 'outros', 'o'].includes(valor)) return Genero.OUTRO;
  return null;
}

function normalizarSexo(sexo: string): string {
  const valor = (sexo ?? '').trim().toLowerCase();
  if (['homem', 'masculino', 'm'].includes(valor)) return 'Masculino';
  if (['mulher', 'feminino', 'f'].includes(valor)) return 'Feminino';
  return (sexo ?? '').trim() || 'Masculino';
}

export interface FormandoFront extends Omit<Formando, 'funcao' | 'area'> {
  funcao: string | null;
  area: string | null;
  funcao_id?: string | null;
  area_id?: string | null;
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
    @InjectRepository(Inscricao)
    private readonly inscricoesRepository: Repository<Inscricao>,
    @InjectRepository(FormandoFormacao)
    private readonly formandoFormacaoRepository: Repository<FormandoFormacao>,
    @InjectRepository(Funcao)
    private readonly funcoesRepository: Repository<Funcao>,
    @InjectRepository(Area)
    private readonly areasRepository: Repository<Area>,
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
      sexo: normalizarSexo(dto.sexo),
      genero: generoFromSexo(dto.sexo),
      bi: dto.bi,
      matricula: dto.matricula || gerarMatricula(),
      funcaoId: dto.funcao_id ?? null,
      areaId: dto.area_id ?? null,
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
    if (query.funcao) where.funcao = { nome: ILike(`%${query.funcao}%`) };
    if (query.area || query.area_direcao) {
      where.area = { nome: ILike(`%${query.area ?? query.area_direcao}%`) };
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
          funcao: true,
          area: true,
          formandoFormacoes: { formacao: true },
        },
        order: { nome: 'ASC' },
      })
      .then((formandos) =>
        formandos.map((f) => ({
          ...f,
          funcao: f.funcao?.nome ?? null,
          area: f.area?.nome ?? null,
          funcao_id: f.funcaoId ?? null,
          area_id: f.areaId ?? null,
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

  async formacoesComEstado(formandoId: string): Promise<Record<string, unknown>[]> {
    const formando = await this.formandosRepository.findOne({
      where: { id: formandoId },
    });
    if (!formando) throw new NotFoundException('Formando não encontrado');

    const inscricoes = await this.inscricoesRepository.find({
      where: { associadoId: formandoId },
      relations: { turma: { formacao: true } },
    });

    const viaTurma = inscricoes.map((i) => ({
      formacao_id: i.turma?.formacao?.id ?? null,
      nome: i.turma?.formacao?.nome ?? '',
      estado: i.estado,
      origem: 'turma',
      turma_codigo: i.turma?.codigo ?? null,
    }));

    const idsTurma = new Set(
      viaTurma.map((v) => v.formacao_id).filter((id): id is string => !!id),
    );

    const diretas = await this.formandoFormacaoRepository.find({
      where: { formandoId },
      relations: { formacao: true },
    });

    const externa = diretas
      .filter((d) => !idsTurma.has(d.formacaoId))
      .map((d) => ({
        formacao_id: d.formacaoId,
        nome: d.formacao?.nome ?? '',
        estado: 'CONCLUIDO',
        origem: 'externa',
        turma_codigo: null,
      }));

    return [...viaTurma, ...externa];
  }

  async findEmCurso(): Promise<Record<string, unknown>[]> {
    const inscricoes = await this.inscricoesRepository.find({
      where: { estado: InscricaoEstado.INSCRITO },
      relations: {
        turma: { formacao: true },
        associado: { empresa: true, funcao: true, area: true },
      },
    });

    const mapa = new Map<string, Record<string, unknown>>();
    for (const i of inscricoes) {
      if (i.turma?.estado !== TurmaEstado.EM_CURSO) continue;
      const f = i.associado;
      if (!f) continue;
      if (!mapa.has(f.id)) {
        mapa.set(f.id, {
          id: f.id,
          nome: f.nome,
          bi: f.bi,
          sexo: f.sexo,
          matricula: f.matricula,
          funcao: f.funcao?.nome ?? null,
          funcao_id: f.funcaoId ?? null,
          area: f.area?.nome ?? null,
          area_id: f.areaId ?? null,
          empresa: f.empresa ?? null,
          empresa_id: f.empresa?.id ?? null,
          formacao_atual: {
            formacao_id: i.turma.formacao?.id ?? null,
            nome: i.turma.formacao?.nome ?? '',
            turma_id: i.turma.id,
            turma_codigo: i.turma.codigo ?? null,
          },
        });
      }
    }

    return [...mapa.values()].sort((a, b) =>
      String(a.nome).localeCompare(String(b.nome)),
    );
  }

  async update(id: string, dto: UpdateFormandoDto): Promise<Formando> {
    const formando = await this.findOne(id);
    if (dto.nome !== undefined) formando.nome = dto.nome;
    if (dto.bi !== undefined) formando.bi = dto.bi;
    if (dto.matricula !== undefined) formando.matricula = dto.matricula;
    if (dto.totFormacoes !== undefined) formando.totFormacoes = dto.totFormacoes;
    if (dto.sexo !== undefined) {
      formando.sexo = normalizarSexo(dto.sexo);
      formando.genero = generoFromSexo(dto.sexo);
    }
    if (dto.funcao_id !== undefined) formando.funcaoId = dto.funcao_id ?? null;
    if (dto.area_id !== undefined) formando.areaId = dto.area_id ?? null;

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
      area: f.area ?? '',
      empresa: f.empresa?.nome ?? '',
      num_formacoes: f.formacos?.length ?? 0,
    }));
  }

  private async resolverOuCriarFuncao(nome: string | undefined): Promise<string | null> {
    const valor = (nome ?? '').trim();
    if (!valor) return null;
    let funcao = await this.funcoesRepository.findOne({ where: { nome: valor } });
    if (!funcao) {
      funcao = await this.funcoesRepository.save(
        this.funcoesRepository.create({ nome: valor }),
      );
    }
    return funcao.id;
  }

  private async resolverOuCriarArea(nome: string | undefined): Promise<string | null> {
    const valor = (nome ?? '').trim();
    if (!valor) return null;
    let area = await this.areasRepository.findOne({ where: { nome: valor } });
    if (!area) {
      area = await this.areasRepository.save(
        this.areasRepository.create({ nome: valor }),
      );
    }
    return area.id;
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

      const sexo = normalizarSexo(row.sexo ?? '');
      const funcaoId = await this.resolverOuCriarFuncao(row.funcao);
      const areaId = await this.resolverOuCriarArea(row.area ?? row.area_direcao);

      await this.formandosRepository.save(
        this.formandosRepository.create({
          nome,
          sexo,
          genero: generoFromSexo(sexo),
          bi,
          matricula: (row.matricula ?? '').trim() || gerarMatricula(),
          funcaoId,
          areaId,
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
