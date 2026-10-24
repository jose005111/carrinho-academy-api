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
import { Tipo } from '../../catalogos/entities/tipo.entity';
import { Formato } from '../../catalogos/entities/formato.entity';
import { TurmaEstado } from '../enums/turma-estado.enum';

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

  @Column({ name: 'tipo_id', type: 'uuid', nullable: true })
  tipoId: string | null;

  @ManyToOne(() => Tipo, { onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'tipo_id' })
  tipo: Tipo | null;

  @Column({ name: 'formato_id', type: 'uuid', nullable: true })
  formatoId: string | null;

  @ManyToOne(() => Formato, { onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'formato_id' })
  formato: Formato | null;

  @Column({ name: 'acesso_certificado', type: 'varchar', length: 100, nullable: true })
  acessoCertificado: string | null;

  @Column({ name: 'carga_diaria', type: 'integer', default: 0 })
  cargaDiaria: number;

  @Column({ type: 'varchar', length: 150, nullable: true })
  local: string | null;

  @Index()
  @Column({ type: 'int' })
  ano: number;

  @Column({ name: 'data_inicio', type: 'timestamp', nullable: true })
  dataInicio: Date | null;

  @Column({ name: 'data_fim', type: 'timestamp', nullable: true })
  dataFim: Date | null;

  @Column({ type: 'int', default: 0 })
  lotacao: number;

  @Column({
    type: 'enum',
    enum: TurmaEstado,
    enumName: 'turmas_estado_enum',
    default: TurmaEstado.PENDENTE,
  })
  estado: TurmaEstado;

  @Column({ type: 'varchar', length: 50, nullable: true })
  codigo: string | null;

  @OneToMany(() => Inscricao, (inscricao) => inscricao.turma)
  inscricoes: Inscricao[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
