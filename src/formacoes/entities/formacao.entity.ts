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

  @Column({ type: "varchar", length: 100 })
  tipo: string;

  @Column({ type: "varchar", length: 100 })
  formato: string;

  @Column({ type: "text", nullable: true })
  descricao: string;

  @Column({ type: "varchar", nullable: true })
  nota: string;

  @Column({ name: "carga_horaria", type: "varchar" })
  carga_horaria: string;

  @Column({ name: "carga_horaria_anual", type: "int", nullable: true })
  carga_horaria_anual: number;

  @Column({ type: "varchar", length: 150, nullable: true })
  local: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  acesso_certificado: string;

  @Column({ type: "timestamp", nullable: true })
  inicio: Date;

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
