/**
 * ELECTRICAL-SLICE.TS
 * Slice Zustand para Inventário BOS (Balance of System)
 * 
 * Responsabilidade: Gerenciar estado de cabeamento, proteções e componentes
 * elétricos que compõem o sistema além de módulos e inversores.
 * 
 * // NOTA CRÍTICA: Este slice preenche um GAP identificado no workflow:
 * //               Sem BOS, o orçamento era impreciso em 10-15%!
 * 
 * Referência: NBR 16274 (Sistemas Fotovoltaicos - Requisitos de Projeto)
 */

import { StateCreator } from 'zustand';
import { BOSInventory } from '@/core/schemas/bos.schemas';

/**
 * Interface do slice elétrico
 * Expõe dados e actions para manipulação de inventário BOS
 */
export interface ElectricalSlice {
  /** Inventário completo de Balance of System */
  bosInventory: BOSInventory | null;
  
  /**
   * Define/atualiza o inventário BOS completo
   * @param data - Inventário BOS validado pelo schema
   */
  updateBOSInventory: (data: BOSInventory) => void;
  
  /**
   * Atualiza parcialmente o inventário BOS
   * Útil para edições incrementais no formulário
   */
  patchBOSInventory: (data: Partial<BOSInventory>) => void;
  
  /**
   * Limpa o inventário BOS
   * // ATENÇÃO: Usar apenas em "Novo Projeto" ou reset explícito
   */
  clearBOSInventory: () => void;
}

/**
 * Estado inicial do inventário BOS
 * Começa como null para indicar que ainda não foi configurado
 * 
 * // Pergunta: Por que null e não um objeto vazio?
 * // Resposta: null permite distinguir entre:
 * //           - "Não configurado ainda" (null)
 * //           - "Configurado mas sem itens" ({dcCables: [], ...})
 */
const initialBOSInventory: BOSInventory | null = null;

/**
 * Factory function para criar o slice elétrico
 * Segue o padrão Zustand para slices compostos
 * 
 * Tipagem genérica para compatibilidade com store composto
 */
export const createElectricalSlice: StateCreator<
  ElectricalSlice,
  [],
  [],
  ElectricalSlice
> = (set) => ({
  bosInventory: initialBOSInventory,

  updateBOSInventory: (data) => set({ bosInventory: data }),

  patchBOSInventory: (data) => set((state) => ({
    bosInventory: state.bosInventory 
      ? { ...state.bosInventory, ...data }
      : {
          // Se não existe, criar com defaults + patch
          dcCables: [],
          acCables: [],
          breakers: [],
          groundingSystem: true,
          ...data
        }
  })),

  clearBOSInventory: () => set({ bosInventory: initialBOSInventory }),
});
