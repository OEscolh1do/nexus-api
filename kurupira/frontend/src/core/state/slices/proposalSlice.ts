/**
 * PROPOSAL-SLICE.TS — Estado Comercial da Proposta (Spec 04)
 * =============================================================================
 * Responsável pelos dados de edição comercial:
 * - Textos de apresentação
 * - Prazos e garantias
 * - Condições de pagamento
 * - Toggles de visibilidade no documento
 * =============================================================================
 */

import { StateCreator } from 'zustand';

export interface ProposalData {
  customText: string;
  validityDays: number;
  warrantyYears: number;
  paymentTerms: string;
  showPricing: boolean;
  showMap: boolean;
  logoOverride: string | null;
}

export interface ProposalSlice {
  proposalData: ProposalData;

  /** Actions */
  updateProposalData: (data: Partial<ProposalData>) => void;
  resetProposalData: () => void;
}

/**
 * Valores padrão conforme especificação (V2.1.0)
 */
export const initialProposalData: ProposalData = {
  customText: '',
  validityDays: 30,
  warrantyYears: 25,
  paymentTerms: '',
  showPricing: true,
  showMap: true,
  logoOverride: null,
};

export const createProposalSlice: StateCreator<
  ProposalSlice,
  [],
  [],
  ProposalSlice
> = (set) => ({
  proposalData: initialProposalData,

  updateProposalData: (data) =>
    set((state) => ({
      proposalData: { ...state.proposalData, ...data },
    })),

  resetProposalData: () => set({ proposalData: initialProposalData }),
});
