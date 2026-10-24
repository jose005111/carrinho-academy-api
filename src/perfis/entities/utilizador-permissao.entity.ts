import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Permissao } from '../../permissoes/entities/permissao.entity';

export enum EfeitoPermissao {
  ALLOW = 'ALLOW',
  DENY = 'DENY',
}

@Entity('utilizador_permissoes')
export class UtilizadorPermissao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'utilizador_id', type: 'uuid' })
  utilizadorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'utilizador_id' })
  utilizador: User;

  @Column({ name: 'permissao_id', type: 'uuid' })
  permissaoId: string;

  @ManyToOne(() => Permissao, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'permissao_id' })
  permissao: Permissao;

  @Column({
    type: 'enum',
    enum: EfeitoPermissao,
    enumName: 'utilizador_permissoes_efeito_enum',
    default: EfeitoPermissao.ALLOW,
  })
  efeito: EfeitoPermissao;

  @Column({ name: 'expira_em', type: 'timestamp', nullable: true })
  expiraEm: Date | null;

  @Column({ name: 'concedido_por', type: 'uuid', nullable: true })
  concedidoPor: string | null;

  @Column({ type: 'text', nullable: true })
  motivo: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
