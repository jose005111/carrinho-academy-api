import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, ILike, Repository } from "typeorm";
import { Empresa } from "./entities/empresa.entity";
import { CreateEmpresaDto } from "./dto/create-empresa.dto";
import { UpdateEmpresaDto } from "./dto/update-empresa.dto";
import { ImportReport, ParsedImport } from "../common/reports/report";

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresasRepository: Repository<Empresa>,
  ) {}

  create(createEmpresaDto: CreateEmpresaDto): Promise<Empresa> {
    const empresa = this.empresasRepository.create(createEmpresaDto);
    return this.empresasRepository.save(empresa);
  }

  findAll(query: Record<string, string> = {}): Promise<Empresa[]> {
    const qb = this.empresasRepository
      .createQueryBuilder("empresa")
      .loadRelationCountAndMap("empresa.formandos", "empresa.formandos")
      .orderBy("empresa.nome", "ASC");

    if (query.nome) {
      qb.where("empresa.nome ILIKE :nome", { nome: `%${query.nome}%` });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Empresa> {
    const empresa = await this.empresasRepository.findOne({ where: { id } });
    if (!empresa) {
      throw new NotFoundException(`Empresa com ID "${id}" não encontrada`);
    }
    return empresa;
  }

  async update(
    id: string,
    updateEmpresaDto: UpdateEmpresaDto,
  ): Promise<Empresa> {
    const empresa = await this.findOne(id);
    Object.assign(empresa, updateEmpresaDto);
    return this.empresasRepository.save(empresa);
  }

  async remove(id: string): Promise<void> {
    const empresa = await this.findOne(id);
    try {
      await this.empresasRepository.remove(empresa);
    } catch {
      throw new ConflictException(
        "Esta empresa não pode ser eliminada porque tem formandos associados.",
      );
    }
  }

  async reportRows(
    query: Record<string, string> = {},
  ): Promise<Record<string, unknown>[]> {
    const empresas = await this.findAll(query);
    return empresas.map((e) => ({
      id: e.id,
      nome: e.nome,
      num_formandos: Number(e.formandos ?? 0),
      createdAt: e.createdAt?.toLocaleString("pt-PT"),
    }));
  }

  async importFromFile(parsed: ParsedImport): Promise<ImportReport> {
    const relatorio: ImportReport = {
      message: "",
      total: parsed.rows.length,
      importados: 0,
      repetidos: 0,
      invalidos: 0,
      erros: [],
    };

    for (const [indice, row] of parsed.rows.entries()) {
      const linha = indice + 2;
      const nome = (row.nome ?? "").trim();
      if (!nome) {
        relatorio.invalidos += 1;
        if (relatorio.erros.length < 50) {
          relatorio.erros.push({ linha, motivo: "Nome em falta" });
        }
        continue;
      }
      const existe = await this.empresasRepository.findOne({ where: { nome } });
      if (existe) {
        relatorio.repetidos += 1;
        continue;
      }
      await this.empresasRepository.save(
        this.empresasRepository.create({ nome }),
      );
      relatorio.importados += 1;
    }

    relatorio.message = `${relatorio.importados} empresa(s) importada(s) com sucesso.`;
    return relatorio;
  }
}
