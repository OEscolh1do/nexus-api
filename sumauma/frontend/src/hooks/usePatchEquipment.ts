import { useState, useCallback } from 'react';
import api from '@/lib/api';

export function usePatchEquipment(baseEndpoint: string, onSuccess?: () => void) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (id: string, payload: Record<string, any>) => {
      setLoadingId(id);
      setError(null);
      try {
        await api.patch(`${baseEndpoint}/${id}`, payload);
        if (onSuccess) onSuccess();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erro ao atualizar equipamento');
        throw err;
      } finally {
        setLoadingId(null);
      }
    },
    [baseEndpoint, onSuccess]
  );

  return { mutate, loadingId, error, setError };
}
