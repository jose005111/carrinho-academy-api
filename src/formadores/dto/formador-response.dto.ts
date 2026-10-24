export interface FormacaoComoDto {
  id: string;
  nome: string;
  carga_horaria: number;
}

export interface FormadorResponseDto {
  id: string;
  nome: string;
  bi: string;
  sexo: string;
  contacto: string | null;
  formacoes_como_principal: FormacaoComoDto[];
  formacoes_como_supervisor: FormacaoComoDto[];
}
