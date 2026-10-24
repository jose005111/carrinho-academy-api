import { calcularPermissoesEfetivas } from './permissoes.logica';
import { EfeitoPermissao } from '../perfis/entities/utilizador-permissao.entity';

describe('calcularPermissoesEfetivas', () => {
  it('devolve as permissões do perfil quando não há extras', () => {
    const efetivas = calcularPermissoesEfetivas(
      ['turmas:ver', 'turmas:criar'],
      [],
    );
    expect([...efetivas].sort()).toEqual(['turmas:criar', 'turmas:ver']);
  });

  it('ALLOW adiciona permissões não herdadas do perfil', () => {
    const efetivas = calcularPermissoesEfetivas(['turmas:ver'], [
      { codigo: 'turmas:criar', efeito: EfeitoPermissao.ALLOW, expiraEm: null },
    ]);
    expect(efetivas.has('turmas:criar')).toBe(true);
    expect(efetivas.has('turmas:ver')).toBe(true);
  });

  it('DENY prevalece sobre o perfil e sobre ALLOW', () => {
    const efetivas = calcularPermissoesEfetivas(
      ['turmas:ver', 'turmas:editar'],
      [
        {
          codigo: 'turmas:editar',
          efeito: EfeitoPermissao.ALLOW,
          expiraEm: null,
        },
        {
          codigo: 'turmas:editar',
          efeito: EfeitoPermissao.DENY,
          expiraEm: null,
        },
      ],
    );
    expect(efetivas.has('turmas:editar')).toBe(false);
    expect(efetivas.has('turmas:ver')).toBe(true);
  });

  it('ignora extras expirados', () => {
    const agora = new Date('2026-01-01T00:00:00Z');
    const efetivas = calcularPermissoesEfetivas(
      [],
      [
        {
          codigo: 'turmas:criar',
          efeito: EfeitoPermissao.ALLOW,
          expiraEm: new Date('2025-12-31T23:59:59Z'),
        },
        {
          codigo: 'turmas:ver',
          efeito: EfeitoPermissao.ALLOW,
          expiraEm: new Date('2026-06-01T00:00:00Z'),
        },
      ],
      agora,
    );
    expect(efetivas.has('turmas:criar')).toBe(false);
    expect(efetivas.has('turmas:ver')).toBe(true);
  });

  it('extra expirado do tipo DENY não remove a permissão do perfil', () => {
    const agora = new Date('2026-01-01T00:00:00Z');
    const efetivas = calcularPermissoesEfetivas(
      ['turmas:editar'],
      [
        {
          codigo: 'turmas:editar',
          efeito: EfeitoPermissao.DENY,
          expiraEm: new Date('2025-01-01T00:00:00Z'),
        },
      ],
      agora,
    );
    expect(efetivas.has('turmas:editar')).toBe(true);
  });
});
