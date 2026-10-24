import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('auditoria')
export class Auditoria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'utilizador_id', type: 'uuid', nullable: true })
  utilizadorId: string | null;

  @Column({ type: 'varchar', length: 100 })
  accao: string;

  @Column({ type: 'varchar', length: 100 })
  entidade: string;

  @Column({ name: 'entidade_id', type: 'uuid', nullable: true })
  entidadeId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  antes: unknown | null;

  @Column({ type: 'jsonb', nullable: true })
  depois: unknown | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
