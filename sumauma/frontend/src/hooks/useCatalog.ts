import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { TopologyConfig } from '@/lib/types/topology';
import { toast } from '@/stores/toastStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ModuleEquipment {
  id: string;
  manufacturer: string;
  model: string;
  powerWp: number;
  isActive: boolean;
  createdAt?: string;
  efficiency?: number;
  dimensions?: string;
  weight?: number;
  depth?: number;
  datasheet?: string;
  imageUrl?: string;
  unifilarSymbolRef?: string;

  // -- Engineering PV Specs (v3.7) --
  bifacial?: boolean;
  bifacialityFactor?: number;
  cellSizeClass?: string;
  degradacaoAnual?: number;
  noct?: number;
  tempCoeffPmax?: number;
  tempCoeffVoc?: number;

  // Parâmetros técnicos vindos de `electricalData` (JSON):
  electricalData?: {
    voc?: number;
    isc?: number;
    vmp?: number;
    imp?: number;
    pmax?: number;
    rSerie?: number;
    rShunt?: number;
    gamma?: number;
    nCelS?: number;
    nCelP?: number;
    technol?: string;
    tempCoeffPmax?: number;
    tempCoeffVoc?: number;
    tempCoeffIsc?: number;
    vMaxIEC?: number;
    bifacialityFactor?: number;
    validation?: Array<{ status: 'critical' | 'warning' | 'info'; message: string; rule?: string }>;
    bankability?: 'BANKABLE' | 'ACCEPTABLE' | 'UNRELIABLE';
    [key: string]: unknown;
  };
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
  height?: number;
  width?: number;
  depth?: number;
  weight?: number;
  datasheet?: string;
  imageUrl?: string;
  unifilarSymbolRef?: string;

  // -- Engineering PV Specs (v3.7) --
  Voc_max_hardware?: number;
  Isc_max_hardware?: number;
  coolingType?: string;
  afci?: boolean;
  rsd?: boolean;
  portaria515Compliant?: boolean;

  // -- Topology (Diagrama de Blocos + Unifilar) --
  typologyConfig?: TopologyConfig;

  // Parâmetros técnicos vindos de `electricalData` (JSON):
  electricalData?: {
    phase?: string;          // 'Monofásico' | 'Trifásico'
    vNom?: number;
    vNomDC?: number;
    vAcOut?: number;
    vMinMpp?: number;
    vMaxMpp?: number;
    effMax?: number;
    effEuro?: number;
    fNom?: number;
    pNomDc?: number;
    pNomDCW?: number;
    pMaxDCW?: number;
    pThreshold?: number;
    iMaxDC?: number;
    iNomAC?: number;
    iMaxAC?: number;
    tPNom?: number;
    tPMax?: number;
    tPLim1?: number;
    tPLimAbs?: number;
    pLim1W?: number;
    pLimAbsW?: number;
    nightLoss?: number;
    transfo?: string;
    maxOutputW?: number;
    nbInputs?: number;
    nbMppt?: number;
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
    validation?: Array<{ status: 'critical' | 'warning' | 'info'; message: string; rule?: string }>;
    bankability?: 'BANKABLE' | 'ACCEPTABLE' | 'UNRELIABLE';
    efficiencyCurve?: Array<{ power: number; efficiency: number; pOut?: number }>;
    [key: string]: unknown;
  };
  // Campos diretos do schema:
  maxInputV?: number;
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
      .catch((err) => {
        const msg = err.response?.data?.error ?? 'Falha ao carregar catálogo';
        setError(msg);
        toast.error(msg);
      })
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
          const msg = err.response?.data?.error ?? 'Falha no upload do equipamento';
          setError(msg);
          toast.error(msg);
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
        .then(() => { toast.success(isActive ? 'Equipamento ativado.' : 'Equipamento desativado.'); onSuccess?.(); })
        .catch((err) => {
          toast.error(err.response?.data?.error ?? 'Falha ao alterar status do equipamento.');
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
      setDeletingId(id);
      return api
        .delete(`${endpointBase}/${id}`)
        .then(() => {
          toast.success('Equipamento excluído com sucesso.');
          onSuccess?.();
        })
        .catch((err) => {
          toast.error(err.response?.data?.error ?? 'Falha ao excluir equipamento.');
          throw err;
        })
        .finally(() => setDeletingId(null));
    },
    [endpointBase, onSuccess]
  );

  return { remove, deletingId };
}
