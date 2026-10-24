import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tipo } from './entities/tipo.entity';
import { Formato } from './entities/formato.entity';
import { Funcao } from './entities/funcao.entity';
import { Area } from './entities/area.entity';
import { CreateCatalogoDto } from './dto/create-catalogo.dto';
import { UpdateCatalogoDto } from './dto/update-catalogo.dto';
import { AuditoriaService } from '../auditoria/auditoria.service';

export type CatalogoKind = 'tipos' | 'formatos' | 'funcoes' | 'areas';
type CatalogoEntity = Tipo | Formato | Funcao | Area;

@Injectable()
export class CatalogosService {
  constructor(
    @InjectRepository(Tipo) private readonly tiposRepository: Repository<Tipo>,
    @InjectRepository(Formato)
    private readonly formatosRepository: Repository<Formato>,
    @InjectRepository(Funcao)
    private readonly funcoesRepository: Repository<Funcao>,
    @InjectRepository(Area)
    private readonly areasRepository: Repository<Area>,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  private repo(kind: CatalogoKind): Repository<CatalogoEntity> {
    switch (kind) {
      case 'tipos':
        return this.tiposRepository;
      case 'formatos':
        return this.formatosRepository;
      case 'funcoes':
        return this.funcoesRepository;
      case 'areas':
        return this.areasRepository;
    }
  }

  async findAll(
    kind: CatalogoKind,
    apenasAtivos = false,
  ): Promise<CatalogoEntity[]> {
    const repo = this.repo(kind);
    return repo.find({
      where: apenasAtivos ? { activo: true } : {},
      order: { nome: 'ASC' },
    });
  }

  async create(
    kind: CatalogoKind,
    dto: CreateCatalogoDto,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<CatalogoEntity> {
    const repo = this.repo(kind);
    const nome = dto.nome.trim();
    const existente = await repo.findOne({ where: { nome } });
    if (existente) {
      throw new ConflictException(`Já existe um registo com o nome "${nome}".`);
    }
    const salvo = await repo.save(repo.create({ nome }));
    await this.auditoriaService.registrar({
      utilizadorId,
      accao: `${kind}:criar`,
      entidade: kind,
      entidadeId: salvo.id,
      depois: { nome: salvo.nome },
      ip,
    });
    return salvo;
  }

  async update(
    kind: CatalogoKind,
    id: string,
    dto: UpdateCatalogoDto,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<CatalogoEntity> {
    const repo = this.repo(kind);
    const item = await repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Registo não encontrado');

    if (dto.nome !== undefined) {
      const nome = dto.nome.trim();
      if (nome && nome !== item.nome) {
        const existente = await repo.findOne({ where: { nome } });
        if (existente) {
          throw new ConflictException(
            `Já existe um registo com o nome "${nome}".`,
          );
        }
      }
      item.nome = nome;
    }
    if (dto.activo !== undefined) item.activo = dto.activo;

    const salvo = await repo.save(item);
    await this.auditoriaService.registrar({
      utilizadorId,
      accao: `${kind}:editar`,
      entidade: kind,
      entidadeId: salvo.id,
      depois: { nome: salvo.nome, activo: salvo.activo },
      ip,
    });
    return salvo;
  }

  async setAtivo(
    kind: CatalogoKind,
    id: string,
    activo: boolean,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<CatalogoEntity> {
    return this.update(kind, id, { activo }, utilizadorId, ip);
  }

  async remove(
    kind: CatalogoKind,
    id: string,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<void> {
    const repo = this.repo(kind);
    const item = await repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Registo não encontrado');
    await repo.remove(item);
    await this.auditoriaService.registrar({
      utilizadorId,
      accao: `${kind}:eliminar`,
      entidade: kind,
      entidadeId: id,
      antes: { nome: item.nome },
      ip,
    });
  }
}
