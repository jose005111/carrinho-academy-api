import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilAcesso } from './entities/perfil-acesso.entity';
import { PerfilPermissao } from './entities/perfil-permissao.entity';
import { Permissao } from '../permissoes/entities/permissao.entity';
import { User } from '../users/entities/user.entity';
import { PermissoesService } from '../permissoes/permissoes.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CODIGO_SUPER_ADMIN_PERFIL } from '../permissoes/permissoes.catalogo';

export interface PerfilResponse {
  id: string;
  nome: string;
  descricao: string | null;
  activo: boolean;
  sistema: boolean;
  permissoes: string[];
  utilizadores: number;
}

@Injectable()
export class PerfisService {
  constructor(
    @InjectRepository(PerfilAcesso)
    private readonly perfisRepository: Repository<PerfilAcesso>,
    @InjectRepository(PerfilPermissao)
    private readonly perfilPermissaoRepository: Repository<PerfilPermissao>,
    @InjectRepository(Permissao)
    private readonly permissoesRepository: Repository<Permissao>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly permissoesService: PermissoesService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  private async toResponse(perfil: PerfilAcesso): Promise<PerfilResponse> {
    const linhas = await this.perfilPermissaoRepository.find({
      where: { perfilId: perfil.id },
      relations: { permissao: true },
    });
    const utilizadores = await this.usersRepository.count({
      where: { perfilAcessoId: perfil.id },
    });
    return {
      id: perfil.id,
      nome: perfil.nome,
      descricao: perfil.descricao,
      activo: perfil.activo,
      sistema: perfil.sistema,
      permissoes: linhas.map((l) => l.permissao.codigo),
      utilizadores,
    };
  }

  async listar(): Promise<PerfilResponse[]> {
    const perfis = await this.perfisRepository.find({
      order: { nome: 'ASC' },
    });
    return Promise.all(perfis.map((p) => this.toResponse(p)));
  }

  async findOne(id: string): Promise<PerfilResponse> {
    const perfil = await this.perfisRepository.findOne({ where: { id } });
    if (!perfil) throw new NotFoundException('Perfil não encontrado');
    return this.toResponse(perfil);
  }

  async criar(
    dto: { nome: string; descricao?: string; permissoes: string[] },
    atorId: string,
    ip?: string | null,
  ): Promise<PerfilResponse> {
    await this.validarAntiEscalada(atorId, dto.permissoes);

    const existente = await this.perfisRepository.findOne({
      where: { nome: dto.nome },
    });
    if (existente) throw new ConflictException('Já existe um perfil com este nome');

    const perfil = await this.perfisRepository.save(
      this.perfisRepository.create({
        nome: dto.nome,
        descricao: dto.descricao ?? null,
        activo: true,
        sistema: false,
      }),
    );

    await this.setPermissoesInterno(perfil.id, dto.permissoes);

    await this.auditoriaService.registrar({
      utilizadorId: atorId,
      accao: 'perfis:criar',
      entidade: 'perfis',
      entidadeId: perfil.id,
      depois: { nome: perfil.nome, permissoes: dto.permissoes },
      ip,
    });

    return this.findOne(perfil.id);
  }

  async editar(
    id: string,
    dto: { nome?: string; descricao?: string; activo?: boolean },
    atorId: string,
    ip?: string | null,
  ): Promise<PerfilResponse> {
    const perfil = await this.obter(id);
    if (perfil.sistema) {
      throw new ForbiddenException('O perfil de sistema não pode ser editado');
    }
    if (dto.nome !== undefined) perfil.nome = dto.nome;
    if (dto.descricao !== undefined) perfil.descricao = dto.descricao;
    if (dto.activo !== undefined) {
      if (perfil.sistema && dto.activo === false) {
        throw new ForbiddenException('O perfil de sistema não pode ser desactivado');
      }
      perfil.activo = dto.activo;
    }
    await this.perfisRepository.save(perfil);
    this.permissoesService.invalidarCache();

    await this.auditoriaService.registrar({
      utilizadorId: atorId,
      accao: 'perfis:editar',
      entidade: 'perfis',
      entidadeId: id,
      depois: { nome: dto.nome, descricao: dto.descricao, activo: dto.activo },
      ip,
    });

    return this.findOne(id);
  }

  async setPermissoes(
    id: string,
    codigos: string[],
    atorId: string,
    ip?: string | null,
  ): Promise<PerfilResponse> {
    const perfil = await this.obter(id);
    if (perfil.sistema) {
      throw new ForbiddenException('As permissões do perfil de sistema não podem ser alteradas');
    }

    await this.validarAntiEscalada(atorId, codigos);
    await this.validarNaoRemoverProprioAcesso(id, codigos, atorId);

    await this.setPermissoesInterno(id, codigos);

    // invalida sessões dos utilizadores deste perfil
    await this.usersRepository.increment(
      { perfilAcessoId: id },
      'tokenVersion',
      1,
    );
    this.permissoesService.invalidarCache();

    await this.auditoriaService.registrar({
      utilizadorId: atorId,
      accao: 'perfis:gerir',
      entidade: 'perfis',
      entidadeId: id,
      depois: { permissoes: codigos },
      ip,
    });

    return this.findOne(id);
  }

  async clonar(id: string, atorId: string, ip?: string | null): Promise<PerfilResponse> {
    const original = await this.obter(id);
    const permissoes = await this.permissoesDoPerfil(id);
    await this.validarAntiEscalada(atorId, permissoes);
    return this.criar(
      { nome: `${original.nome} (cópia)`, descricao: original.descricao ?? undefined, permissoes },
      atorId,
      ip,
    );
  }

  async eliminar(id: string, atorId: string, ip?: string | null): Promise<void> {
    const perfil = await this.obter(id);
    if (perfil.sistema) {
      throw new ForbiddenException('O perfil de sistema não pode ser eliminado');
    }
    const utilizadores = await this.usersRepository.count({
      where: { perfilAcessoId: id },
    });
    if (utilizadores > 0) {
      throw new ConflictException(
        'Não é possível eliminar um perfil com utilizadores associados',
      );
    }
    await this.perfilPermissaoRepository.delete({ perfilId: id });
    await this.perfisRepository.remove(perfil);

    await this.auditoriaService.registrar({
      utilizadorId: atorId,
      accao: 'perfis:eliminar',
      entidade: 'perfis',
      entidadeId: id,
      antes: { nome: perfil.nome },
      ip,
    });
  }

  private async obter(id: string): Promise<PerfilAcesso> {
    const perfil = await this.perfisRepository.findOne({ where: { id } });
    if (!perfil) throw new NotFoundException('Perfil não encontrado');
    return perfil;
  }

  private async permissoesDoPerfil(perfilId: string): Promise<string[]> {
    const linhas = await this.perfilPermissaoRepository.find({
      where: { perfilId },
      relations: { permissao: true },
    });
    return linhas.map((l) => l.permissao.codigo);
  }

  private async setPermissoesInterno(
    perfilId: string,
    codigos: string[],
  ): Promise<void> {
    const unicos = [...new Set(codigos)];
    await this.perfilPermissaoRepository.delete({ perfilId });
    for (const codigo of unicos) {
      const permissao = await this.permissoesRepository.findOne({
        where: { codigo },
      });
      if (!permissao) {
        throw new BadRequestException(`Permissão desconhecida: ${codigo}`);
      }
      await this.perfilPermissaoRepository.save(
        this.perfilPermissaoRepository.create({ perfilId, permissaoId: permissao.id }),
      );
    }
  }

  private async validarAntiEscalada(
    atorId: string,
    codigos: string[],
  ): Promise<void> {
    const info = await this.permissoesService.getEffectiveInfo(atorId);
    if (info.isSuperAdmin) return;
    const emFalta = codigos.filter((c) => !info.codigos.has(c));
    if (emFalta.length > 0) {
      throw new ForbiddenException(
        `Não pode atribuir permissões que não possui: ${emFalta.join(', ')}`,
      );
    }
  }

  private async validarNaoRemoverProprioAcesso(
    perfilId: string,
    codigos: string[],
    atorId: string,
  ): Promise<void> {
    const ator = await this.usersRepository.findOne({ where: { id: atorId } });
    if (ator?.perfilAcessoId !== perfilId) return;
    const actual = await this.permissoesDoPerfil(perfilId);
    if (actual.includes('perfis:gerir') && !codigos.includes('perfis:gerir')) {
      throw new ForbiddenException(
        'Não pode remover o seu próprio acesso a perfis:gerir',
      );
    }
  }
}
