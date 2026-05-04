import { useMemo } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import { Permission } from './usePermissions';

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission: Permission;
}

export interface Role {
  id: string;
  name: string;
  level: 'PLATFORM' | 'TENANT';
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
  permissions: RolePermission[];
  _count?: {
    users: number;
  };
  tenant?: {
    id: string;
    name: string;
  } | null;
}

interface RolesResponse {
  data: Role[];
}

interface UseRolesParams {
  tenantId?: string;
  level?: string;
}

const fetcher = (url: string) => api.get(url).then(res => res.data);

export function useRoles(params?: UseRolesParams) {
  const query = new URLSearchParams();
  if (params?.tenantId) query.set('tenantId', params.tenantId);
  if (params?.level) query.set('level', params.level);

  const qs = query.toString() ? `?${query.toString()}` : '';

  const { data, error, isLoading, mutate } = useSWR<RolesResponse>(
    `/roles${qs}`,
    fetcher
  );

  const roles = useMemo(() => data?.data || [], [data?.data]);

  return {
    roles,
    loading: isLoading,
    error: error?.response?.data?.error || error?.message,
    refetch: mutate,
  };
}
