
export const PLAN_SEATS: Record<string, number> = {
  FREE: 1,
  STARTER: 5,
  PRO: 20,
  ENTERPRISE: 9999,
};

export const QUOTA_BY_PLAN: Record<string, number> = {
  FREE: 1000,
  STARTER: 10000,
  PRO: 100000,
  ENTERPRISE: 9999999,
};

export const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Gestor', desc: 'Controle total da organização' },
  { value: 'MANAGER', label: 'Gerente', desc: 'Gestão de projetos e equipe' },
  { value: 'ENGINEER', label: 'Engenheiro', desc: 'Uso técnico do Kurupira' },
  { value: 'VIEWER', label: 'Visualizador', desc: 'Consulta e visualização' },
];
