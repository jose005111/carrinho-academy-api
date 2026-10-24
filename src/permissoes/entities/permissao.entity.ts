import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('permissoes')
export class Permissao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 100 })
  modulo: string;

  @Column({ type: 'varchar', length: 100 })
  accao: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;
}
