import {
  estadosExcluidos,
  excedeLotacao,
  turmaNoPassado,
} from './atribuicoes.logica';
import { InscricaoEstado } from '../inscricoes/enums/inscricao-estado.enum';

describe('estadosExcluidos', () => {
  it('inclui sempre INSCRITO, CONCLUIDO e REPROVADO', () => {
    const estados = estadosExcluidos(true);
    expect(estados).toEqual(
      expect.arrayContaining([
        InscricaoEstado.INSCRITO,
        InscricaoEstado.CONCLUIDO,
        InscricaoEstado.REPROVADO,
      ]),
    );
  });

  it('não bloqueia desistentes quando incluirDesistentes = true', () => {
    expect(estadosExcluidos(true)).not.toContain(InscricaoEstado.DESISTIU);
  });

  it('bloqueia desistentes quando incluirDesistentes = false', () => {
    expect(estadosExcluidos(false)).toContain(InscricaoEstado.DESISTIU);
  });

  it('nunca bloqueia inscrições CANCELADO', () => {
    expect(estadosExcluidos(true)).not.toContain(InscricaoEstado.CANCELADO);
    expect(estadosExcluidos(false)).not.toContain(InscricaoEstado.CANCELADO);
  });
});

describe('turmaNoPassado', () => {
  const agora = new Date('2026-10-24T00:00:00Z');

  it('é verdadeiro quando a data de fim é anterior a agora', () => {
    expect(turmaNoPassado(new Date('2026-01-01T00:00:00Z'), agora)).toBe(true);
  });

  it('é falso quando a data de fim é futura', () => {
    expect(turmaNoPassado(new Date('2027-01-01T00:00:00Z'), agora)).toBe(false);
  });

  it('é falso quando não há data de fim', () => {
    expect(turmaNoPassado(null, agora)).toBe(false);
  });
});

describe('excedeLotacao', () => {
  it('nunca excede quando o limite é 0 (sem limite)', () => {
    expect(excedeLotacao(100, 0)).toBe(false);
  });

  it('excede quando os inscritos atingem o limite', () => {
    expect(excedeLotacao(20, 20)).toBe(true);
  });

  it('não excede quando ainda há vagas', () => {
    expect(excedeLotacao(19, 20)).toBe(false);
  });
});
