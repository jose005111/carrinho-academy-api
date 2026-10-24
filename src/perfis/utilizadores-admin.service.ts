import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { PerfilAcesso } from './entities/perfil-acesso.entity';
import { Permissao } from '../permissoes/entities/permissao.entity';
import {
  EfeitoPermissao,
  UtilizadorPermissao,
} from './entities/utilizador-permissao.entity';
import { PerfilPermissao } from './entities/perfil-permissao.entity';
import { Cargo } from '../common/enums/cargo.enum';
import { PermissoesService } from '../permissoes/permissoes.service';
import { AuditoriaService } from '../auditoria/auditoria.service';

export interface ExtraPermissaoInput {
  codigo: string;
  efeito: EfeitoPermissao;
  expiraEm?: string | null;
  motivo?: string | null;
}

@Injectable()
export class UtilizadoresAdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(PerfilAcesso)
    private readonly perfisRepository: Repository<PerfilAcesso>,
    @InjectRepository(UtilizadorPermissao)
    private readonly utilizadorPermissaoRepository: Repository<UtilizadorPermissao>,
    @InjectRepository(PerfilPermissao)
    private readonly perfilPermissaoRepository: Repository<PerfilPermissao>,
    @InjectRepository(Permissao)
    private readonly permissoesRepository: Repository<Permissao>,
    private readonly permissoesService: PermissoesService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async listar(query: Record<string, string> = {}) {
    const qb = this.usersRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.perfil', 'perfil')
      .leftJoinAndSelect('u.perfilAcesso', 'perfilAcesso')
      .orderBy('u.created_at', 'DESC');

    if (query.q) {
      qb.andWhere('(u.email ILIKE :q OR perfil.nome ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }

    const users = await qb.getMany();
    return users.map((u) => ({
      id: u.id,
      nome: u.perfil?.nome ?? '',
      email: u.email,
      cargo: u.cargo,
      activo: u.activo,
      perfil_acesso_id: u.perfilAcessoId,
      perfil_acesso: u.perfilAcesso?.nome ?? null,
      token_version: u.tokenVersion,
    }));
  }

  async criar(
    dto: {
      nome: string;
      email: string;
      password: string;
      perfilAcessoId?: string;
      cargo?: Cargo;
    },
    atorId: string,
    ip?: string | null,
  ) {
    const existente = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existente) throw new ConflictException('Já existe um utilizador com este email');

    if (dto.password.length < 6) {
      throw new BadRequestException('A senha deve ter no mínimo 6 caracteres');
    }

    if (dto.perfilAcessoId) {
      await this.validarPerfilAcesso(dto.perfilAcessoId);
    }

    const user = await this.usersRepository.save(
      this.usersRepository.create({
        email: dto.email.trim().toLowerCase(),
        password: await bcrypt.hash(dto.password, 10),
        cargo: dto.cargo ?? Cargo.UTILIZADOR,
        perfilAcessoId: dto.perfilAcessoId ?? null,
        perfil: { nome: dto.nome },
      }),
    );

    await this.auditoriaService.registrar({
      utilizadorId: atorId,
      accao: 'utilizadores:criar',
      entidade: 'users',
      entidadeId: user.id,
      depois: { email: user.email, perfilAcessoId: user.perfilAcessoId },
      ip,
    });

    return this.listar({ q: user.email }).then((r) => r[0]);
  }

  async atualizar(
    id: string,
    dto: { nome?: string; email?: string; perfilAcessoId?: string; cargo?: Cargo },
    atorId: string,
    ip?: string | null,
  ) {
    const user = await this.obter(id);
    const mudouPerfil = dto.perfilAcessoId !== undefined && dto.perfilAcessoId !== user.perfilAcessoId;

    if (dto.email && dto.email !== user.email) {
      const existente = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (existente) throw new ConflictException('Já existe um utilizador com este email');
      user.email = dto.email.trim().toLowerCase();
    }
    if (dto.perfilAcessoId !== undefined) {
      if (dto.perfilAcessoId !== null) await this.validarPerfilAcesso(dto.perfilAcessoId);
      user.perfilAcessoId = dto.perfilAcessoId;
    }
    if (dto.cargo !== undefined) user.cargo = dto.cargo;

    await this.usersRepository.save(user);

    if (dto.nome && user.perfil) {
      user.perfil.nome = dto.nome;
      await this.usersRepository.manager.save(user.perfil);
    }

    if (mudouPerfil) {
      user.tokenVersion += 1;
      await this.usersRepository.save(user);
      this.permissoesService.invalidarCache(id);
    }

    await this.auditoriaService.registrar({
      utilizadorId: atorId,
      accao: 'utilizadores:editar',
      entidade: 'users',
      entidadeId: id,
      depois: { email: dto.email, perfilAcessoId: dto.perfilAcessoId },
      ip,
    });

    return this.listar({ q: user.email }).then((r) => r[0]);
  }

  async setActivo(id: string, activo: boolean, atorId: string, ip?: string | null) {
    const user = await this.obter(id);
    if (!activo) await this.validarUltimoSuperAdmin(user);
    user.activo = activo;
    user.tokenVersion += 1;
    await this.usersRepository.save(user);
    this.permissoesService.invalidarCache(id);

    await this.auditoriaService.registrar({
      utilizadorId: atorId,
      accao: activo ? 'utilizadores:ativar' : 'utilizadores:desativar',
      entidade: 'users',
      entidadeId: id,
      depois: { activo },
      ip,
    });

    return { id, activo };
  }

  async resetarPassword(id: string, novaSenha: string, atorId: string, ip?: string | null) {
    if (novaSenha.length < 6) {
      throw new BadRequestException('A senha deve ter no mínimo 6 caracteres');
    }
    const user = await this.obter(id);
    user.password = await bcrypt.hash(novaSenha, 10);
    user.tokenVersion += 1;
    await this.usersRepository.save(user);
    this.permissoesService.invalidarCache(id);

    await this.auditoriaService.registrar({
      utilizadorId: atorId,
      accao: 'utilizadores:reset_password',
      entidade: 'users',
      entidadeId: id,
      ip,
    });

    return { message: 'Password reposta com sucesso' };
  }

  async getPermissoes(id: string) {
    const user = await this.obter(id);

    let herdadas: string[] = [];
    if (user.perfilAcessoId) {
      const linhas = await this.perfilPermissaoRepository.find({
        where: { perfilId: user.perfilAcessoId },
        relations: { permissao: true },
      });
      herdadas = linhas.map((l) => l.permissao.codigo);
    }

    const extras = await this.utilizadorPermissaoRepository.find({
      where: { utilizadorId: id },
      relations: { permissao: true },
    });

    const efetivas = await this.permissoesService.getEffectiveInfo(id);

    return {
      perfil_acesso_id: user.perfilAcessoId,
      perfil_acesso: user.perfilAcesso?.nome ?? null,
      herdadas,
      extras: extras.map((e) => ({
        id: e.id,
        codigo: e.permissao.codigo,
        efeito: e.efeito,
        expira_em: e.expiraEm,
        motivo: e.motivo,
      })),
      efetivas: [...efetivas.codigos].sort(),
    };
  }

  async setPermissoesExtra(
    id: string,
    lista: ExtraPermissaoInput[],
    atorId: string,
    ip?: string | null,
  ) {
    const user = await this.obter(id);
    const infoAtor = await this.permissoesService.getEffectiveInfo(atorId);

    for (const item of lista) {
      const permissao = await this.permissoesRepository.findOne({
        where: { codigo: item.codigo },
      });
      if (!permissao) {
        throw new BadRequestException(`Permissão desconhecida: ${item.codigo}`);
      }
      if (item.efeito === EfeitoPermissao.ALLOW && !infoAtor.isSuperAdmin && !infoAtor.codigos.has(item.codigo)) {
        throw new ForbiddenException(
          `Não pode conceder a permissão que não possui: ${item.codigo}`,
        );
      }
    }

    await this.utilizadorPermissaoRepository.delete({ utilizadorId: id });
    for (const item of lista) {
      const permissao = await this.permissoesRepository.findOne({
        where: { codigo: item.codigo },
      });
      await this.utilizadorPermissaoRepository.save(
        this.utilizadorPermissaoRepository.create({
          utilizadorId: id,
          permissaoId: permissao!.id,
          efeito: item.efeito,
          expiraEm: item.expiraEm ? new Date(item.expiraEm) : null,
          motivo: item.motivo ?? null,
          concedidoPor: atorId,
        }),
      );
    }

    user.tokenVersion += 1;
    await this.usersRepository.save(user);
    this.permissoesService.invalidarCache(id);

    await this.auditoriaService.registrar({
      utilizadorId: atorId,
      accao: 'utilizadores:gerir',
      entidade: 'users',
      entidadeId: id,
      depois: { permissoes: lista.map((l) => l.codigo) },
      ip,
    });

    return this.getPermissoes(id);
  }

  private async obter(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { perfil: true, perfilAcesso: true },
    });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    return user;
  }

  private async validarPerfilAcesso(perfilAcessoId: string): Promise<void> {
    const perfil = await this.perfisRepository.findOne({
      where: { id: perfilAcessoId },
    });
    if (!perfil) throw new NotFoundException('Perfil de acesso não encontrado');
    if (!perfil.activo) throw new BadRequestException('O perfil de acesso está desactivado');
  }

  private async validarUltimoSuperAdmin(user: User): Promise<void> {
    const isSuper = user.cargo === Cargo.ADMIN || user.perfilAcesso?.sistema;
    if (!isSuper) return;
    const outrosSuper = await this.usersRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.perfilAcesso', 'pa')
      .where('u.id != :id', { id: user.id })
      .andWhere('u.activo = true')
      .andWhere("(u.cargo = 'admin' OR pa.sistema = true)")
      .getCount();
    if (outrosSuper === 0) {
      throw new ForbiddenException(
        'Não é possível desactivar o último Super Admin',
      );
    }
  }
}
