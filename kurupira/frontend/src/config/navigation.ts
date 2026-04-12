/**
 * NAVIGATION.TS - Configuração Centralizada de Navegação do Kurupira
 * Paradigma Workspace: Dimensionamento → Elétrico → Documentação → Proposta → Premissas
 */

import { LucideIcon, SunMedium, Zap, ClipboardCheck, FileText, Settings2 } from 'lucide-react';

// Tipos
export type TabId = 'hub' | 'engineering' | 'electrical' | 'documentation' | 'proposal' | 'settings';

export interface TabConfig {
  id: TabId;
  label: string;
  icon: LucideIcon;
  description: string;
  color: 'green' | 'purple' | 'darkGreen' | 'slate';
  order: number;
}

// Configuração das Abas (workflow de engenharia puro)
export const DASHBOARD_TABS: readonly TabConfig[] = [

  {
    id: 'engineering',
    label: 'Dimensionamento',
    icon: SunMedium,
    description: 'Orientação, módulos, inversores e geração',
    color: 'darkGreen',
    order: 1,
  },
  {
    id: 'electrical',
    label: 'Elétrico & BOS',
    icon: Zap,
    description: 'Cabeamento, proteções e String Box',
    color: 'slate',
    order: 2,
  },
  {
    id: 'documentation',
    label: 'Documentação',
    icon: ClipboardCheck,
    description: 'Memorial descritivo, ART e comissionamento',
    color: 'purple',
    order: 3,
  },
  {
    id: 'proposal',
    label: 'Proposta',
    icon: FileText,
    description: 'Documentação e orçamento final',
    color: 'purple',
    order: 4,
  },
  {
    id: 'settings',
    label: 'Premissas',
    icon: Settings2,
    description: 'Configurações globais de engenharia (PR, Perdas)',
    color: 'slate',
    order: 5,
  },
] as const;

// Ordem do Workflow para validação sequencial
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
  darkGreen: {
    active: 'bg-neonorte-darkGreen text-white',
    inactive: 'text-neonorte-darkGreen/60 hover:text-neonorte-darkGreen',
    border: 'border-neonorte-darkGreen',
    icon: 'text-neonorte-darkGreen',
  },
  slate: {
    active: 'bg-slate-700 text-white',
    inactive: 'text-slate-500/60 hover:text-slate-700',
    border: 'border-slate-700',
    icon: 'text-slate-600',
  },
} as const;
