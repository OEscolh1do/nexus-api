import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TenantUser {
  id: string;
  username: string;
  fullName: string | null;
  role: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  type: 'MASTER' | 'INDIVIDUAL' | 'CORPORATE';
  apiPlan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  apiMonthlyQuota: number;
  apiCurrentUsage: number;
  ssoProvider: string | null;
  ssoEnforced: boolean;
  status?: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED';
  createdAt: string;
  _count: { users: number; auditLogs: number };
}

export interface TenantDetail extends Tenant {
  users: TenantUser[];
}

export interface TenantsListParams {
  page?: number;
  limit?: number;
  plan?: string;
  type?: string;
  q?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── useTenants ───────────────────────────────────────────────────────────────

export function useTenants(params: TenantsListParams) {
  const [data, setData] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get('/tenants', { params })
      .then((res) => {
        setData(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch((err) => {
        setError(err.response?.data?.error ?? 'Falha ao carregar organizações');
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, pagination, loading, error, refetch: fetch };
}

// ─── useTenant (detail) ──────────────────────────────────────────────────────

export function useTenant(id: string | null) {
  const [data, setData] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api
      .get(`/tenants/${id}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.error ?? 'Falha ao carregar organização'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function usePatchTenant(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    (id: string, payload: Record<string, unknown>) => {
      setLoading(true);
      setError(null);
      return api
        .patch(`/tenants/${id}`, payload)
        .then(() => onSuccess?.())
        .catch((err) => {
          setError(err.response?.data?.error ?? 'Falha ao atualizar organização');
          throw err;
        })
        .finally(() => setLoading(false));
    },
    [onSuccess]
  );

  return { mutate, loading, error };
}

export function useBlockTenant(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    (id: string) => {
      setLoading(true);
      setError(null);
      return api
        .post(`/tenants/${id}/block`)
        .then(() => onSuccess?.())
        .catch((err) => {
          setError(err.response?.data?.error ?? 'Falha ao bloquear organização');
          throw err;
        })
        .finally(() => setLoading(false));
    },
    [onSuccess]
  );

  return { mutate, loading, error };
}

export function useUnblockTenant(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    (id: string) => {
      setLoading(true);
      setError(null);
      return api
        .post(`/tenants/${id}/unblock`)
        .then(() => onSuccess?.())
        .catch((err) => {
          setError(err.response?.data?.error ?? 'Falha ao desbloquear organização');
          throw err;
        })
        .finally(() => setLoading(false));
    },
    [onSuccess]
  );

  return { mutate, loading, error };
}

// ─── useTenantOptions (dropdown list) ────────────────────────────────────────

export interface TenantOption {
  id: string;
  name: string;
  status?: string;
}

export function useTenantOptions() {
  const [data, setData] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/tenants/options')
      .then((res) => setData(res.data.data ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function useCreateTenant(onSuccess?: (id: string, name: string) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    (payload: { name: string; apiPlan?: string; apiMonthlyQuota?: number; type?: string }) => {
      setLoading(true);
      setError(null);
      return api
        .post('/tenants', payload)
        .then((res) => onSuccess?.(res.data.data?.id, res.data.data?.name))
        .catch((err) => {
          setError(err.response?.data?.error ?? 'Falha ao criar organização');
          throw err;
        })
        .finally(() => setLoading(false));
    },
    [onSuccess]
  );

  return { mutate, loading, error };
}
