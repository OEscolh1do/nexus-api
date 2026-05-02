import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ModuleEquipment {
  id: string;
  manufacturer: string;
  model: string;
  powerWp: number;
  isActive: boolean;
  createdAt?: string;
  efficiency?: number;
  // Parâmetros técnicos vindos de `electricalData` (JSON):
  electricalData?: {
    voc?: number;
    isc?: number;
    vmp?: number;
    imp?: number;
    pmax?: number;
    tempCoeffPmax?: number;
    tempCoeffVoc?: number;
    [key: string]: unknown;
  };
  // Campos diretos do schema (tempCoeff armazenados nas colunas dedicadas):
  tempCoeffPmax?: number;
  tempCoeffVoc?: number;
}

export interface InverterEquipment {
  id: string;
  manufacturer: string;
  model: string;
  nominalPowerW: number;   // campo real no schema
  isActive: boolean;
  createdAt?: string;
  mpptCount?: number;
  efficiency?: number;
  // Parâmetros técnicos vindos de `electricalData` (JSON):
  electricalData?: {
    phase?: string;          // 'Monofásico' | 'Trifásico'
    outputVoltage?: number;
    minInputV?: number;
    maxInputCurrent?: number;
    maxOutputCurrent?: number;
    ipRating?: string;
    observations?: string;
    [key: string]: unknown;
  };
  // Campos diretos do schema:
  maxInputV?: number;
  Voc_max_hardware?: number;
  Isc_max_hardware?: number;
}

export interface CatalogListParams {
  page?: number;
  limit?: number;
  manufacturer?: string;
  isActive?: boolean | string;
  q?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Hooks Genéricos para Listagem ──────────────────────────────────────────

function useCatalogList<T>(endpoint: string, params: CatalogListParams) {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get(endpoint, { params })
      .then((res) => {
        setData(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch((err) => setError(err.response?.data?.error ?? 'Falha ao carregar catálogo'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(params)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, pagination, loading, error, refetch: fetch };
}

export function useModules(params: CatalogListParams) {
  return useCatalogList<ModuleEquipment>('/catalog/modules', params);
}

export function useInverters(params: CatalogListParams) {
  return useCatalogList<InverterEquipment>('/catalog/inverters', params);
}

// ─── Upload (M2M) ─────────────────────────────────────────────────────────────

export function useUploadEquipment(endpoint: string, onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    (filename: string, content: string) => {
      setLoading(true);
      setError(null);
      return api
        .post(endpoint, { filename, content })
        .then(() => onSuccess?.())
        .catch((err) => {
          setError(err.response?.data?.error ?? 'Falha no upload do equipamento');
          throw err;
        })
        .finally(() => setLoading(false));
    },
    [endpoint, onSuccess]
  );

  return { mutate, loading, error, setError };
}

// ─── Toggle Ativação (M2M) ───────────────────────────────────────────────────

export function useToggleEquipment(endpointBase: string, onSuccess?: () => void) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const toggle = useCallback(
    (id: string, isActive: boolean) => {
      setLoadingId(id);
      return api
        .patch(`${endpointBase}/${id}`, { isActive })
        .then(() => onSuccess?.())
        .catch((err) => {
          console.error('Falha ao alterar status:', err);
          throw err;
        })
        .finally(() => setLoadingId(null));
    },
    [endpointBase, onSuccess]
  );

  return { toggle, loadingId };
}

// ─── Exclusão (M2M) ──────────────────────────────────────────────────────────

export function useDeleteEquipment(endpointBase: string, onSuccess?: () => void) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remove = useCallback(
    (id: string) => {
      if (!window.confirm('Tem certeza que deseja excluir este equipamento permanentemente?')) {
        return;
      }

      setDeletingId(id);
      return api
        .delete(`${endpointBase}/${id}`)
        .then(() => onSuccess?.())
        .catch((err) => {
          console.error('Falha ao excluir equipamento:', err);
          alert(err.response?.data?.error || 'Falha ao excluir equipamento');
          throw err;
        })
        .finally(() => setDeletingId(null));
    },
    [endpointBase, onSuccess]
  );

  return { remove, deletingId };
}
