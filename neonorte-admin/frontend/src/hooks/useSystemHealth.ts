import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

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

export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await axios.get('/admin/system/health');
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
      const response = await axios.get('/admin/system/info');
      setInfo(response.data);
    } catch (err) {
      console.error('Falha ao obter informações do sistema');
    }
  }, []);

  const refresh = async () => {
    setLoading(true);
    await Promise.all([fetchHealth(), fetchInfo()]);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(fetchHealth, 60000); // Auto-refresh 60s
    return () => clearInterval(interval);
  }, [fetchHealth, fetchInfo]);

  return { health, info, loading, error, refresh };
}
