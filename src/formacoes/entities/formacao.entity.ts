import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { FormandoFormacao } from "../../formando-formacao/entities/formando-formacao.entity";
import { FormadorFormacao } from "../../formador-formacao/entities/formador-formacao.entity";

@Entity("formacoes")
export class Formacao {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 150 })
  nome: string;

  @Column({ type: "text", nullable: true })
  descricao: string;

  @Column({ type: "varchar", nullable: true })
  nota: string;

  // Carga horária total do curso/formação, em horas
  @Column({ name: "carga_horaria", type: "integer", default: 0 })
  carga_horaria: number;

  @OneToMany(
    () => FormandoFormacao,
    (formandoFormacao) => formandoFormacao.formacao,
  )
  formandoFormacoes: FormandoFormacao[];

  @OneToMany(
    () => FormadorFormacao,
    (formadorFormacao) => formadorFormacao.formacao,
  )
  formadorFormacoes: FormadorFormacao[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
