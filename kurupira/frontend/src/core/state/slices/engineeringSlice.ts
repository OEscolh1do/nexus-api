/**
 * ENGINEERING-SLICE.TS
 * Slice Zustand para dados de Geometria Solar
 * 
 * Responsabilidade: Gerenciar estado de orientação, azimute e inclinação
 * que afetam diretamente o cálculo de geração no TechModule.
 * 
 * // NOTA: Estes dados foram segregados do ClientSlice (CRM) porque:
 * //       1. São responsabilidade do engenheiro, não do vendedor
 * //       2. Afetam cálculos críticos de segurança (Voc, PR)
 * //       3. Devem ser validados independentemente antes da proposta
 */

import { StateCreator } from 'zustand';
import { EngineeringInput } from '@/core/schemas/engineering-input.schemas';

/**
 * Interface do slice de engenharia
 * Expõe dados e actions para manipulação de geometria solar
 */
export interface EngineeringSlice {
  /** Dados de geometria solar (orientação, azimute, inclinação) */
  engineeringData: EngineeringInput;
  
  /**
   * Atualiza parcialmente os dados de engenharia
   * @param data - Campos a serem atualizados (merge parcial)
   */
  updateEngineeringData: (data: Partial<EngineeringInput>) => void;
  
  /**
   * Reseta os dados de engenharia para valores padrão
   * // ATENÇÃO: Usar apenas em "Novo Projeto" ou reset explícito
   */
  resetEngineeringData: () => void;
}

/**
 * Estado inicial de engenharia
 * 
 * // Pergunta: Por que "Norte" como default?
 * // Resposta: No hemisfério Sul, Norte é a orientação ótima.
 * //           O sistema é projetado para uso no Brasil.
 */
const initialEngineeringData: EngineeringInput = {
  orientation: 'Norte',
  azimute: 0, // 0° = Norte
  roofTilt: 15, // Inclinação típica de telhados residenciais
  shadingFactor: 0, // Assumir sem sombra até análise
};

/**
 * Factory function para criar o slice de engenharia
 * Segue o padrão Zustand para slices compostos
 * 
 * Tipagem genérica para compatibilidade com store composto
 */
export const createEngineeringSlice: StateCreator<
  EngineeringSlice,
  [],
  [],
  EngineeringSlice
> = (set) => ({
  engineeringData: initialEngineeringData,

  updateEngineeringData: (data) => set((state) => ({
    engineeringData: { ...state.engineeringData, ...data }
  })),

  resetEngineeringData: () => set({ engineeringData: initialEngineeringData }),
});
