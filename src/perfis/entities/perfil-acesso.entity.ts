import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PerfilPermissao } from './perfil-permissao.entity';

@Entity('perfis')
export class PerfilAcesso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'boolean', default: false })
  sistema: boolean;

  @OneToMany(() => PerfilPermissao, (pp) => pp.perfil)
  perfilPermissoes: PerfilPermissao[];
}
