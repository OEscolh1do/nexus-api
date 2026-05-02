import useSWR from 'swr';
import api from '@/lib/api';

export interface Permission {
  id: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionsResponse {
  data: Permission[];
  grouped: Record<string, Permission[]>;
}

const fetcher = (url: string) => api.get(url).then(res => res.data);

export function usePermissions() {
  const { data, error, isLoading, mutate } = useSWR<PermissionsResponse>(
    '/permissions',
    fetcher,
    {
      revalidateOnFocus: false, // Permissões raramente mudam
    }
  );

  return {
    permissions: data?.data || [],
    groupedPermissions: data?.grouped || {},
    loading: isLoading,
    error: error?.response?.data?.error || error?.message,
    refetch: mutate,
  };
}
