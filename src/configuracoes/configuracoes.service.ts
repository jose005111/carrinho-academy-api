import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuracao } from './entities/configuracao.entity';
import { ConfiguracaoTipo } from './enums/configuracao-tipo.enum';
import { AuditoriaService } from '../auditoria/auditoria.service';

export interface ConfiguracaoPublica {
  chave: string;
  valor: unknown;
  tipo: ConfiguracaoTipo;
}

@Injectable()
export class ConfiguracoesService implements OnModuleInit {
  // cache em memória, invalidado ao gravar
  private cache = new Map<string, unknown>();

  constructor(
    @InjectRepository(Configuracao)
    private readonly configuracoesRepository: Repository<Configuracao>,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.recarregarCache();
  }

  async recarregarCache(): Promise<void> {
    const configuracoes = await this.configuracoesRepository.find();
    const novoCache = new Map<string, unknown>();
    for (const config of configuracoes) {
      novoCache.set(config.chave, this.parse(config.valor, config.tipo));
    }
    this.cache = novoCache;
  }

  private parse(valor: string, tipo: ConfiguracaoTipo): unknown {
    switch (tipo) {
      case ConfiguracaoTipo.NUMBER:
        return Number(valor);
      case ConfiguracaoTipo.BOOLEAN:
        return valor === 'true';
      case ConfiguracaoTipo.JSON:
        try {
          return JSON.parse(valor);
        } catch {
          return null;
        }
      case ConfiguracaoTipo.DATE:
        return new Date(valor);
      case ConfiguracaoTipo.STRING:
      default:
        return valor;
    }
  }

  private serialize(valor: unknown, tipo: ConfiguracaoTipo): string {
    if (tipo === ConfiguracaoTipo.JSON) {
      return JSON.stringify(valor);
    }
    return String(valor);
  }

  async getString(chave: string, padrao = ''): Promise<string> {
    const valor = await this.get(chave);
    return valor === undefined || valor === null ? padrao : String(valor);
  }

  async getNumber(chave: string, padrao = 0): Promise<number> {
    const valor = await this.get(chave);
    const numero = Number(valor);
    return Number.isNaN(numero) ? padrao : numero;
  }

  async getBoolean(chave: string, padrao = false): Promise<boolean> {
    const valor = await this.get(chave);
    if (typeof valor === 'boolean') return valor;
    if (valor === 'true' || valor === 1) return true;
    if (valor === 'false' || valor === 0) return false;
    return padrao;
  }

  async getJson<T = unknown>(chave: string, padrao: T | null = null): Promise<T | null> {
    const valor = await this.get(chave);
    return valor === undefined || valor === null ? padrao : (valor as T);
  }

  async getDate(chave: string, padrao?: Date): Promise<Date | undefined> {
    const valor = await this.get(chave);
    if (valor instanceof Date) return valor;
    if (typeof valor === 'string' && valor) return new Date(valor);
    return padrao;
  }

  async get(chave: string): Promise<unknown> {
    if (!this.cache.has(chave)) {
      const config = await this.configuracoesRepository.findOne({
        where: { chave },
      });
      if (config) {
        this.cache.set(chave, this.parse(config.valor, config.tipo));
      }
    }
    return this.cache.get(chave);
  }

  async findAllAgrupado(): Promise<Record<string, Configuracao[]>> {
    const configuracoes = await this.configuracoesRepository.find({
      order: { grupo: 'ASC', chave: 'ASC' },
    });
    const agrupado: Record<string, Configuracao[]> = {};
    for (const config of configuracoes) {
      (agrupado[config.grupo] ??= []).push(config);
    }
    return agrupado;
  }

  async findAllPublicas(): Promise<ConfiguracaoPublica[]> {
    const configuracoes = await this.configuracoesRepository.find({
      order: { chave: 'ASC' },
    });
    return configuracoes.map((c) => ({
      chave: c.chave,
      valor: this.parse(c.valor, c.tipo),
      tipo: c.tipo,
    }));
  }

  async atualizar(
    chave: string,
    valor: unknown,
    utilizadorId?: string | null,
    ip?: string | null,
  ): Promise<Configuracao> {
    const config = await this.configuracoesRepository.findOne({ where: { chave } });
    if (!config) {
      throw new NotFoundException(`Configuração "${chave}" não encontrada`);
    }

    const valorAntigo = this.parse(config.valor, config.tipo);

    if (!this.validaTipo(valor, config.tipo)) {
      throw new BadRequestException(
        `Valor inválido para a configuração "${chave}". Esperado ${config.tipo}.`,
      );
    }

    const valorNovo = this.parse(this.serialize(valor, config.tipo), config.tipo);

    config.valor = this.serialize(valor, config.tipo);
    config.updatedBy = utilizadorId ?? null;
    await this.configuracoesRepository.save(config);

    // invalida o cache
    this.cache.set(chave, valorNovo);

    await this.auditoriaService.registrar({
      utilizadorId,
      accao: 'configuracoes:editar',
      entidade: 'configuracoes',
      entidadeId: config.id,
      antes: { valor: valorAntigo },
      depois: { valor: valorNovo },
      ip,
    });

    return config;
  }

  private validaTipo(valor: unknown, tipo: ConfiguracaoTipo): boolean {
    switch (tipo) {
      case ConfiguracaoTipo.NUMBER:
        return typeof valor === 'number' && !Number.isNaN(valor);
      case ConfiguracaoTipo.BOOLEAN:
        return typeof valor === 'boolean';
      case ConfiguracaoTipo.JSON:
        return typeof valor === 'object' || Array.isArray(valor);
      case ConfiguracaoTipo.DATE: {
        const data = new Date(String(valor));
        return !Number.isNaN(data.getTime());
      }
      case ConfiguracaoTipo.STRING:
      default:
        return typeof valor === 'string';
    }
  }
}
