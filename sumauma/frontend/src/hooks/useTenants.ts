import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from '@/stores/toastStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TenantUser {
  id: string;
  username: string;
  fullName: string | null;
  role: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  timestamp: string;
  user?: { username: string };
  details?: string;
}

export interface Tenant {
  id: string;
  name: string;
  type: 'MASTER' | 'INDIVIDUAL' | 'CORPORATE';
  apiPlan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  apiMonthlyQuota: number;
  apiCurrentUsage: number;
  ssoProvider: string | null;
  ssoDomain: string | null;
  ssoEnforced: boolean;
  status: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED' | 'TRIAL_EXPIRED';
  createdAt: string;
  _count: { users: number; auditLogs: number };
}

export interface TenantDetail extends Tenant {
  users: TenantUser[];
  auditLogs: AuditLog[];
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
        const msg = err.response?.data?.error ?? 'Falha ao carregar organizações';
        setError(msg);
        toast.error(msg);
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
      .catch((err) => {
        const msg = err.response?.data?.error ?? 'Falha ao carregar organização';
        setError(msg);
        toast.error(msg);
      })
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
        .then(() => { toast.success('Organização atualizada com sucesso.'); onSuccess?.(); })
        .catch((err) => {
          const msg = err.response?.data?.error ?? 'Falha ao atualizar organização';
          setError(msg);
          toast.error(msg);
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
        .then(() => { toast.success('Organização bloqueada.'); onSuccess?.(); })
        .catch((err) => {
          const msg = err.response?.data?.error ?? 'Falha ao bloquear organização';
          setError(msg);
          toast.error(msg);
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
        .then(() => { toast.success('Organização desbloqueada.'); onSuccess?.(); })
        .catch((err) => {
          const msg = err.response?.data?.error ?? 'Falha ao desbloquear organização';
          setError(msg);
          toast.error(msg);
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
  type: 'INDIVIDUAL' | 'CORPORATE';
  apiPlan: string;
  _count: { users: number };
}

export function useTenantOptions() {
  const [data, setData] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/tenants/options')
      .then((res) => setData(res.data.data ?? []))
      .catch((err) => {
        const msg = err.response?.data?.error ?? 'Falha ao carregar opções de organização';
        toast.error(msg);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function useCreateTenant(onSuccess?: (id: string, name: string) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    (payload: { name: string; apiPlan?: string; apiMonthlyQuota?: number; type?: string; ownerFullName?: string; ownerEmail?: string; ownerUsername?: string; ownerPassword?: string }) => {
      setLoading(true);
      setError(null);
      return api
        .post('/tenants', payload)
        .then((res) => { toast.success('Organização criada com sucesso.'); onSuccess?.(res.data.data?.id, res.data.data?.name); })
        .catch((err) => {
          const msg = err.response?.data?.error ?? 'Falha ao criar organização';
          setError(msg);
          toast.error(msg);
          throw err;
        })
        .finally(() => setLoading(false));
    },
    [onSuccess]
  );

  return { mutate, loading, error };
}
export function useDeleteTenant(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    (id: string) => {
      setLoading(true);
      setError(null);
      return api
        .delete(`/tenants/${id}`)
        .then(() => { toast.success('Organização excluída.'); onSuccess?.(); })
        .catch((err) => {
          const msg = err.response?.data?.error ?? 'Falha ao excluir organização';
          setError(msg);
          toast.error(msg);
          throw err;
        })
        .finally(() => setLoading(false));
    },
    [onSuccess]
  );

  return { mutate, loading, error };
}
