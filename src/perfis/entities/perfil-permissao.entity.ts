import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PerfilAcesso } from './perfil-acesso.entity';
import { Permissao } from '../../permissoes/entities/permissao.entity';

@Entity('perfil_permissoes')
@Unique('UQ_perfil_permissoes', ['perfilId', 'permissaoId'])
export class PerfilPermissao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'perfil_id', type: 'uuid' })
  perfilId: string;

  @ManyToOne(() => PerfilAcesso, (perfil) => perfil.perfilPermissoes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'perfil_id' })
  perfil: PerfilAcesso;

  @Column({ name: 'permissao_id', type: 'uuid' })
  permissaoId: string;

  @ManyToOne(() => Permissao, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'permissao_id' })
  permissao: Permissao;
}
