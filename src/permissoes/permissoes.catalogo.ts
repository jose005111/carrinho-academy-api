export interface PermissaoDef {
  codigo: string;
  modulo: string;
  accao: string;
  descricao: string;
}

const ACOES_PADRAO = [
  'ver',
  'criar',
  'editar',
  'eliminar',
  'exportar',
  'importar',
] as const;

const MODULOS_CRUD = [
  'turmas',
  'formandos',
  'formacoes',
  'formadores',
  'empresas',
] as const;

const DESCRICAO_MODULO: Record<string, string> = {
  turmas: 'Turmas',
  formandos: 'Associados / formandos',
  formacoes: 'Formações',
  formadores: 'Formadores',
  empresas: 'Empresas',
};

const DESCRICAO_ACAO: Record<string, string> = {
  ver: 'Ver',
  criar: 'Criar',
  editar: 'Editar',
  eliminar: 'Eliminar',
  exportar: 'Exportar',
  importar: 'Importar',
};

const CATALOGO_BASE: PermissaoDef[] = MODULOS_CRUD.flatMap((modulo) =>
  ACOES_PADRAO.map((accao) => ({
    codigo: `${modulo}:${accao}`,
    modulo,
    accao,
    descricao: `${DESCRICAO_ACAO[accao]} ${DESCRICAO_MODULO[modulo]}`,
  })),
);

const ESPECIFICAS: PermissaoDef[] = [
  { codigo: 'atribuicoes:ver', modulo: 'atribuicoes', accao: 'ver', descricao: 'Ver candidatos e atribuições' },
  { codigo: 'atribuicoes:inscrever', modulo: 'atribuicoes', accao: 'inscrever', descricao: 'Inscrever formandos em turmas' },
  { codigo: 'configuracoes:ver', modulo: 'configuracoes', accao: 'ver', descricao: 'Ver configurações' },
  { codigo: 'configuracoes:editar', modulo: 'configuracoes', accao: 'editar', descricao: 'Editar configurações' },
  { codigo: 'perfis:ver', modulo: 'perfis', accao: 'ver', descricao: 'Ver perfis' },
  { codigo: 'perfis:criar', modulo: 'perfis', accao: 'criar', descricao: 'Criar perfis' },
  { codigo: 'perfis:editar', modulo: 'perfis', accao: 'editar', descricao: 'Editar perfis' },
  { codigo: 'perfis:eliminar', modulo: 'perfis', accao: 'eliminar', descricao: 'Eliminar perfis' },
  { codigo: 'perfis:gerir', modulo: 'perfis', accao: 'gerir', descricao: 'Gerir permissões de perfis' },
  { codigo: 'utilizadores:ver', modulo: 'utilizadores', accao: 'ver', descricao: 'Ver utilizadores' },
  { codigo: 'utilizadores:criar', modulo: 'utilizadores', accao: 'criar', descricao: 'Criar utilizadores' },
  { codigo: 'utilizadores:editar', modulo: 'utilizadores', accao: 'editar', descricao: 'Editar utilizadores' },
  { codigo: 'utilizadores:eliminar', modulo: 'utilizadores', accao: 'eliminar', descricao: 'Eliminar utilizadores' },
  { codigo: 'utilizadores:gerir', modulo: 'utilizadores', accao: 'gerir', descricao: 'Gerir permissões de utilizadores' },
  { codigo: 'auditoria:ver', modulo: 'auditoria', accao: 'ver', descricao: 'Ver registos de auditoria' },
  { codigo: 'dashboard:ver', modulo: 'dashboard', accao: 'ver', descricao: 'Ver dashboard' },
];

export const CATALOGO_PERMISSOES: PermissaoDef[] = [
  ...CATALOGO_BASE,
  ...ESPECIFICAS,
];

export const CODIGO_SUPER_ADMIN_PERFIL = 'Super Admin';
