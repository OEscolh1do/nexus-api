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

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchHealth(), fetchInfo(), fetchJobs(), fetchApiUsage()]);
    setLoading(false);
  }, [fetchHealth, fetchInfo, fetchJobs, fetchApiUsage]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000); // Auto-refresh everything 60s
    return () => clearInterval(interval);
  }, [refresh]);

  return { health, info, jobs, apiUsage, loading, error, refresh };
}
