import { useSolarStore } from '@/core/state/solarStore';
import { KurupiraClient } from './NexusClient';

export const SettingsService = {
  async loadSettingsFromDB(): Promise<void> {
    try {
      const data = await KurupiraClient.settings.get();
      if (data && typeof data === 'object') {
        useSolarStore.setState((current) => ({
          settings: { ...current.settings, ...data },
        }));
      }
    } catch (error) {
      console.warn('[SettingsService] Sem backend disponível ou erro no fetch. Usando defaults locais.');
    }
  },

  async saveSettingsToDB(): Promise<void> {
    try {
      const settings = useSolarStore.getState().settings;
      await KurupiraClient.settings.update(settings);
    } catch (error) {
      console.error('[SettingsService] Falha ao salvar configurações no banco.', error);
    }
  },
};
