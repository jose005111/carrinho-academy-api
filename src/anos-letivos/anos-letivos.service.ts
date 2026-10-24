import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnoLetivo } from './entities/ano-letivo.entity';
import { CreateAnoLetivoDto } from './dto/create-ano-letivo.dto';
import { UpdateAnoLetivoDto } from './dto/update-ano-letivo.dto';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class AnosLetivosService {
  constructor(
    @InjectRepository(AnoLetivo)
    private readonly anosLetivosRepository: Repository<AnoLetivo>,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  findAll(apenasAtivos = false): Promise<AnoLetivo[]> {
    return this.anosLetivosRepository.find({
      where: apenasAtivos ? { activo: true } : {},
      order: { ano: 'ASC' },
    });
  }

  async create(
    dto: CreateAnoLetivoDto,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<AnoLetivo> {
    const ano = Number(dto.ano);
    const existente = await this.anosLetivosRepository.findOne({ where: { ano } });
    if (existente) {
      throw new ConflictException(`O ano letivo ${ano} já está cadastrado.`);
    }
    const salvo = await this.anosLetivosRepository.save(
      this.anosLetivosRepository.create({ ano }),
    );
    await this.auditoriaService.registrar({
      utilizadorId,
      accao: 'anos_letivos:criar',
      entidade: 'anos_letivos',
      entidadeId: salvo.id,
      depois: { ano: salvo.ano },
      ip,
    });
    return salvo;
  }

  async update(
    id: string,
    dto: UpdateAnoLetivoDto,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<AnoLetivo> {
    const item = await this.anosLetivosRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Ano letivo não encontrado');

    if (dto.ano !== undefined) {
      const ano = Number(dto.ano);
      if (ano !== item.ano) {
        const existente = await this.anosLetivosRepository.findOne({ where: { ano } });
        if (existente) {
          throw new ConflictException(`O ano letivo ${ano} já está cadastrado.`);
        }
      }
      item.ano = ano;
    }
    if (dto.activo !== undefined) item.activo = dto.activo;

    const salvo = await this.anosLetivosRepository.save(item);
    await this.auditoriaService.registrar({
      utilizadorId,
      accao: 'anos_letivos:editar',
      entidade: 'anos_letivos',
      entidadeId: salvo.id,
      depois: { ano: salvo.ano, activo: salvo.activo },
      ip,
    });
    return salvo;
  }

  async setAtivo(
    id: string,
    activo: boolean,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<AnoLetivo> {
    return this.update(id, { activo }, utilizadorId, ip);
  }

  async remove(
    id: string,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<void> {
    const item = await this.anosLetivosRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Ano letivo não encontrado');
    await this.anosLetivosRepository.remove(item);
    await this.auditoriaService.registrar({
      utilizadorId,
      accao: 'anos_letivos:eliminar',
      entidade: 'anos_letivos',
      entidadeId: id,
      antes: { ano: item.ano },
      ip,
    });
  }
}
