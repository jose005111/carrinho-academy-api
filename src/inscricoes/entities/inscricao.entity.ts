import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Turma } from '../../turmas/entities/turma.entity';
import { Formando } from '../../formandos/entities/formando.entity';
import { InscricaoEstado } from '../enums/inscricao-estado.enum';
import { InscricaoOrigem } from '../enums/inscricao-origem.enum';

@Entity('inscricoes')
@Unique('UQ_inscricoes_turma_associado', ['turmaId', 'associadoId'])
export class Inscricao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'turma_id', type: 'uuid' })
  turmaId: string;

  @ManyToOne(() => Turma, (turma) => turma.inscricoes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'turma_id' })
  turma: Turma;

  @Index()
  @Column({ name: 'associado_id', type: 'uuid' })
  associadoId: string;

  @ManyToOne(() => Formando, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'associado_id' })
  associado: Formando;

  @Column({
    type: 'enum',
    enum: InscricaoEstado,
    enumName: 'inscricoes_estado_enum',
    default: InscricaoEstado.INSCRITO,
  })
  estado: InscricaoEstado;

  @Column({
    type: 'enum',
    enum: InscricaoOrigem,
    enumName: 'inscricoes_origem_enum',
    default: InscricaoOrigem.MANUAL,
  })
  origem: InscricaoOrigem;

  @Column({ name: 'data_inscricao', type: 'timestamp', default: () => 'now()' })
  dataInscricao: Date;

  @Column({ name: 'data_conclusao', type: 'timestamp', nullable: true })
  dataConclusao: Date | null;

  @Column({ name: 'criado_por', type: 'uuid', nullable: true })
  criadoPor: string | null;

  @Column({ type: 'text', nullable: true })
  observacao: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
