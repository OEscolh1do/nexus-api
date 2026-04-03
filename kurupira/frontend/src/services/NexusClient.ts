/**
 * KurupiraClient.ts (ex-NexusClient)
 * Responsabilidade: Abstrair comunicação entre o frontend Kurupira e o kurupira-backend.
 * Regra: Todas as chamadas ao backend passam por aqui.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

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

    create: (data: { iacaLeadId: string | null; name?: string }) =>
      apiFetch<TechnicalDesignSummary>('/api/v1/designs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<{ name: string; status: string; designData: any; notes: string }>) =>
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
    inverters: () => apiFetch<any[]>('/api/v1/catalog/inverters'),
  },
};

// Legacy export for backward compatibility
export { KurupiraClient as NexusClient };
