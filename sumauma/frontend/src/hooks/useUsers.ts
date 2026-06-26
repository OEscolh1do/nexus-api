import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserTenant {
  id: string;
  name: string;
  type?: 'MASTER' | 'INDIVIDUAL' | 'CORPORATE';
  apiPlan?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  timestamp: string;
}

export interface User {
  id: string;
  username: string;
  email: string | null;
  fullName: string | null;
  role: string;
  jobTitle: string | null;
  tenantId: string;
  orgUnitId?: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  authProviderId?: string | null;
  status: string;
  tenant: UserTenant;
}

export interface UserDetail extends User {
  auditLogs: AuditLog[];
}

export interface UsersListParams {
  page?: number;
  limit?: number;
  tenantId?: string;
  tenantType?: string;
  role?: string;
  q?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── useUsers (List) ─────────────────────────────────────────────────────────

export function useUsers(params: UsersListParams) {
  const [data, setData] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get('/users', { params })
      .then((res) => {
        setData(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch((err) => {
        const msg = err.response?.data?.error ?? 'Falha ao carregar usuários';
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

// ─── useUser (Detail) ────────────────────────────────────────────────────────

export function useUser(id: string | null) {
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api
      .get(`/users/${id}`)
      .then((res) => setData(res.data.data))
      .catch((err) => {
        const msg = err.response?.data?.error ?? 'Falha ao carregar usuário';
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

export function usePatchUser(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    (id: string, payload: Record<string, unknown>) => {
      setLoading(true);
      setError(null);
      return api
        .patch(`/users/${id}`, payload)
        .then(() => { toast.success('Usuário atualizado com sucesso.'); onSuccess?.(); })
        .catch((err) => {
          const msg = err.response?.data?.error ?? 'Falha ao atualizar usuário';
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

export function useBlockUser(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    (id: string) => {
      setLoading(true);
      setError(null);
      return api
        .post(`/users/${id}/block`)
        .then(() => { toast.success('Usuário bloqueado.'); onSuccess?.(); })
        .catch((err) => {
          const msg = err.response?.data?.error ?? 'Falha ao bloquear usuário';
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

export function useUnblockUser(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    (id: string) => {
      setLoading(true);
      setError(null);
      return api
        .post(`/users/${id}/unblock`)
        .then(() => { toast.success('Usuário desbloqueado.'); onSuccess?.(); })
        .catch((err) => {
          const msg = err.response?.data?.error ?? 'Falha ao desbloquear usuário';
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

export function useResetPassword(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const mutate = useCallback(
    (id: string) => {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      return api
        .post(`/users/${id}/reset-password`)
        .then((res) => {
          setSuccessMsg(res.data.message);
          toast.success('Senha redefinida com sucesso.');
          onSuccess?.();
        })
        .catch((err) => {
          const msg = err.response?.data?.error ?? 'Falha ao redefinir senha';
          setError(msg);
          toast.error(msg);
          throw err;
        })
        .finally(() => setLoading(false));
    },
    [onSuccess]
  );

  return { mutate, loading, error, successMsg };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function useCreateUser(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    (payload: {
      type: 'INDIVIDUAL' | 'CORPORATE';
      username: string;
      email: string;
      password: string;
      fullName: string;
      role?: string;
      tenantId?: string;
      orgName?: string;
      jobTitle?: string;
    }) => {
      setLoading(true);
      setError(null);
      return api
        .post('/users', payload)
        .then(() => { toast.success('Usuário criado com sucesso.'); onSuccess?.(); })
        .catch((err) => {
          const msg = err.response?.data?.error ?? 'Falha ao criar usuário';
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

export function useIsSelf(targetUserId: string | null | undefined) {
  const authId = useAuthStore((s) => s.operator?.id);
  return targetUserId === authId;
}
export function useDeleteUser(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    (id: string) => {
      setLoading(true);
      setError(null);
      return api
        .delete(`/users/${id}`)
        .then(() => { toast.success('Usuário excluído.'); onSuccess?.(); })
        .catch((err) => {
          const msg = err.response?.data?.error ?? 'Falha ao excluir usuário';
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
