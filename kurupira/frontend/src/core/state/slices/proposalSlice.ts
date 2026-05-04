/**
 * PROPOSAL-SLICE.TS — Estado Comercial da Proposta (Spec v2.0)
 * =============================================================================
 * Responsável pelos dados de edição comercial do documento de venda:
 * - Itens de investimento (lineItems)
 * - Etapas de pagamento (paymentStages)
 * - Comparativo de planos (plans)
 * - Cronograma de execução (executionSchedule)
 * - Textos de apresentação e condições
 * - Dados de contato/engenheiro
 * - Toggles de visibilidade no PDF
 * - Página ativa no preview (navegação paginada)
 * =============================================================================
 */

import { StateCreator } from 'zustand';
import type { CanvasElement, CanvasPage, ProposalTemplate } from '@/modules/engineering/ui/panels/canvas-views/proposal/engine/types';
import { CLASSIC_TEMPLATE } from '@/modules/engineering/ui/panels/canvas-views/proposal/engine/templates/classicTemplate';

export type { CanvasElement, CanvasPage, ProposalTemplate };

// =============================================================================
// TYPES — Sub-interfaces do documento de proposta
// =============================================================================

export interface ProposalLineItem {
  id: string;
  description: string;   // ex.: "KIT GERADOR FOTOVOLTAICO"
  value: number | null;  // null = exibe texto alternativo
  valueText: string;     // texto alternativo quando value === null (ex.: "6 MESES")
}

export interface PaymentStage {
  id: string;
  label: string;          // ex.: "ETAPA 1"
  value: number;          // valor em R$
  percentage: number;     // ex.: 30
}

export interface ProposalPlan {
  id: string;
  name: string;           // ex.: "BÁSICO" ou "NEONORTE"
  highlighted: boolean;   // true = destaque visual (plano recomendado)
  items: PlanItem[];
  totalPrice: number;
}

export interface PlanItem {
  description: string;
  included: boolean;      // true = check verde, false = X vermelho
}

export interface ExecutionStage {
  id: string;
  label: string;          // ex.: "MARCO ZERO", "ETAPA 1"
  sublabel: string;       // ex.: "LEVANTAMENTO TÉCNICO", "CONTRATO"
  durationText: string;   // ex.: "15 DIAS", "3 - 5 DIAS"
  description: string;    // texto descritivo da etapa
}

// =============================================================================
// MAIN INTERFACE — ProposalData (Spec §3.2)
// =============================================================================

export interface ProposalData {
  // Comercial geral
  customText: string;
  validityDays: number;
  paymentTerms: string[];

  // Itens de investimento (pág. 2 — tabela)
  lineItems: ProposalLineItem[];

  // Cronograma de pagamento por etapas (pág. 2)
  paymentStages: PaymentStage[];

  // Comparativo de planos (pág. 2)
  plans: ProposalPlan[];

  // Cronograma de execução (pág. 4)
  executionSchedule: ExecutionStage[];

  // Contato e responsável técnico (pág. 5)
  engineerName: string;
  engineerTitle: string;
  engineerCrea: string;
  contactPhone: string;
  contactInstagram: string;

  // Controles de visibilidade no PDF
  showPricing: boolean;
  showMap: boolean;
  showComparativePlans: boolean;
  excludedPages: number[]; // índices das páginas que não serão exportadas

  // White-label
  logoOverride: string | null;

  // Canvas editor
  activeTemplateId: string;
  activeLayout: ProposalTemplate | null;
  customTemplates: ProposalTemplate[];
}

// =============================================================================
// SLICE INTERFACE
// =============================================================================

export interface ProposalSlice {
  proposalData: ProposalData;

  /** Exportação de PDF */
  isExportingPdf: boolean;

  /** Página ativa no preview (0-4) */
  proposalActivePage: number;

  /** Actions — Dados gerais */
  updateProposalData: (data: Partial<ProposalData>) => void;
  resetProposalData: () => void;

  /** Actions — Navegação e Exportação */
  setProposalActivePage: (page: number) => void;
  setExportingPdf: (val: boolean) => void;

  /** Actions — Line Items */
  addLineItem: (item: ProposalLineItem) => void;
  removeLineItem: (id: string) => void;
  updateLineItem: (id: string, updates: Partial<ProposalLineItem>) => void;
  reorderLineItems: (ids: string[]) => void;

  /** Actions — Payment Stages */
  addPaymentStage: (stage: PaymentStage) => void;
  removePaymentStage: (id: string) => void;
  updatePaymentStage: (id: string, updates: Partial<PaymentStage>) => void;

  /** Actions — Plans */
  updatePlan: (id: string, updates: Partial<ProposalPlan>) => void;
  updatePlanItem: (planId: string, itemIndex: number, updates: Partial<PlanItem>) => void;

  /** Actions — Execution Schedule */
  updateExecutionStage: (id: string, updates: Partial<ExecutionStage>) => void;

  /** Actions — Canvas Templates */
  applyTemplate: (template: ProposalTemplate) => void;
  saveCurrentAsTemplate: (name: string) => void;
  deleteCustomTemplate: (id: string) => void;

  /** Actions — Canvas Layout Editing */
  addCanvasElement: (pageId: string, element: CanvasElement) => void;
  updateCanvasElement: (pageId: string, elementId: string, updates: Partial<CanvasElement>) => void;
  removeCanvasElement: (pageId: string, elementId: string) => void;
  addCanvasPage: (page: CanvasPage) => void;
  removeCanvasPage: (pageId: string) => void;
  reorderCanvasPages: (pageIds: string[]) => void;
  updateCanvasPageBackground: (pageId: string, bg: CanvasPage['background']) => void;
}

// =============================================================================
// DEFAULTS — Valores padrão conforme Spec §8.1
// =============================================================================

const DEFAULT_PLANS: ProposalPlan[] = [
  {
    id: 'plan-basico',
    name: 'BÁSICO',
    highlighted: false,
    totalPrice: 21950.50,
    items: [
      { description: 'Kit Gerador FV', included: true },
      { description: 'Engenharia', included: true },
      { description: 'Pós-venda Inteligente (6 Meses)', included: false },
      { description: 'Consultoria Equatorial (6 Meses)', included: false },
    ],
  },
  {
    id: 'plan-neonorte',
    name: 'NEONORTE',
    highlighted: true,
    totalPrice: 22550.50,
    items: [
      { description: 'Kit Gerador FV', included: true },
      { description: 'Engenharia', included: true },
      { description: 'Pós-venda Inteligente (6 Meses)', included: true },
      { description: 'Consultoria Equatorial (6 Meses)', included: true },
    ],
  },
];

const DEFAULT_EXECUTION_SCHEDULE: ExecutionStage[] = [
  {
    id: 'stage-0',
    label: 'MARCO ZERO',
    sublabel: 'LEVANTAMENTO TÉCNICO',
    durationText: '1 - 2 DIAS',
    description: 'Visita técnica ao local para levantamento de medidas, análise do padrão elétrico e condições do telhado.',
  },
  {
    id: 'stage-1',
    label: 'ETAPA 1',
    sublabel: 'CONTRATO',
    durationText: '1 - 2 DIAS',
    description: 'Assinatura do contrato e pagamento da primeira parcela para início do processo.',
  },
  {
    id: 'stage-2',
    label: 'ETAPA 2',
    sublabel: 'FRETE E EQUIPAMENTOS',
    durationText: '15 DIAS',
    description: 'Aquisição e transporte dos equipamentos até o local da instalação.',
  },
  {
    id: 'stage-3',
    label: 'ETAPA 3',
    sublabel: 'INSTALAÇÃO E TESTES',
    durationText: '3 - 5 DIAS',
    description: 'Instalação mecânica e elétrica do sistema, seguida de testes de funcionamento e comissionamento.',
  },
  {
    id: 'stage-4',
    label: 'ETAPA 4',
    sublabel: 'COMISSIONAMENTO',
    durationText: '15 - 20 DIAS',
    description: 'Solicitação de vistoria junto à concessionária (Equatorial), troca do medidor e ativação do sistema.',
  },
  {
    id: 'stage-pos',
    label: 'PÓS-VENDA',
    sublabel: 'MONITORAMENTO INTELIGENTE',
    durationText: 'CONTÍNUO',
    description: 'Acompanhamento remoto da geração via app, alertas de performance e suporte técnico dedicado.',
  },
];

export const initialProposalData: ProposalData = {
  customText: '',
  validityDays: 15,
  paymentTerms: [
    'Aceitamos todas formas de Pagamento.',
    'Condições Flexíveis para pagamento.',
    'A proposta tem validade de 15 dias.',
  ],

  lineItems: [
    { id: 'li-1', description: 'KIT GERADOR FOTOVOLTAICO', value: 14050.00, valueText: '' },
    { id: 'li-2', description: 'ENGENHARIA (SERVIÇOS)', value: 8544.23, valueText: '' },
    { id: 'li-3', description: 'CONSULTORIA COM A EQUATORIAL (6 MESES)', value: null, valueText: '6 MESES' },
    { id: 'li-4', description: 'PÓS-VENDA DE ENGENHARIA (6 MESES)', value: null, valueText: '6 MESES' },
  ],
  paymentStages: [
    { id: 'ps-1', label: 'ETAPA 1', value: 2563.27, percentage: 30 },
    { id: 'ps-2', label: 'ETAPA 2', value: 1708.85, percentage: 20 },
    { id: 'ps-3', label: 'ETAPA 3', value: 2136.06, percentage: 25 },
    { id: 'ps-4', label: 'ETAPA 4', value: 2136.05, percentage: 25 },
  ],
  plans: DEFAULT_PLANS,
  executionSchedule: DEFAULT_EXECUTION_SCHEDULE,

  engineerName: '',
  engineerTitle: 'Engenheiro Eletricista',
  engineerCrea: '',
  contactPhone: '',
  contactInstagram: '',

  showPricing: true,
  showMap: true,
  showComparativePlans: true,
  excludedPages: [],

  logoOverride: null,

  activeTemplateId: 'classic',
  activeLayout: null,
  customTemplates: [],
};

// =============================================================================
// SLICE CREATOR
// =============================================================================

export const createProposalSlice: StateCreator<
  ProposalSlice,
  [],
  [],
  ProposalSlice
> = (set) => ({
  proposalData: initialProposalData,
  proposalActivePage: 0,
  isExportingPdf: false,

  // ── General ──────────────────────────────────────────────────────────────

  updateProposalData: (data) =>
    set((state) => ({
      proposalData: { ...state.proposalData, ...data },
    })),

  resetProposalData: () =>
    set({ proposalData: initialProposalData, proposalActivePage: 0, isExportingPdf: false }),

  // ── Navigation ───────────────────────────────────────────────────────────

  setProposalActivePage: (page) =>
    set({ proposalActivePage: Math.max(0, Math.min(4, page)) }),

  setExportingPdf: (val) => set({ isExportingPdf: val }),

  // ── Line Items ───────────────────────────────────────────────────────────

  addLineItem: (item) =>
    set((state) => ({
      proposalData: {
        ...state.proposalData,
        lineItems: [...state.proposalData.lineItems, item],
      },
    })),

  removeLineItem: (id) =>
    set((state) => ({
      proposalData: {
        ...state.proposalData,
        lineItems: state.proposalData.lineItems.filter((i) => i.id !== id),
      },
    })),

  updateLineItem: (id, updates) =>
    set((state) => ({
      proposalData: {
        ...state.proposalData,
        lineItems: state.proposalData.lineItems.map((i) =>
          i.id === id ? { ...i, ...updates } : i
        ),
      },
    })),

  reorderLineItems: (ids) =>
    set((state) => {
      const map = new Map(state.proposalData.lineItems.map((i) => [i.id, i]));
      const reordered = ids.map((id) => map.get(id)!).filter(Boolean);
      return {
        proposalData: { ...state.proposalData, lineItems: reordered },
      };
    }),

  // ── Payment Stages ───────────────────────────────────────────────────────

  addPaymentStage: (stage) =>
    set((state) => ({
      proposalData: {
        ...state.proposalData,
        paymentStages: [...state.proposalData.paymentStages, stage],
      },
    })),

  removePaymentStage: (id) =>
    set((state) => ({
      proposalData: {
        ...state.proposalData,
        paymentStages: state.proposalData.paymentStages.filter((s) => s.id !== id),
      },
    })),

  updatePaymentStage: (id, updates) =>
    set((state) => ({
      proposalData: {
        ...state.proposalData,
        paymentStages: state.proposalData.paymentStages.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      },
    })),

  // ── Plans ────────────────────────────────────────────────────────────────

  updatePlan: (id, updates) =>
    set((state) => ({
      proposalData: {
        ...state.proposalData,
        plans: state.proposalData.plans.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      },
    })),

  updatePlanItem: (planId, itemIndex, updates) =>
    set((state) => ({
      proposalData: {
        ...state.proposalData,
        plans: state.proposalData.plans.map((p) =>
          p.id === planId
            ? {
                ...p,
                items: p.items.map((item, idx) =>
                  idx === itemIndex ? { ...item, ...updates } : item
                ),
              }
            : p
        ),
      },
    })),

  // ── Execution Schedule ───────────────────────────────────────────────────

  updateExecutionStage: (id, updates) =>
    set((state) => ({
      proposalData: {
        ...state.proposalData,
        executionSchedule: state.proposalData.executionSchedule.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      },
    })),

  // ── Canvas Templates ─────────────────────────────────────────────────────

  applyTemplate: (template) =>
    set((state) => ({
      proposalData: {
        ...state.proposalData,
        activeTemplateId: template.id,
        activeLayout: JSON.parse(JSON.stringify(template)),
      },
    })),

  saveCurrentAsTemplate: (name) =>
    set((state) => {
      const layout = state.proposalData.activeLayout ?? CLASSIC_TEMPLATE;
      const newTemplate: ProposalTemplate = {
        ...JSON.parse(JSON.stringify(layout)),
        id: `custom-${Date.now()}`,
        name,
        isBuiltIn: false,
        createdAt: new Date().toISOString(),
      };
      return {
        proposalData: {
          ...state.proposalData,
          customTemplates: [...state.proposalData.customTemplates, newTemplate],
        },
      };
    }),

  deleteCustomTemplate: (id) =>
    set((state) => ({
      proposalData: {
        ...state.proposalData,
        customTemplates: state.proposalData.customTemplates.filter((t) => t.id !== id),
      },
    })),

  // ── Canvas Layout Editing ────────────────────────────────────────────────

  addCanvasElement: (pageId, element) =>
    set((state) => {
      const base = state.proposalData.activeLayout ?? JSON.parse(JSON.stringify(CLASSIC_TEMPLATE));
      const layout: ProposalTemplate = state.proposalData.activeLayout
        ? base
        : { ...base, id: `custom-${Date.now()}`, isBuiltIn: false, createdAt: new Date().toISOString() };
      return {
        proposalData: {
          ...state.proposalData,
          activeTemplateId: layout.id,
          activeLayout: {
            ...layout,
            pages: layout.pages.map((p) =>
              p.id === pageId
                ? { ...p, elements: [...p.elements, element] }
                : p
            ),
          },
        },
      };
    }),

  updateCanvasElement: (pageId, elementId, updates) =>
    set((state) => {
      const layout = state.proposalData.activeLayout;
      if (!layout) return {};
      return {
        proposalData: {
          ...state.proposalData,
          activeLayout: {
            ...layout,
            pages: layout.pages.map((p) =>
              p.id === pageId
                ? {
                    ...p,
                    elements: p.elements.map((el) =>
                      el.id === elementId ? { ...el, ...updates } : el
                    ),
                  }
                : p
            ),
          },
        },
      };
    }),

  removeCanvasElement: (pageId, elementId) =>
    set((state) => {
      const layout = state.proposalData.activeLayout;
      if (!layout) return {};
      return {
        proposalData: {
          ...state.proposalData,
          activeLayout: {
            ...layout,
            pages: layout.pages.map((p) =>
              p.id === pageId
                ? { ...p, elements: p.elements.filter((el) => el.id !== elementId) }
                : p
            ),
          },
        },
      };
    }),

  addCanvasPage: (page) =>
    set((state) => {
      const layout = state.proposalData.activeLayout;
      if (!layout) return {};
      return {
        proposalData: {
          ...state.proposalData,
          activeLayout: { ...layout, pages: [...layout.pages, page] },
        },
      };
    }),

  removeCanvasPage: (pageId) =>
    set((state) => {
      const layout = state.proposalData.activeLayout;
      if (!layout) return {};
      return {
        proposalData: {
          ...state.proposalData,
          activeLayout: {
            ...layout,
            pages: layout.pages.filter((p) => p.id !== pageId),
          },
        },
      };
    }),

  reorderCanvasPages: (pageIds) =>
    set((state) => {
      const layout = state.proposalData.activeLayout;
      if (!layout) return {};
      const map = new Map(layout.pages.map((p) => [p.id, p]));
      const reordered = pageIds.map((id) => map.get(id)!).filter(Boolean);
      return {
        proposalData: {
          ...state.proposalData,
          activeLayout: { ...layout, pages: reordered },
        },
      };
    }),

  updateCanvasPageBackground: (pageId, bg) =>
    set((state) => {
      const layout = state.proposalData.activeLayout;
      if (!layout) return {};
      return {
        proposalData: {
          ...state.proposalData,
          activeLayout: {
            ...layout,
            pages: layout.pages.map((p) =>
              p.id === pageId ? { ...p, background: bg } : p
            ),
          },
        },
      };
    }),
});
