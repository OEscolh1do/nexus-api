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
import { NormalizedCollection, createEmptyCollection } from '@/core/types/normalized.types';

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

  /** Atualiza o consumo de um mês específico no array e recalcula a média */
  updateMonthlyConsumption: (monthIndex: number, value: number) => void;

  /** Atualiza a irradiação (HSP) de um mês específico no array */
  updateMonthlyIrradiation: (monthIndex: number, value: number) => void;

  /**
   * Dados para contrato (CPF/RG/Profissão)
   * Persistido para não perder o preenchimento
   */
  legalData: LegalData | null;
  setLegalData: (data: LegalData) => void;

  // --- MÚLTIPLAS UNIDADES CONSUMIDORAS (Invoices) ---
  /** ID da unidade consumidora atualmente em foco na UI */
  activeInvoiceId: string | null;
  setActiveInvoice: (id: string | null) => void;
  addInvoice: (invoice: Partial<InputData['invoices'][0]>) => void;
  removeInvoice: (id: string) => void;
  updateActiveInvoice: (updates: Partial<InputData['invoices'][0]>) => void;

  /**
   * Atualiza e persiste dados de irradiação solar (HSP Mensal)
   * @param data Array de 12 números com a irradiação mensal (kWh/m²)
   * @param city Nome da cidade/preset selecionado (opcional)
   */
  setIrradiationData: (data: number[], city?: string) => void;

  // Simulation State & Actions (PRÉ-1: normalizado)

  simulatedItems: NormalizedCollection<LoadItem>;
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
  perfil?: 'constante' | 'verao' | 'inverno'; // Sazonalidade
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
  tariffRate: 0.92,
  mapImage: '',
  invoices: [],
  // Default connection values
  // Default connection values
  connectionType: 'monofasico',
  averageConsumption: 0,

  // Default values for Irradiation
  monthlyIrradiation: Array(12).fill(0),
  irradiationCity: '',

  // Diagnóstico Preliminar (V3.3)
  roofType: undefined,
  roofInclination: 15,
  azimuth: 0, // 0 = Norte
  leadPersona: undefined,

  // Rede Elétrica & Concessionária (V3.4)
  concessionaire: '',
  rateGroup: undefined,
  tariffTE: undefined,
  tariffTUSD: undefined,
  tariffFioB: undefined,
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
  simulatedItems: createEmptyCollection<LoadItem>(),
  legalData: null,
  activeInvoiceId: null,

  updateClientData: (data) => set((state) => {
    // Se o usuário editar a média globalmente, aplica em todas as invoices para manter coerência legacy
    let newInvoices = [...state.clientData.invoices];
    if (data.averageConsumption !== undefined) {
       if (newInvoices.length === 0) {
         newInvoices.push({
           id: 'default', name: 'Instalação Principal', installationNumber: '', concessionaire: '',
           rateGroup: 'B', connectionType: state.clientData.connectionType || 'monofasico', voltage: '220',
           breakerCurrent: 50, monthlyHistory: Array(12).fill(data.averageConsumption)
         });
       } else {
         newInvoices = newInvoices.map(inv => ({ ...inv, monthlyHistory: Array(12).fill(data.averageConsumption!) }));
       }
    }
    
    return {
      clientData: { ...state.clientData, ...data, invoices: newInvoices },
      activeInvoiceId: state.activeInvoiceId || (newInvoices.length > 0 ? newInvoices[0].id : null)
    };
  }),

  setActiveInvoice: (id) => set({ activeInvoiceId: id }),

  addInvoice: (invoiceData) => set((state) => {
    const newId = `uc-${Date.now()}`;
    const newInvoice = {
      id: newId,
      name: invoiceData.name || `Nova Instalação`,
      installationNumber: invoiceData.installationNumber || '',
      concessionaire: invoiceData.concessionaire || '',
      rateGroup: invoiceData.rateGroup || 'B',
      connectionType: invoiceData.connectionType || 'monofasico',
      voltage: invoiceData.voltage || '220',
      breakerCurrent: invoiceData.breakerCurrent || 50,
      tariffRate: invoiceData.tariffRate || 0.92,
      monthlyHistory: invoiceData.monthlyHistory || Array(12).fill(0),
      ...invoiceData
    };
    
    return {
      clientData: {
        ...state.clientData,
        invoices: [...state.clientData.invoices, newInvoice]
      },
      activeInvoiceId: newId
    };
  }),

  removeInvoice: (id) => set((state) => {
    const filtered = state.clientData.invoices.filter(inv => inv.id !== id);
    if (filtered.length === 0) return state; // não permite deletar a última
    
    return {
      clientData: { ...state.clientData, invoices: filtered },
      activeInvoiceId: state.activeInvoiceId === id ? filtered[0].id : state.activeInvoiceId
    };
  }),

  updateActiveInvoice: (updates) => set((state) => {
    if (!state.activeInvoiceId) return state;
    const newInvoices = state.clientData.invoices.map(inv => 
      inv.id === state.activeInvoiceId ? { ...inv, ...updates } : inv
    );
    
    // Recalcular a média agregada "global" por segurança
    const totalAvg = newInvoices.reduce((sum, inv) => {
      return sum + (inv.monthlyHistory.reduce((a, b) => a + b, 0) / 12);
    }, 0);

    return {
      clientData: { ...state.clientData, invoices: newInvoices, averageConsumption: Number(totalAvg.toFixed(2)) }
    };
  }),

  updateMonthlyConsumption: (monthIndex, value) => set((state) => {
    const invoices = [...state.clientData.invoices];
    if (invoices.length === 0) {
      invoices.push({
        id: 'default', name: 'Instalação Principal', installationNumber: '', concessionaire: '',
        rateGroup: 'B', connectionType: state.clientData.connectionType || 'monofasico', voltage: '220',
        breakerCurrent: 50, monthlyHistory: Array(12).fill(state.clientData.averageConsumption || 0)
      });
    }

    const activeId = state.activeInvoiceId || invoices[0].id;
    const invIndex = invoices.findIndex(i => i.id === activeId);
    if (invIndex === -1) return state;

    const newHistory = [...invoices[invIndex].monthlyHistory];
    newHistory[monthIndex] = value;
    invoices[invIndex] = { ...invoices[invIndex], monthlyHistory: newHistory };

    const totalAvg = invoices.reduce((sum, inv) => {
      return sum + (inv.monthlyHistory.reduce((a, b) => a + b, 0) / 12);
    }, 0);

    return {
      clientData: {
        ...state.clientData,
        invoices,
        averageConsumption: Number(totalAvg.toFixed(2))
      },
      activeInvoiceId: activeId
    };
  }),

  updateMonthlyIrradiation: (monthIndex, value) => set((state) => {
    const newIrradiation = [...(state.clientData.monthlyIrradiation || Array(12).fill(0))];
    newIrradiation[monthIndex] = value;
    
    return {
      clientData: {
        ...state.clientData,
        monthlyIrradiation: newIrradiation,
        irradiationCity: 'Manual (Editado)' // Se o usuário editar na mão, muda a flag de fonte
      }
    };
  }),

  setWeatherData: (data) => set({ weatherData: data }),

  setLoadingWeather: (loading) => set({ isLoadingWeather: loading }),

  setLegalData: (data) => set({ legalData: data }),

  setIrradiationData: (data, city) => set((state) => ({
    clientData: {
      ...state.clientData,
      monthlyIrradiation: data,
      irradiationCity: city || state.clientData.irradiationCity
    }
  })),


  addLoadItem: (item) => set((state) => ({
    simulatedItems: {
      ids: [...state.simulatedItems.ids, item.id],
      entities: { ...state.simulatedItems.entities, [item.id]: item },
    },
  })),

  updateLoadItem: (id, updates) => set((state) => ({
    simulatedItems: {
      ...state.simulatedItems,
      entities: {
        ...state.simulatedItems.entities,
        [id]: { ...state.simulatedItems.entities[id], ...updates },
      },
    },
  })),

  removeLoadItem: (id) => set((state) => {
    const { [id]: _, ...remaining } = state.simulatedItems.entities;
    return {
      simulatedItems: {
        ids: state.simulatedItems.ids.filter(existingId => existingId !== id),
        entities: remaining,
      },
    };
  }),

  getSimulatedTotal: () => {
    const { simulatedItems } = get();
    return Object.values(simulatedItems.entities).reduce((acc, item) => {
      // Engineering Formula: (Power * Duty * Hours * Days * Qty) / 1000
      const duty = item.dutyCycle ?? 1;
      const days = item.daysPerMonth ?? 30; // 30 days default
      return acc + ((item.power * duty * item.hoursPerDay * days * item.qty) / 1000);
    }, 0);
  }
});
