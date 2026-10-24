import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConfiguracaoTipo } from '../enums/configuracao-tipo.enum';

@Entity('configuracoes')
export class Configuracao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  chave: string;

  @Column({ type: 'text' })
  valor: string;

  @Column({
    type: 'enum',
    enum: ConfiguracaoTipo,
    enumName: 'configuracoes_tipo_enum',
    default: ConfiguracaoTipo.STRING,
  })
  tipo: ConfiguracaoTipo;

  @Column({ type: 'varchar', length: 100, default: 'geral' })
  grupo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ type: 'boolean', default: true })
  editavel: boolean;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
