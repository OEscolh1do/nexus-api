import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  entity: string | null;
  resourceId: string;
  details: string | null;
  before: any;
  after: any;
  ipAddress: string | null;
  userAgent: string | null;
  user: { id: string; username: string; fullName: string };
  tenant: { id: string; name: string };
}

export interface AuditLogsParams {
  limit?: number;
  cursor?: string | null;
  tenantId?: string;
  userId?: string;
  action?: string;
  entity?: string;
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

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/audit-logs', { params });
      setLogs(response.data.data);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const exportLogs = async () => {
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
    } catch (err) {
      console.error('Erro ao exportar logs:', err);
    }
  };

  return { logs, pagination, loading, error, refetch: fetchLogs, exportLogs };
}
