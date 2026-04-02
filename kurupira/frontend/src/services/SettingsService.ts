import { useSolarStore } from '@/core/state/solarStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('kurupira_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const SettingsService = {
  async loadSettingsFromDB(): Promise<void> {
    try {
      const res = await fetch(`${API_URL}/api/v1/settings`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;

      const { data } = await res.json();
      if (data && typeof data === 'object') {
        useSolarStore.setState((current) => ({
          settings: { ...current.settings, ...data },
        }));
      }
    } catch {
      // Sem backend disponível — settings locais são usados
    }
  },

  async saveSettingsToDB(): Promise<void> {
    try {
      const settings = useSolarStore.getState().settings;
      await fetch(`${API_URL}/api/v1/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings),
      });
    } catch {
      // Falha silenciosa — settings persistem no localStorage via zustand/persist
    }
  },
};
