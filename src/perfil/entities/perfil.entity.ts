import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('perfil')
export class Perfil {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  foto: string | null;

  @Column({ type: 'varchar', length: 150 })
  nome: string;

  @OneToOne(() => User, (user) => user.perfil)
  user: User;
}
