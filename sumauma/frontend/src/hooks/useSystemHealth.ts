import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'error';
  latencyMs: number;
  error?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  services: ServiceStatus[];
  checkedAt: string;
}

export interface SystemInfo {
  version: string;
  nodeVersion: string;
  platform: string;
  uptimeSeconds: number;
  envStatus: { name: string; present: boolean }[];
}

export interface CronJob {
  id: string;
  lockedAt: string;
  expiresAt: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    tenant: { id: string; name: string };
  } | null;
}

export interface ApiUsageInfo {
  id: string;
  name: string;
  apiPlan: string;
  apiMonthlyQuota: number;
  apiCurrentUsage: number;
}

export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [apiUsage, setApiUsage] = useState<ApiUsageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await api.get('/system/health');
      setHealth(response.data);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 503) {
        setHealth(err.response.data);
      } else {
        setError('Falha ao obter status de saúde do sistema');
      }
    }
  }, []);

  const fetchInfo = useCallback(async () => {
    try {
      const response = await api.get('/system/info');
      setInfo(response.data);
    } catch (err) {
      console.error('Falha ao obter informações do sistema');
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await api.get('/system/jobs');
      setJobs(response.data.data);
    } catch (err) {
      console.error('Falha ao obter jobs');
    }
  }, []);

  const fetchApiUsage = useCallback(async () => {
    try {
      const response = await api.get('/system/api-usage');
      setApiUsage(response.data.data);
    } catch (err) {
      console.error('Falha ao obter api usage');
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await api.get('/system/sessions');
      setSessions(response.data.data);
    } catch (err) {
      console.error('Falha ao obter sessões');
    }
  }, []);

  const revokeSession = useCallback(async (id: string) => {
    try {
      await api.delete(`/system/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Erro ao revogar sessão');
      throw err;
    }
  }, []);

  const refresh = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    await Promise.all([fetchHealth(), fetchInfo(), fetchJobs(), fetchApiUsage(), fetchSessions()]);
    setLoading(false);
  }, [fetchHealth, fetchInfo, fetchJobs, fetchApiUsage, fetchSessions]);

  useEffect(() => {
    refresh(true);
    const interval = setInterval(() => refresh(false), 60000); // Auto-refresh 60s
    return () => clearInterval(interval);
  }, [refresh]);

  return { health, info, jobs, sessions, apiUsage, loading, error, refresh, revokeSession };
}
