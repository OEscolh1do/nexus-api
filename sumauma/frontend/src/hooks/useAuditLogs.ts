import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { toast } from '@/stores/toastStore';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  entity: string | null;
  resourceId: string;
  details: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  user: { id: string; username: string; fullName: string } | null;
  tenant: { id: string; name: string } | null;
}

export interface AuditLogsParams {
  limit?: number;
  cursor?: string | null;
  tenantId?: string;
  userId?: string;
  action?: string;
  entity?: string;
  resourceId?: string;
  dateFrom?: string;
  dateTo?: string;
  q?: string;
}

export interface Pagination {
  total: number;
  nextCursor: string | null;
  limit: number;
}

export function useAuditLogs(params: AuditLogsParams) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const isExportingRef = useRef(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/audit-logs', { params });
      setLogs(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const msg = axiosErr.response?.data?.error || 'Erro ao carregar logs';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  // Normalize null/undefined cursor so JSON.stringify produces a stable key
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ ...params, cursor: params.cursor ?? undefined })]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const exportLogs = useCallback(async () => {
    if (isExportingRef.current) return;
    isExportingRef.current = true;
    setIsExporting(true);
    try {
      const response = await api.get('/audit-logs/export', {
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'audit-logs.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Exportação concluída — audit-logs.csv');
    } catch {
      toast.error('Falha ao exportar logs de auditoria');
    } finally {
      isExportingRef.current = false;
      setIsExporting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return { logs, pagination, loading, error, isExporting, refetch: fetchLogs, exportLogs };
}
