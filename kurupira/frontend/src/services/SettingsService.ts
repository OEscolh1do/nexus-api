import { useSolarStore } from '@/core/state/solarStore';

// TODO: Implementar chamadas reais para o backend Kurupira via KurupiraClient
export const SettingsService = {
    async loadSettingsFromDB() {
        console.warn("SettingsService.loadSettingsFromDB: Supabase removido. Aguardando integração com Kurupira Backend via KurupiraClient.");
    },

    async saveSettingsToDB() {
        console.warn("SettingsService.saveSettingsToDB: Supabase removido. Aguardando integração com Kurupira Backend.");
    }
};
