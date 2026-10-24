import {
  estadosExcluidos,
  excedeLotacao,
  turmaEncerrada,
} from './atribuicoes.logica';
import { InscricaoEstado } from '../inscricoes/enums/inscricao-estado.enum';
import { TurmaEstado } from '../turmas/enums/turma-estado.enum';

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

describe('turmaEncerrada', () => {
  it('é verdadeiro quando a turma está encerrada', () => {
    expect(turmaEncerrada(TurmaEstado.ENCERRADO)).toBe(true);
  });

  it('é falso para turmas em curso', () => {
    expect(turmaEncerrada(TurmaEstado.EM_CURSO)).toBe(false);
  });

  it('é falso para turmas pendentes', () => {
    expect(turmaEncerrada(TurmaEstado.PENDENTE)).toBe(false);
  });

  it('é falso para turmas canceladas', () => {
    expect(turmaEncerrada(TurmaEstado.CANCELADA)).toBe(false);
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
