import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Formando } from '../../formandos/entities/formando.entity';
import { Formacao } from '../../formacoes/entities/formacao.entity';

@Entity('formando_formacao')
export class FormandoFormacao {
  @PrimaryColumn({ name: 'formando_id', type: 'uuid' })
  formandoId: string;

  @PrimaryColumn({ name: 'formacao_id', type: 'uuid' })
  formacaoId: string;

  @ManyToOne(() => Formando, (formando) => formando.formandoFormacoes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'formando_id' })
  formando: Formando;

  @ManyToOne(() => Formacao, (formacao) => formacao.formandoFormacoes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'formacao_id' })
  formacao: Formacao;

  // Data em que a matricula/associacao foi feita
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
