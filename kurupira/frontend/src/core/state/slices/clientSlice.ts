/**
 * CLIENT-SLICE.TS
 * Slice Zustand para dados do Cliente (CRM)
 * 
 * Responsabilidade: Gerenciar estado de identificação do cliente,
 * localização, consumo energético e dados meteorológicos.
 * 
 * // NOTA V2.1.0: Campo `orientation` foi REMOVIDO deste slice.
 * //              Agora pertence ao EngineeringSlice (domínio técnico).
 */

import { StateCreator } from 'zustand';
import { InputData, WeatherAnalysis } from '@/core/types';
import { LegalData } from '@/core/schemas/contract.schemas';

/**
 * Interface do slice de cliente (CRM)
 * Expõe dados e actions para manipulação de informações do cliente
 */
export interface ClientSlice {
  /** Dados de entrada do cliente (identificação, localização, consumo) */
  clientData: InputData;

  /** Dados meteorológicos da localização (cache de API) */
  weatherData: WeatherAnalysis | null;

  /** Flag de loading para requisições de weather data */
  isLoadingWeather: boolean;

  // Actions
  updateClientData: (data: Partial<InputData>) => void;
  setWeatherData: (data: WeatherAnalysis | null) => void;
  setLoadingWeather: (loading: boolean) => void;

  /**
   * Dados para contrato (CPF/RG/Profissão)
   * Persistido para não perder o preenchimento
   */
  legalData: LegalData | null;
  setLegalData: (data: LegalData) => void;

  /**
   * Atualiza e persiste dados de irradiação solar (HSP Mensal)
   * @param data Array de 12 números com a irradiação mensal (kWh/m²)
   * @param city Nome da cidade/preset selecionado (opcional)
   */
  setIrradiationData: (data: number[], city?: string) => void;

  // Simulation State & Actions
  simulatedItems: LoadItem[];
  addLoadItem: (item: LoadItem) => void;
  updateLoadItem: (id: string, updates: Partial<LoadItem>) => void;
  removeLoadItem: (id: string) => void;
  getSimulatedTotal: () => number;
}

/**
 * Load Item Types
 */
export interface LoadItem {
  id: string;
  name: string;
  power: number; // Watts
  dutyCycle: number; // 0-1 (Fator de uso)
  hoursPerDay: number;
  daysPerMonth: number; // Freq: 1-31
  qty: number;
  suggestion?: string;
  solarOpportunity?: boolean;
}

/**
 * Estado inicial de dados do cliente
 * 
 * // ATENÇÃO V2.1.0: `orientation` foi removido deste objeto!
 * //                 Migração: usuários devem redefinir orientação no TechModule
 */
export const initialClientData: InputData = {
  projectName: '', // Opcional: Se vazia, ProjectService fará o fallback
  clientName: '',
  street: '',
  neighborhood: '',
  city: '',
  state: '',
  number: '',
  complement: '',
  zipCode: '',
  lat: 0,
  lng: 0,
  availableArea: 0,
  /**
   * @deprecated V2.1.0 - Mantido para compatibilidade.
   * Fonte de verdade: EngineeringSlice.engineeringData.orientation
   */
  orientation: 'Norte',
  tariffRate: 0.92,
  mapImage: '',
  invoices: [],
  // Default connection values
  // Default connection values
  connectionType: 'monofasico',
  averageConsumption: 0,

  // Default values for Irradiation
  monthlyIrradiation: Array(12).fill(0),
  irradiationCity: ''
};

/**
 * Factory function para criar o slice de cliente
 * Segue o padrão Zustand para slices compostos
 * 
 * Tipagem genérica para compatibilidade com store composto
 */
export const createClientSlice: StateCreator<
  ClientSlice,
  [],
  [],
  ClientSlice
> = (set, get) => ({
  clientData: initialClientData,
  weatherData: null,
  isLoadingWeather: false,
  simulatedItems: [],
  legalData: null,

  updateClientData: (data) => set((state) => ({
    clientData: { ...state.clientData, ...data }
  })),

  setWeatherData: (data) => set({ weatherData: data }),

  setLoadingWeather: (loading) => set({ isLoadingWeather: loading }),

  setLegalData: (data) => set({ legalData: data }),

  setIrradiationData: (data, city) => set((state) => ({
    clientData: {
      ...state.clientData,
      monthlyIrradiation: data,
      irradiationCity: city || state.clientData.irradiationCity
      // Note: hsp is derived from monthlyIrradiation when needed, or stored in weatherData buffer
    }
  })),

  addLoadItem: (item) => set((state) => ({
    simulatedItems: [...state.simulatedItems, item]
  })),

  updateLoadItem: (id, updates) => set((state) => ({
    simulatedItems: state.simulatedItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
  })),

  removeLoadItem: (id) => set((state) => ({
    simulatedItems: state.simulatedItems.filter(i => i.id !== id)
  })),

  getSimulatedTotal: () => {
    const items = get().simulatedItems;
    return items.reduce((acc, item) => {
      // Engineering Formula: (Power * Duty * Hours * Days * Qty) / 1000
      const duty = item.dutyCycle ?? 1;
      const days = item.daysPerMonth ?? 30; // 30 days default
      return acc + ((item.power * duty * item.hoursPerDay * days * item.qty) / 1000);
    }, 0);
  }
});
