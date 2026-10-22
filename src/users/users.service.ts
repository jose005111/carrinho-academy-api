import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { User } from './entities/user.entity';
import { Perfil } from '../perfil/entities/perfil.entity';
import { Cargo } from '../common/enums/cargo.enum';
import { ImportReport, ParsedImport } from '../common/reports/report';

export interface UserResponse {
  id: string;
  nome: string;
  email: string;
  role: string;
  foto_url: string | null;
}

export interface SignupInput {
  nome: string;
  email: string;
  password: string;
  role?: number | string;
}

function cargoFromRole(role?: number | string): Cargo {
  const value = String(role ?? '').trim();
  if (value === '0' || value.toLowerCase() === 'admin') return Cargo.ADMIN;
  if (value === '1' || value.toLowerCase() === 'gestor') return Cargo.GESTOR;
  return Cargo.UTILIZADOR;
}

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    nome: user.perfil?.nome ?? '',
    email: user.email,
    role: user.cargo,
    foto_url: user.perfil?.foto ?? null,
  };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Perfil)
    private readonly perfilRepository: Repository<Perfil>,
  ) {}

  /**
   * Remove do disco um ficheiro de foto armazenado sob /uploads/...
   * Ignora erros silenciosamente (ficheiro já não existe, etc).
   */
  private async removerFotoDoDisco(fotoUrl: string | null): Promise<void> {
    if (!fotoUrl || !fotoUrl.startsWith('/uploads/')) return;
    const caminho = join(process.cwd(), fotoUrl);
    try {
      await unlink(caminho);
    } catch {
      // ficheiro inexistente ou sem permissões: não bloqueia o fluxo
    }
  }

  async create(dto: {
    email: string;
    password: string;
    cargo?: Cargo;
    perfil: { nome: string; foto?: string };
  }): Promise<User> {
    const existente = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (existente) {
      throw new ConflictException('Ja existe um utilizador com este email');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      email: dto.email,
      password: hashedPassword,
      cargo: dto.cargo ?? Cargo.UTILIZADOR,
      perfil: dto.perfil,
    });

    return this.usersRepository.save(user);
  }

  findAll(query: Record<string, string> = {}): Promise<UserResponse[]> {
    const where: FindOptionsWhere<User> = {};
    if (query.email) where.email = ILike(`%${query.email}%`);
    if (query.role) {
      where.cargo = Object.values(Cargo).includes(query.role as Cargo)
        ? (query.role as Cargo)
        : (cargoFromRole(query.role) as Cargo);
    }

    return this.usersRepository
      .find({
        where,
        relations: { perfil: true },
        order: { createdAt: 'DESC' },
      })
      .then((users) => users.map(toUserResponse));
  }

  async findOne(id: string): Promise<UserResponse> {
    const user = await this.findOneEntity(id);
    return toUserResponse(user);
  }

  async findOneEntity(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { perfil: true },
    });
    if (!user) {
      throw new NotFoundException('Utilizador nao encontrado');
    }
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: { perfil: true },
    });
  }

  async signup(input: SignupInput): Promise<UserResponse> {
    const user = await this.create({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      cargo: cargoFromRole(input.role),
      perfil: { nome: input.nome },
    });
    return toUserResponse(user);
  }

  async excluir(id: string): Promise<{ message: string }> {
    const user = await this.findOneEntity(id);

    if (user.cargo === Cargo.ADMIN) {
      return {
        message:
          'Este utilizador não pode ser eliminado porque tem o cargo de administrador.',
      };
    }

    await this.usersRepository.remove(user);
    await this.removerFotoDoDisco(user.perfil?.foto ?? null);
    return { message: 'Usuário deletado com sucesso!' };
  }

  async atualizarPerfil(
    userId: string,
    input: {
      nome?: string;
      email?: string;
      password?: string;
      password_confirmation?: string;
      foto?: string;
      removerFoto?: boolean;
    },
  ): Promise<UserResponse> {
    const user = await this.findOneEntity(userId);

    if (input.email && input.email !== user.email) {
      const existente = await this.usersRepository.findOne({
        where: { email: input.email },
      });
      if (existente) {
        throw new ConflictException('Ja existe um utilizador com este email');
      }
      user.email = input.email.trim().toLowerCase();
    }

    if (input.password) {
      if (input.password !== input.password_confirmation) {
        throw new ConflictException('As senhas não coincidem');
      }
      if (input.password.length < 6) {
        throw new ConflictException('A senha deve ter no mínimo 6 caracteres');
      }
      user.password = await bcrypt.hash(input.password, 10);
    }

    await this.usersRepository.save(user);

    if (user.perfil) {
      const fotoAnterior = user.perfil.foto ?? null;

      if (input.nome) user.perfil.nome = input.nome;

      if (input.removerFoto) {
        user.perfil.foto = null;
        await this.removerFotoDoDisco(fotoAnterior);
      } else if (input.foto && input.foto !== fotoAnterior) {
        user.perfil.foto = input.foto;
        await this.removerFotoDoDisco(fotoAnterior);
      }

      await this.perfilRepository.save(user.perfil);
    }

    return toUserResponse(await this.findOneEntity(userId));
  }

  async reportRows(
    query: Record<string, string> = {},
  ): Promise<Record<string, unknown>[]> {
    const users = await this.findAll(query);
    return users.map((u) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      role: u.role,
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
      const email = (row.email ?? '').trim().toLowerCase();
      const nome = (row.nome ?? '').trim();

      if (!email || !nome) {
        relatorio.invalidos += 1;
        if (relatorio.erros.length < 50) {
          relatorio.erros.push({
            linha,
            motivo: !email ? 'Email em falta' : 'Nome em falta',
          });
        }
        continue;
      }

      const existe = await this.usersRepository.findOne({ where: { email } });
      if (existe) {
        relatorio.repetidos += 1;
        continue;
      }

      await this.create({
        email,
        password: (row.password ?? '1234').trim() || '1234',
        cargo: cargoFromRole(row.role ?? row.cargo),
        perfil: { nome },
      });
      relatorio.importados += 1;
    }

    relatorio.message = `${relatorio.importados} utilizador(es) importado(s) com sucesso.`;
    return relatorio;
  }
}
