import { InscricaoEstado } from '../inscricoes/enums/inscricao-estado.enum';

/**
 * Estados que impedem um associado de ser sugerido como candidato
 * numa turma da mesma formação.
 * - INSCRITO / CONCLUIDO / REPROVADO bloqueiam sempre.
 * - DESISTIU bloqueia apenas quando incluirDesistentes = false.
 */
export function estadosExcluidos(
  incluirDesistentes: boolean,
): InscricaoEstado[] {
  const estados = [
    InscricaoEstado.INSCRITO,
    InscricaoEstado.CONCLUIDO,
    InscricaoEstado.REPROVADO,
  ];
  if (!incluirDesistentes) estados.push(InscricaoEstado.DESISTIU);
  return estados;
}

/** Verdadeiro quando a data de fim da turma é anterior a `agora`. */
export function turmaNoPassado(
  dataFim: Date | null,
  agora: Date = new Date(),
): boolean {
  return dataFim !== null && dataFim.getTime() < agora.getTime();
}

/** Verdadeiro quando a turma já atingiu o limite de formandos (0 = sem limite). */
export function excedeLotacao(
  inscritos: number,
  maxFormandos: number,
): boolean {
  return maxFormandos > 0 && inscritos >= maxFormandos;
}
