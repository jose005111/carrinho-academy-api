import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Formador } from '../../formadores/entities/formador.entity';
import { Formacao } from '../../formacoes/entities/formacao.entity';

@Entity('formador_formacao')
export class FormadorFormacao {
  @PrimaryColumn({ name: 'formador_id', type: 'uuid' })
  formadorId: string;

  @PrimaryColumn({ name: 'formacao_id', type: 'uuid' })
  formacaoId: string;

  @ManyToOne(() => Formador, (formador) => formador.formadorFormacoes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'formador_id' })
  formador: Formador;

  @ManyToOne(() => Formacao, (formacao) => formacao.formadorFormacoes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'formacao_id' })
  formacao: Formacao;

  // Indica se este formador e o supervisor responsavel pela formacao
  @Column({ type: 'boolean', default: false })
  supervisor: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
