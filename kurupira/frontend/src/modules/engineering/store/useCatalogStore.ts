import { create } from 'zustand';
import { KurupiraClient } from '@/services/NexusClient';
import { type InverterCatalogItem } from '@/core/schemas/inverterSchema';
import { type ModuleCatalogItem } from '@/core/schemas/moduleSchema';

interface CatalogState {
  inverters: InverterCatalogItem[];
  modules: ModuleCatalogItem[];
  isLoading: boolean;
  error: string | null;
  fetchCatalog: () => Promise<void>;
  addCustomModule: (module: ModuleCatalogItem) => void;
}

/**
 * P8: Global Zustand Store para Biblioteca Visual Dinâmica
 * Substitui INVERTER_CATALOG e MODULE_DB estáticos por dados transientes da API.
 */
export const useCatalogStore = create<CatalogState>((set) => ({
  inverters: [],
  modules: [],
  isLoading: false,
  error: null,
  
  fetchCatalog: async () => {
    set({ isLoading: true, error: null });
    try {
      const [modulesRaw, invertersRaw] = await Promise.all([
        KurupiraClient.catalog.modules(),
        KurupiraClient.catalog.inverters()
      ]);
      
      // Mapeamento idêntico ao antigo esquema estático para mitigar quebra de UI
      const modules: ModuleCatalogItem[] = modulesRaw.map(m => {
        const ed = m.electricalData || {};
        return {
          id: m.id,
          manufacturer: m.manufacturer,
          model: m.model,
          imageUrl: m.imageUrl,
          unifilarSymbolRef: m.unifilarSymbolRef,
          electrical: {
            pmax: m.powerWp,
            vmp: ed.vmp || 0,
            imp: ed.imp || 0,
            voc: ed.voc || 0,
            isc: ed.isc || 0,
            efficiency: ed.efficiency ?? m.efficiency ?? 0,
            tempCoeffVoc: ed.tempCoeffVoc || 0,
            bifacial: ed.bifacial ?? false,
            degradacaoAnual: ed.degradacaoAnual ?? 0.5,
          },
          physical: {
            widthMm: m.dimensions ? Number(m.dimensions.split('x')[0]) || 0 : (m.width || ed.widthMm || 0),
            heightMm: m.dimensions ? Number(m.dimensions.split('x')[1]) || 0 : (m.height || ed.heightMm || 0),
            depthMm: m.depth ?? ed.depthMm ?? 0,
            weightKg: m.weight ?? ed.weightKg ?? 0,
            cells: ed.cells || 0,
          }
        };
      });

      const inverters: InverterCatalogItem[] = invertersRaw.map(i => {
        const ed = i.electricalData || {};
        // The DB electricalData JSON now contains the explicit `mppts` matrix (seeded by seed-catalog).
        // This is the authentic source of truth for asymmetrical topologies and stringsAllowed.
        const defaultTotalMaxI = ed.maxInputCurrent || i.Isc_max_hardware || ed.Isc_max_hardware || i.maxInputCurrent || 12;
        const count = i.mpptCount || i.mppts || 1;
        
        // Se não há objeto ed.mppts explícito, o valor defaultTotalMaxI representa a corrente global do inversor.
        // O limite real por MPPT é a corrente global dividida pela quantidade de MPPTs.
        const defaultMpptMaxI = Number((defaultTotalMaxI / count).toFixed(2));

        const fallbackMppts = Array.from({ length: count }, (_, idx) => ({
            mpptId: idx + 1,
            minMpptVoltage: ed.vMinMpp || ed.minInputV || 40,
            maxMpptVoltage: ed.vMaxMpp || i.maxInputV || 600,
            maxInputVoltage: i.maxInputV || 600,
            maxCurrentPerMPPT: defaultMpptMaxI,
            stringsAllowed: 1
        }));

        const mppts = (ed.mppts && Array.isArray(ed.mppts) && ed.mppts.length > 0) 
            ? ed.mppts 
            : fallbackMppts;

        return {
          id: i.id,
          manufacturer: i.manufacturer,
          model: i.model,
          imageUrl: i.imageUrl,
          unifilarSymbolRef: i.unifilarSymbolRef,
          symbolConfig: (i as any).symbolConfig ?? null,   // PSB: propagar config paramétrico
          nominalPowerW: i.nominalPowerW,
          maxDCPowerW: i.nominalPowerW * 1.5,
          maxInputVoltage: i.maxInputV || 600,
          connectionType: ed.connectionType || 'Monofásico',
          width: i.width || ed.widthMm || 0,
          height: i.height || ed.heightMm || 0,
          depth: i.depth || ed.depthMm || 0,
          weight: i.weight || ed.weight || 0,
          outputVoltage: ed.outputVoltage || 220,
          outputFrequency: ed.outputFrequency || 60,
          maxOutputCurrent: ed.maxOutputCurrent || 0,
          efficiency: { euro: i.efficiency || 97 },
          mppts: mppts,
          afci: ed.afci ?? false,
          rsd: ed.rsd ?? false,
          portaria515Compliant: ed.portaria515Compliant ?? false,
          isActive: i.active ?? true,
        };

      });

      set(state => {
        const customModules = state.modules.filter(m => m.id.startsWith('PAN_'));
        return {
          modules: [...customModules, ...modules],
          inverters,
          isLoading: false
        };
      });
    } catch (err: any) {
      console.error("API Catalog Fetch Error:", err);
      set({ error: err.message || 'Falha ao buscar catálogo', isLoading: false });
    }
  },
  
  addCustomModule: (module) => {
    set((state) => {
      // Evita duplicatas pelo ID
      if (state.modules.some(m => m.id === module.id)) {
        return state;
      }
      return { modules: [module, ...state.modules] };
    });
  }
}));
