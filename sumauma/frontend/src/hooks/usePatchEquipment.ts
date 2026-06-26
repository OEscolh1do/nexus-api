import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from '@/stores/toastStore';

export function usePatchEquipment(baseEndpoint: string, onSuccess?: () => void) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (id: string, payload: Record<string, unknown>) => {
      setLoadingId(id);
      setError(null);
      try {
        await api.patch(`${baseEndpoint}/${id}`, payload);
        toast.success('Equipamento atualizado com sucesso.');
        if (onSuccess) onSuccess();
      } catch (err) {
        const e = err as { response?: { data?: { error?: string } } };
        const msg = e.response?.data?.error || 'Erro ao atualizar equipamento';
        setError(msg);
        toast.error(msg);
        throw err;
      } finally {
        setLoadingId(null);
      }
    },
    [baseEndpoint, onSuccess]
  );

  return { mutate, loadingId, error, setError };
}
