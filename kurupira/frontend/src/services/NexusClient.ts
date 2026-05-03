/**
 * KurupiraClient.ts (ex-NexusClient)
 * Responsabilidade: Abstrair comunicação entre o frontend Kurupira e o kurupira-backend.
 * Regra: Todas as chamadas ao backend passam por aqui.
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Recupera token JWT do sessionStorage (injectado pelo AuthProvider)
function getAuthToken(): string | null {
  return sessionStorage.getItem('kurupira_token');
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// =============================================================
// GENERIC FETCH WRAPPER
// =============================================================

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers as Record<string, string> },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      const hadToken = !!getAuthToken();
      
      console.warn('[NexusClient] 401/403 recebido do backend. Limpando tokens.');
      sessionStorage.removeItem('kurupira_token');
      localStorage.removeItem('token');
      
      // Só exibe alerta se o usuário TENTOU usar um token e ele foi rejeitado
      // Evita o alerta "Token required" durante o momento em que o usuário clica em "Sair"
      if (hadToken) {
        alert(`Erro de Sessão: ${errorBody.error || 'Inválida ou expirada'}`);
      }
      
      window.location.href = '/login';
    }
    throw new Error(errorBody.error || `API Error: ${response.status}`);
  }

  const json = await response.json();
  return json.data ?? json;
}

// =============================================================
// TECHNICAL DESIGNS (CRUD)
// =============================================================

export interface TechnicalDesignSummary {
  id: string;
  name: string;
  iacaLeadId: string;
  status: string;
  updatedAt: string;
  targetPowerKwp?: number;
  averageConsumptionKwh?: number;
  lat?: number | null;
  lng?: number | null;
  clientName?: string | null;
  city?: string | null;
  state?: string | null;
  moduleCount?: number;
  inverterCount?: number;
  voltage?: string | number | null;
  leadContext?: {
    name: string;
    phone?: string;
    city?: string;
    state?: string;
    unavailable?: boolean;
  };
}

export interface TechnicalDesignFull extends TechnicalDesignSummary {
  designData: any;
  notes?: string;
  roofSections: any[];
  pvArrays: any[];
  simulations: any[];
}

export const KurupiraClient = {
  designs: {
    list: () => apiFetch<TechnicalDesignSummary[]>('/api/v1/designs'),

    get: (id: string) => apiFetch<TechnicalDesignFull>(`/api/v1/designs/${id}`),

    create: (data: { iacaLeadId: string | null; name?: string; latitude?: number | null; longitude?: number | null }) =>
      apiFetch<TechnicalDesignSummary>('/api/v1/designs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<{ name: string; status: string; designData: any; notes: string; latitude: number | null; longitude: number | null }>) =>
      apiFetch<TechnicalDesignSummary>(`/api/v1/designs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/v1/designs/${id}`, { method: 'DELETE' }),
  },

  roofSections: {
    create: (designId: string, data: any) =>
      apiFetch(`/api/v1/designs/${designId}/roof-sections`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  pvArrays: {
    create: (designId: string, data: any) =>
      apiFetch(`/api/v1/designs/${designId}/pv-arrays`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  simulations: {
    create: (designId: string, data: any) =>
      apiFetch(`/api/v1/designs/${designId}/simulations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  catalog: {
    modules: () => apiFetch<any[]>('/api/v1/catalog/modules'),
    createModule: (data: any) => apiFetch<any>('/api/v1/catalog/modules', { method: 'POST', body: JSON.stringify(data) }),
    updateModule: (id: string, data: any) => apiFetch<any>(`/api/v1/catalog/modules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    uploadModuleImage: async (id: string, file: Blob) => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch(`${API_URL}/api/v1/catalog/modules/${id}/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: formData
      });
      if (!response.ok) throw new Error('Falha no upload da imagem');
      return (await response.json()).data;
    },

    inverters: () => apiFetch<any[]>('/api/v1/catalog/inverters'),
    createInverter: (data: any) => apiFetch<any>('/api/v1/catalog/inverters', { method: 'POST', body: JSON.stringify(data) }),
    updateInverter: (id: string, data: any) => apiFetch<any>(`/api/v1/catalog/inverters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    uploadInverterImage: async (id: string, file: Blob) => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch(`${API_URL}/api/v1/catalog/inverters/${id}/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: formData
      });
      if (!response.ok) throw new Error('Falha no upload da imagem');
      return (await response.json()).data;
    },
  },

  team: {
    list: () => apiFetch<any[]>('/api/v1/team'),
  },
};

// Legacy export for backward compatibility
export { KurupiraClient as NexusClient };
