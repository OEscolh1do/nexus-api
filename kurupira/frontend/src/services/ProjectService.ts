import { useSolarStore } from '@/core/state/solarStore';
import { initialClientData } from '@/core/state/slices/clientSlice';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { useUIStore } from '@/core/state/uiStore';
import { KurupiraClient, TechnicalDesignSummary } from './NexusClient';

const DESIGN_DATA_VERSION = '3.1';

function buildDesignData() {
  const solar = useSolarStore.getState();
  const tech = useTechStore.getState();

  return {
    version: DESIGN_DATA_VERSION,
    savedAt: new Date().toISOString(),
    solar: {
      project: solar.project,
      modules: solar.modules,
      settings: solar.settings,
      clientData: solar.clientData,
      legalData: solar.legalData,
      simulatedItems: solar.simulatedItems,
      bosInventory: solar.bosInventory,
      engineeringData: solar.engineeringData,
      weatherData: solar.weatherData,
    },
    tech: {
      lossProfile: tech.lossProfile,
      inverters: tech.inverters,
      strings: tech.strings,
      prCalculationMode: tech.prCalculationMode,
      kWpAlvo: solar.kWpAlvo,
      loadGrowthFactor: solar.loadGrowthFactor,
    },
  };
}

function hydrateStores(designData: any) {
  if (!designData || designData.version !== DESIGN_DATA_VERSION) return;

  if (designData.solar) {
    useSolarStore.setState((current) => ({
      ...current,
      ...designData.solar,
      project: { ...current.project, ...designData.solar.project },
      weatherData: designData.solar.weatherData || null,
      kWpAlvo: designData.tech?.kWpAlvo ?? current.kWpAlvo,
      loadGrowthFactor: designData.tech?.loadGrowthFactor ?? current.loadGrowthFactor,
    }));
  }

  if (designData.tech) {
    useTechStore.setState((current) => ({
      ...current,
      ...designData.tech,
    }));
  }
}

export const ProjectService = {
  async listProjects(): Promise<TechnicalDesignSummary[]> {
    return KurupiraClient.designs.list();
  },

  async saveDesign(_snapshotImageBase64: string | null): Promise<boolean> {
    try {
      const solarState = useSolarStore.getState();
      const activeProjectId = solarState.activeProjectId;
      const designData = buildDesignData();

      if (activeProjectId) {
        // Atualizar projeto existente
        await KurupiraClient.designs.update(activeProjectId, {
          designData,
          status: 'IN_PROGRESS',
          latitude: solarState.clientData?.lat || null,
          longitude: solarState.clientData?.lng || null,
        });
      } else {
        // Criar novo projeto (iacaLeadId vem do deep link do Iaçã; null = standalone)
        const leadId = solarState.clientData?.iacaLeadId ?? null;
        const projectName =
          solarState.clientData?.projectName ||
          'Projeto Kurupira ' + new Date().toISOString().split('T')[0];

        const design = await KurupiraClient.designs.create({
          iacaLeadId: leadId,
          name: projectName,
        });

        // Salvar o snapshot no campo designData
        await KurupiraClient.designs.update(design.id, { designData });
        solarState.setActiveProjectId(design.id);
      }

      solarState.approveProject();
      return true;
    } catch (error) {
      console.error('[ProjectService] Falha ao salvar design:', error);
      return false;
    }
  },

  async loadProjectAndHydrate(projectId: string): Promise<boolean> {
    try {
      // Clear before loading to completely reset the workspace and avoid memory leaks from old projects
      useSolarStore.setState(s => ({ 
          project: { ...s.project, installationAreas: [], placedModules: [], dropPoints: [], projectStatus: 'draft' },
          modules: { ids: [], entities: {} },
          inverters: { ids: [], entities: {} },
          simulatedItems: { ids: [], entities: {} },
          bosInventory: null,
          clientData: { ...initialClientData },
          legalData: null,
          weatherData: null,
          engineeringData: { orientation: 'Norte', azimute: 0, roofTilt: 15, shadingFactor: 0 },
          kWpAlvo: 0,
          loadGrowthFactor: 1,
          activeInvoiceId: null,
      }));
      useTechStore.getState().resetProject();
      useUIStore.getState().resetUIState();

      const design = await KurupiraClient.designs.get(projectId);
      hydrateStores(design.designData);
      useSolarStore.getState().setActiveProjectId(projectId);
      return true;
    } catch (error) {
      console.error('[ProjectService] Falha ao carregar design:', error);
      return false;
    }
  },

  async deleteProject(projectId: string): Promise<boolean> {
    try {
      await KurupiraClient.designs.delete(projectId);
      return true;
    } catch (error) {
      console.error('[ProjectService] Falha ao deletar design:', error);
      return false;
    }
  },

  async duplicateProject(_projectId: string) {
    return null;
  },

  async createStandaloneProject(payload: {
    projectName: string;
    clientName: string;
    city?: string;
    stateUF?: string;
    street?: string;
    zipCode?: string;
    neighborhood?: string;
    number?: string;
    lat?: number;
    lng?: number;
    connectionType?: 'monofasico' | 'bifasico' | 'trifasico';
    tariffRate?: number;
    monthlyHistory?: number[];
  }): Promise<string | null> {
    try {
      const design = await KurupiraClient.designs.create({
        iacaLeadId: null,
        name: payload.projectName || 'Sem Título',
        latitude: payload.lat,
        longitude: payload.lng,
      });

      // Clear local state completely before building the new project snapshot
      useSolarStore.setState(s => ({ 
          project: { ...s.project, installationAreas: [], placedModules: [], dropPoints: [], projectStatus: 'draft' },
          modules: { ids: [], entities: {} },
          inverters: { ids: [], entities: {} },
          simulatedItems: { ids: [], entities: {} },
          bosInventory: null,
          clientData: { ...initialClientData },
          legalData: null,
          weatherData: null,
          engineeringData: { orientation: 'Norte', azimute: 0, roofTilt: 15, shadingFactor: 0 },
          kWpAlvo: 0,
          loadGrowthFactor: 1,
          activeInvoiceId: null,
      }));
      useTechStore.getState().resetProject();
      useUIStore.getState().resetUIState();

      const skeletonData = buildDesignData();

      skeletonData.solar.clientData = {
        ...initialClientData,
        clientName: payload.clientName,
        street: payload.street || '',
        zipCode: payload.zipCode || '',
        neighborhood: payload.neighborhood || '',
        number: payload.number || '',
        city: payload.city || '',
        state: payload.stateUF || '',
        lat: payload.lat || 0,
        lng: payload.lng || 0,
        connectionType: payload.connectionType || 'monofasico',
        tariffRate: payload.tariffRate || 0.92,
        averageConsumption: (payload.monthlyHistory || []).reduce((a, b) => a + b, 0) / 12,
        invoices: [{
          id: 'default',
          name: 'Instalação Principal',
          installationNumber: '',
          concessionaire: '',
          rateGroup: 'B',
          connectionType: payload.connectionType || 'monofasico',
          voltage: '220',
          breakerCurrent: 50,
          monthlyHistory: payload.monthlyHistory || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        }],
      };

      await KurupiraClient.designs.update(design.id, { designData: skeletonData });
      await ProjectService.loadProjectAndHydrate(design.id);
      
      return design.id;
    } catch (e) {
      console.error('[ProjectService] Failed to create standalone project', e);
      return null;
    }
  }
};
