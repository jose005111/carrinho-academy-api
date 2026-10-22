export interface FormacaoComoDto {
  id: string;
  nome: string;
  tipo: string;
  formato: string;
  carga_horaria: string;
  local: string | null;
  acesso_certificado: string | null;
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
