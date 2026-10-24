import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permissao } from './entities/permissao.entity';
import { PerfilAcesso } from '../perfis/entities/perfil-acesso.entity';
import { PerfilPermissao } from '../perfis/entities/perfil-permissao.entity';
import {
  UtilizadorPermissao,
} from '../perfis/entities/utilizador-permissao.entity';
import { User } from '../users/entities/user.entity';
import { Cargo } from '../common/enums/cargo.enum';
import { CATALOGO_PERMISSOES } from './permissoes.catalogo';
import { calcularPermissoesEfetivas } from './permissoes.logica';

export interface PermissoesEfetivas {
  codigos: Set<string>;
  tokenVersion: number;
  isSuperAdmin: boolean;
}

@Injectable()
export class PermissoesService implements OnModuleInit {
  private cache = new Map<string, PermissoesEfetivas>();

  constructor(
    @InjectRepository(Permissao)
    private readonly permissoesRepository: Repository<Permissao>,
    @InjectRepository(PerfilPermissao)
    private readonly perfilPermissaoRepository: Repository<PerfilPermissao>,
    @InjectRepository(UtilizadorPermissao)
    private readonly utilizadorPermissaoRepository: Repository<UtilizadorPermissao>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.syncCatalog();
  }

  async syncCatalog(): Promise<void> {
    for (const def of CATALOGO_PERMISSOES) {
      const existe = await this.permissoesRepository.findOne({
        where: { codigo: def.codigo },
      });
      if (!existe) {
        await this.permissoesRepository.save(
          this.permissoesRepository.create({
            codigo: def.codigo,
            modulo: def.modulo,
            accao: def.accao,
            descricao: def.descricao,
          }),
        );
      }
    }
  }

  async catalogoAgrupado(): Promise<Record<string, Permissao[]>> {
    const permissoes = await this.permissoesRepository.find({
      order: { modulo: 'ASC', accao: 'ASC' },
    });
    const agrupado: Record<string, Permissao[]> = {};
    for (const permissao of permissoes) {
      (agrupado[permissao.modulo] ??= []).push(permissao);
    }
    return agrupado;
  }

  async getEffectiveInfo(userId: string): Promise<PermissoesEfetivas> {
    const cached = this.cache.get(userId);
    if (cached) return cached;

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: { perfilAcesso: true },
    });

    if (!user) {
      const vazio: PermissoesEfetivas = {
        codigos: new Set(),
        tokenVersion: 0,
        isSuperAdmin: false,
      };
      this.cache.set(userId, vazio);
      return vazio;
    }

    if (user.cargo === Cargo.ADMIN || user.perfilAcesso?.sistema) {
      const info: PermissoesEfetivas = {
        codigos: new Set(CATALOGO_PERMISSOES.map((d) => d.codigo)),
        tokenVersion: user.tokenVersion,
        isSuperAdmin: true,
      };
      this.cache.set(userId, info);
      return info;
    }

    let perfilCodigos: string[] = [];
    if (user.perfilAcessoId) {
      const linhas = await this.perfilPermissaoRepository.find({
        where: { perfilId: user.perfilAcessoId },
        relations: { permissao: true },
      });
      perfilCodigos = linhas.map((l) => l.permissao.codigo);
    }

    const extras = await this.utilizadorPermissaoRepository.find({
      where: { utilizadorId: userId },
      relations: { permissao: true },
    });

    const codigos = calcularPermissoesEfetivas(
      perfilCodigos,
      extras.map((e) => ({
        codigo: e.permissao.codigo,
        efeito: e.efeito,
        expiraEm: e.expiraEm,
      })),
    );

    const info: PermissoesEfetivas = {
      codigos,
      tokenVersion: user.tokenVersion,
      isSuperAdmin: false,
    };
    this.cache.set(userId, info);
    return info;
  }

  async has(userId: string, codigo: string): Promise<boolean> {
    const info = await this.getEffectiveInfo(userId);
    return info.isSuperAdmin || info.codigos.has(codigo);
  }

  invalidarCache(userId?: string): void {
    if (userId) this.cache.delete(userId);
    else this.cache.clear();
  }
}
