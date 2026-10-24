import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Formacao } from '../../formacoes/entities/formacao.entity';
import { Inscricao } from '../../inscricoes/entities/inscricao.entity';

@Entity('turmas')
export class Turma {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'formacao_id', type: 'uuid' })
  formacaoId: string;

  @ManyToOne(() => Formacao, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'formacao_id' })
  formacao: Formacao;

  @Index()
  @Column({ type: 'int' })
  ano: number;

  @Column({ name: 'data_inicio', type: 'timestamp', nullable: true })
  dataInicio: Date | null;

  @Column({ name: 'data_fim', type: 'timestamp', nullable: true })
  dataFim: Date | null;

  @Column({ type: 'int', default: 0 })
  lotacao: number;

  @Column({ type: 'boolean', default: false })
  cancelada: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  codigo: string | null;

  @OneToMany(() => Inscricao, (inscricao) => inscricao.turma)
  inscricoes: Inscricao[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
