import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { FormadorFormacao } from "../../formador-formacao/entities/formador-formacao.entity";

@Entity("formadores")
export class Formador {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 150 })
  nome: string;

  @Column({ type: "varchar", length: 150 })
  bi: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  contacto: string;

  @Column({ type: "varchar", default: "homem" })
  sexo: string;

  @OneToMany(
    () => FormadorFormacao,
    (formadorFormacao) => formadorFormacao.formador,
  )
  formadorFormacoes: FormadorFormacao[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
