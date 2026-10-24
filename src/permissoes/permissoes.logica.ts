import { EfeitoPermissao } from '../perfis/entities/utilizador-permissao.entity';

export interface ExtraEfetiva {
  codigo: string;
  efeito: EfeitoPermissao;
  expiraEm: Date | null;
}

/**
 * Cálculo puro das permissões efectivas:
 * efectivas = (permissões do perfil ∪ ALLOW activos) − DENY activos.
 * DENY prevalece sobre tudo. Extras expirados são ignorados.
 */
export function calcularPermissoesEfetivas(
  perfilCodigos: string[],
  extras: ExtraEfetiva[],
  agora: Date = new Date(),
): Set<string> {
  const efetivas = new Set(perfilCodigos);

  for (const extra of extras) {
    if (extra.expiraEm && extra.expiraEm.getTime() < agora.getTime()) {
      continue;
    }
    if (extra.efeito === EfeitoPermissao.ALLOW) {
      efetivas.add(extra.codigo);
    } else {
      efetivas.delete(extra.codigo);
    }
  }

  return efetivas;
}
