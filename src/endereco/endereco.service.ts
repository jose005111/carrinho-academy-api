import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Endereco } from './entities/endereco.entity';
import { CreateEnderecoDto } from './dto/create-endereco.dto';
import { UpdateEnderecoDto } from './dto/update-endereco.dto';
import { ImportReport, ParsedImport } from '../common/reports/report';

@Injectable()
export class EnderecoService {
  constructor(
    @InjectRepository(Endereco)
    private readonly enderecoRepository: Repository<Endereco>,
  ) {}

  create(createEnderecoDto: CreateEnderecoDto): Promise<Endereco> {
    const endereco = this.enderecoRepository.create(createEnderecoDto);
    return this.enderecoRepository.save(endereco);
  }

  findAll(query: Record<string, string> = {}): Promise<Endereco[]> {
    const where: FindOptionsWhere<Endereco> = {};
    if (query.provincia) where.provincia = ILike(`%${query.provincia}%`);
    if (query.municipio) where.municipio = ILike(`%${query.municipio}%`);
    return this.enderecoRepository.find({
      where,
      order: { provincia: 'ASC', municipio: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Endereco> {
    const endereco = await this.enderecoRepository.findOne({ where: { id } });
    if (!endereco) {
      throw new NotFoundException(`Endereço com ID "${id}" não encontrado`);
    }
    return endereco;
  }

  async update(id: string, updateEnderecoDto: UpdateEnderecoDto): Promise<Endereco> {
    const endereco = await this.findOne(id);
    Object.assign(endereco, updateEnderecoDto);
    return this.enderecoRepository.save(endereco);
  }

  async remove(id: string): Promise<void> {
    const endereco = await this.findOne(id);
    try {
      await this.enderecoRepository.remove(endereco);
    } catch {
      throw new ConflictException(
        'Este endereço não pode ser eliminado porque tem formandos associados.',
      );
    }
  }

  async reportRows(
    query: Record<string, string> = {},
  ): Promise<Record<string, unknown>[]> {
    const enderecos = await this.findAll(query);
    return enderecos.map((e) => ({
      id: e.id,
      provincia: e.provincia,
      municipio: e.municipio,
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
      const provincia = (row.provincia ?? '').trim();
      const municipio = (row.municipio ?? '').trim();
      if (!provincia || !municipio) {
        relatorio.invalidos += 1;
        if (relatorio.erros.length < 50) {
          relatorio.erros.push({
            linha,
            motivo: !provincia ? 'Província em falta' : 'Município em falta',
          });
        }
        continue;
      }

      const existe = await this.enderecoRepository.findOne({
        where: { provincia, municipio },
      });
      if (existe) {
        relatorio.repetidos += 1;
        continue;
      }

      await this.enderecoRepository.save(
        this.enderecoRepository.create({ provincia, municipio }),
      );
      relatorio.importados += 1;
    }

    relatorio.message = `${relatorio.importados} endereço(s) importado(s) com sucesso.`;
    return relatorio;
  }
}
