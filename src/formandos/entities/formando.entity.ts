import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Empresa } from "../../empresas/entities/empresa.entity";
import { Endereco } from "../../endereco/entities/endereco.entity";
import { FormandoFormacao } from "../../formando-formacao/entities/formando-formacao.entity";
import { Genero } from "../../common/enums/genero.enum";

@Entity("formandos")
export class Formando {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 150 })
  nome: string;

  @Column({ type: "varchar", length: 20 })
  sexo: string;

  @Column({
    type: "text",
    enum: Genero,
    enumName: "formandos_genero_enum",
    nullable: true,
  })
  genero: Genero | null;

  @Column({ type: "varchar", length: 30, unique: true })
  bi: string;

  @Column({ type: "varchar", length: 30, unique: true })
  matricula: string;

  @Column({ type: "varchar", length: 150, nullable: true })
  funcao: string;

  @Column({
    name: "area_direcao",
    type: "varchar",
    length: 150,
    nullable: true,
  })
  areaDirecao: string;

  @Column({ name: "tot_formacoes", type: "integer", default: 0 })
  totFormacoes: number;

  @ManyToOne(() => Empresa, (empresa) => empresa.formandos, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "empresa_id" })
  empresa: Empresa;

  @ManyToOne(() => Endereco, (endereco) => endereco.formandos, {
    nullable: true,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "endereco_id" })
  endereco: Endereco;
  @OneToMany(
    () => FormandoFormacao,
    (formandoFormacao) => formandoFormacao.formando,
  )
  formandoFormacoes: FormandoFormacao[];
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
