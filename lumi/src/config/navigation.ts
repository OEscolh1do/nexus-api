/**
 * NAVIGATION.TS - Configuracao Centralizada de Navegacao do Lumi
 * Refatorado: Workflow de Alta Precisao (CRM -> Engenharia -> Eletrico -> Viabilidade -> Proposta -> Premissas)
 */

import { LucideIcon, Users, SunMedium, Zap, ClipboardCheck, CircleDollarSign, FileText, Settings2 } from 'lucide-react';

// Tipos
export type TabId = 'crm' | 'engineering' | 'electrical' | 'documentation' | 'finance' | 'proposal' | 'settings';

export interface TabConfig {
  id: TabId;
  label: string;
  icon: LucideIcon;
  description: string;
  color: 'green' | 'purple' | 'orange' | 'blue' | 'slate';
  // order property is redundant if we depend on array order, but keeping for compatibility if used elsewhere
  order: number; 
}

// Configuracao das Abas
export const DASHBOARD_TABS: readonly TabConfig[] = [
  {
    id: 'crm',
    label: 'Levantamento',
    icon: Users,
    description: 'Dados do cliente, localizacao e consumo',
    color: 'purple',
    order: 1,
  },
  {
    id: 'engineering',
    label: 'Dimensionamento',
    icon: SunMedium,
    description: 'Orientacao, modulos, inversores e geracao',
    color: 'orange',
    order: 2,
  },
  {
    id: 'electrical',
    label: 'Eletrico & BOS',
    icon: Zap,
    description: 'Cabeamento, protecoes e String Box',
    color: 'slate',
    order: 3,
  },
  {
    id: 'documentation',
    label: 'Documentação',
    icon: ClipboardCheck,
    description: 'Memorial descritivo, ART e comissionamento',
    color: 'purple',
    order: 4,
  },
  {
    id: 'finance',
    label: 'Viabilidade',
    icon: CircleDollarSign,
    description: 'Analise financeira e retorno',
    color: 'green',
    order: 5,
  },
  {
    id: 'proposal',
    label: 'Proposta',
    icon: FileText,
    description: 'Documentacao e orcamento final',
    color: 'blue',
    order: 6,
  },
  {
    id: 'settings',
    label: 'Premissas',
    icon: Settings2,
    description: 'Configuracoes globais de engenharia (PR, Perdas)',
    color: 'slate',
    order: 7,
  },
] as const;

// Ordem do Workflow para validacao sequencial
export const WORKFLOW_ORDER: TabId[] = DASHBOARD_TABS.map(tab => tab.id);

// Helpers
export const getTabConfig = (id: TabId): TabConfig | undefined =>
  DASHBOARD_TABS.find(tab => tab.id === id);

export const getTabIndex = (id: TabId): number =>
  DASHBOARD_TABS.findIndex(tab => tab.id === id);

export const isTabCompleted = (tabId: TabId, currentTabId: TabId): boolean => {
  const tabIndex = getTabIndex(tabId);
  const currentIndex = getTabIndex(currentTabId);
  return tabIndex < currentIndex;
};

export const getNextTab = (currentId: TabId): TabId | null => {
  const currentIndex = getTabIndex(currentId);
  if (currentIndex === -1 || currentIndex >= DASHBOARD_TABS.length - 1) return null;
  return DASHBOARD_TABS[currentIndex + 1].id;
};

export const getPreviousTab = (currentId: TabId): TabId | null => {
  const currentIndex = getTabIndex(currentId);
  if (currentIndex <= 0) return null;
  return DASHBOARD_TABS[currentIndex - 1].id;
};

// Mapa de Cores Tailwind
export const TAB_COLOR_CLASSES = {
  green: {
    active: 'bg-neonorte-green text-white',
    inactive: 'text-neonorte-green/60 hover:text-neonorte-green',
    border: 'border-neonorte-green',
    icon: 'text-neonorte-green',
  },
  purple: {
    active: 'bg-neonorte-purple text-white',
    inactive: 'text-neonorte-purple/60 hover:text-neonorte-purple',
    border: 'border-neonorte-purple',
    icon: 'text-neonorte-purple',
  },
  orange: {
    active: 'bg-orange-500 text-white',
    inactive: 'text-orange-500/60 hover:text-orange-500',
    border: 'border-orange-500',
    icon: 'text-orange-500',
  },
  blue: {
    active: 'bg-blue-500 text-white',
    inactive: 'text-blue-500/60 hover:text-blue-500',
    border: 'border-blue-500',
    icon: 'text-blue-500',
  },
  slate: {
    active: 'bg-slate-700 text-white',
    inactive: 'text-slate-500/60 hover:text-slate-700',
    border: 'border-slate-700',
    icon: 'text-slate-600',
  },
} as const;
