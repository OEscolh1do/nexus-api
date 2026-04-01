import { useSolarStore } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
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
    },
    tech: {
      lossProfile: tech.lossProfile,
      inverters: tech.inverters,
      strings: tech.strings,
      prCalculationMode: tech.prCalculationMode,
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
        });
      } else {
        // Criar novo projeto (iacaLeadId vem do deep link do Iaçã; null = standalone)
        const leadId = (solarState.clientData as any)?.iacaLeadId || null;
        const projectName =
          (solarState.clientData as any)?.name ||
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
      console.log('[ProjectService] Projeto salvo com sucesso.');
      return true;
    } catch (error) {
      console.error('[ProjectService] Falha ao salvar design:', error);
      return false;
    }
  },

  async loadProjectAndHydrate(projectId: string): Promise<boolean> {
    try {
      const design = await KurupiraClient.designs.get(projectId);
      hydrateStores(design.designData);
      useSolarStore.getState().setActiveProjectId(projectId);
      console.log('[ProjectService] Projeto carregado:', design.name);
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
};
