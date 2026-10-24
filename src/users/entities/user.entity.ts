import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Cargo } from '../../common/enums/cargo.enum';
import { Perfil } from '../../perfil/entities/perfil.entity';
import { PerfilAcesso } from '../../perfis/entities/perfil-acesso.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'enum', enum: Cargo, default: Cargo.UTILIZADOR })
  cargo: Cargo;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @OneToOne(() => Perfil, (perfil) => perfil.user, {
    cascade: true,
    eager: true,
  })
  @JoinColumn({ name: 'perfil_id' })
  perfil: Perfil;

  @Column({ name: 'perfil_acesso_id', type: 'uuid', nullable: true })
  perfilAcessoId: string | null;

  @ManyToOne(() => PerfilAcesso, { onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'perfil_acesso_id' })
  perfilAcesso: PerfilAcesso | null;

  @Column({ name: 'token_version', type: 'int', default: 0 })
  tokenVersion: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
