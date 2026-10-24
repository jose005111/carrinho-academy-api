import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, ILike, Repository } from "typeorm";
import { Formador } from "./entities/formador.entity";
import { CreateFormadorDto } from "./dto/create-formador.dto";
import { UpdateFormadorDto } from "./dto/update-formador.dto";
import { FormadorResponseDto } from "./dto/formador-response.dto";
import { ImportReport, ParsedImport } from "../common/reports/report";

const RELACOES_FORMACOES = ["formadorFormacoes", "formadorFormacoes.formacao"];

function normalizarSexo(sexo: string): string {
  const v = (sexo ?? '').trim().toLowerCase();
  if (['homem', 'masculino', 'm'].includes(v)) return 'Masculino';
  if (['mulher', 'feminino', 'f'].includes(v)) return 'Feminino';
  return (sexo ?? '').trim() || 'Masculino';
}

@Injectable()
export class FormadoresService {
  constructor(
    @InjectRepository(Formador)
    private readonly formadoresRepository: Repository<Formador>,
  ) {}

  async create(dto: CreateFormadorDto): Promise<FormadorResponseDto> {
    const formador = this.formadoresRepository.create(dto);
    const salvo = await this.formadoresRepository.save(formador);

    return {
      id: salvo.id,
      nome: salvo.nome,
      bi: salvo.bi,
      sexo: salvo.sexo,
      contacto: salvo.contacto,
      formacoes_como_principal: [],
      formacoes_como_supervisor: [],
    };
  }

  async findAll(query: Record<string, string> = {}): Promise<FormadorResponseDto[]> {
    const where: FindOptionsWhere<Formador> = {};
    if (query.nome) where.nome = ILike(`%${query.nome}%`);
    if (query.bi) where.bi = ILike(`%${query.bi}%`);
    if (query.contacto) where.contacto = ILike(`%${query.contacto}%`);
    if (query.sexo) where.sexo = query.sexo;

    const formadores = await this.formadoresRepository.find({
      where,
      relations: RELACOES_FORMACOES,
      order: { nome: "ASC" },
    });

    return formadores.map((formador) => this.formatar(formador));
  }

  async findOne(id: string): Promise<FormadorResponseDto> {
    const formador = await this.formadoresRepository.findOne({
      where: { id },
      relations: RELACOES_FORMACOES,
    });

    if (!formador) {
      throw new NotFoundException("Formador nao encontrado");
    }

    return this.formatar(formador);
  }

  async update(
    id: string,
    dto: UpdateFormadorDto,
  ): Promise<FormadorResponseDto> {
    const formador = await this.formadoresRepository.findOne({
      where: { id },
    });

    if (!formador) {
      throw new NotFoundException("Formador nao encontrado");
    }

    Object.assign(formador, dto);
    await this.formadoresRepository.save(formador);

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const formador = await this.formadoresRepository.findOne({
      where: { id },
    });

    if (!formador) {
      throw new NotFoundException("Formador nao encontrado");
    }

    await this.formadoresRepository.remove(formador);
  }

  async reportRows(
    query: Record<string, string> = {},
  ): Promise<Record<string, unknown>[]> {
    const formadores = await this.findAll(query);
    return formadores.map((f) => ({
      id: f.id,
      nome: f.nome,
      bi: f.bi,
      sexo: f.sexo,
      contacto: f.contacto ?? '',
      num_principal: f.formacoes_como_principal.length,
      num_supervisor: f.formacoes_como_supervisor.length,
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

      const existe = await this.formadoresRepository.findOne({ where: { bi } });
      if (existe) {
        relatorio.repetidos += 1;
        continue;
      }

      await this.formadoresRepository.save(
        this.formadoresRepository.create({
          nome,
          bi,
          sexo: normalizarSexo(row.sexo ?? ''),
          contacto: row.contacto?.trim() || undefined,
        }),
      );
      relatorio.importados += 1;
    }

    relatorio.message = `${relatorio.importados} formador(es) importado(s) com sucesso.`;
    return relatorio;
  }

  // Converte a entidade (com a tabela de juncao carregada) para o formato
  // que o frontend consome, separando as formacoes por papel do formador.
  private formatar(formador: Formador): FormadorResponseDto {
    const formacoes_como_principal = [];
    const formacoes_como_supervisor = [];

    for (const associacao of formador.formadorFormacoes ?? []) {
      const formacao = associacao.formacao;

      const item = {
        id: formacao.id,
        nome: formacao.nome,
        carga_horaria: formacao.carga_horaria,
      };

      if (associacao.supervisor) {
        formacoes_como_supervisor.push(item);
      } else {
        formacoes_como_principal.push(item);
      }
    }

    return {
      id: formador.id,
      nome: formador.nome,
      bi: formador.bi,
      sexo: formador.sexo,
      contacto: formador.contacto,
      formacoes_como_principal,
      formacoes_como_supervisor,
    };
  }
}
