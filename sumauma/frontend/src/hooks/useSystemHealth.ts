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

export interface AttributeMismatch {
  userId: string;
  username: string;
  field: 'name' | 'email' | 'role';
  local: string | null;
  logto: string | null;
}

export interface IdentityOrphan {
  logtoId: string;
  email: string | null;
  name: string | null;
  username?: string;
  organizations?: string[]; // V3
}

export interface IdentityMissing {
  id: string;
  username: string;
  email?: string;
  tenantName?: string;
  authProviderId: string;
}

export interface OrgOrphan {
  logtoId: string;
  name: string;
  description?: string;
}

export interface OrgMissing {
  id: string;
  name: string;
  type: string;
  logtoOrgId?: string;
}

export interface MembershipMismatch {
  userId: string;
  username: string;
  tenantName: string;
  expectedOrgId: string;
  currentOrgs: string[];
}

export interface IdentityAuditReport {
  checkedAt: string;
  summary: {
    total_local: number;
    total_logto: number;
    orphans_count: number;
    missing_count: number;
    orphan_orgs_count: number; // V3
    missing_orgs_count: number; // V3
    membership_mismatch_count: number; // V3
    attribute_mismatch_count: number; // Deep Sync
  };
  orphansInLogto: IdentityOrphan[];
  missingInLogto: IdentityMissing[];
  attributeMismatches: AttributeMismatch[];
  organizations: { // V3
    orphans: OrgOrphan[];
    missing: OrgMissing[];
  };
  membershipMismatches: MembershipMismatch[]; // V3
}

export interface IdentityAuditHistory {
  id: string;
  checkedAt: string;
  summary: any;
  report?: any;
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
}

export type AuditStatus = 'idle' | 'loading' | 'done' | 'error';

export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [apiUsage, setApiUsage] = useState<ApiUsageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditReport, setAuditReport] = useState<IdentityAuditReport | null>(null);
  const [auditStatus, setAuditStatus] = useState<AuditStatus>('idle');
  const [lastAudit, setLastAudit] = useState<IdentityAuditHistory | null>(null);

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

  const runIdentityAudit = useCallback(async () => {
    setAuditStatus('loading');
    try {
      const response = await api.get<IdentityAuditReport>('/system/identity-audit');
      setAuditReport(response.data);
      setAuditStatus('done');
      fetchAuditHistory(); // Atualizar histórico após rodar manual
    } catch {
      setAuditStatus('error');
    }
  }, []);

  const fetchAuditHistory = useCallback(async () => {
    try {
      const response = await api.get<IdentityAuditHistory>('/system/identity-audit/history');
      setLastAudit(response.data);
    } catch (err) {
      console.error('Falha ao obter histórico de auditoria');
    }
  }, []);

  const reprovisionUser = useCallback(async (userId: string) => {
    const response = await api.post(`/system/identity-audit/reprovision/${userId}`);
    // Retirar o usuário do relatório após reprovisionar com sucesso
    setAuditReport(prev =>
      prev
        ? {
            ...prev,
            missingInLogto: prev.missingInLogto.filter(u => u.id !== userId),
            summary: {
              ...prev.summary,
              missing_count: prev.summary.missing_count - 1,
            },
          }
        : null
    );
    return response.data;
  }, []);

  const refresh = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    await Promise.all([
      fetchHealth(), 
      fetchInfo(), 
      fetchJobs(), 
      fetchApiUsage(), 
      fetchSessions(),
      fetchAuditHistory()
    ]);
    setLoading(false);
  }, [fetchHealth, fetchInfo, fetchJobs, fetchApiUsage, fetchSessions, fetchAuditHistory]);

  useEffect(() => {
    refresh(true);
    const interval = setInterval(() => refresh(false), 60000); // Auto-refresh 60s
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    health, info, jobs, sessions, apiUsage, loading, error, refresh, revokeSession,
    auditReport, auditStatus, lastAudit, runIdentityAudit, reprovisionUser,
    deleteLogtoOrphan,
    provisionLocalUser,
    blockLocalUser,
    linkLogtoOrg,
    provisionLogtoOrg,
    deleteLocalUser,
    deleteLocalTenant,
    provisionLocalTenant,
    syncAttributes,
    runBatchAction,
    fixMembership,
  };
}

async function deleteLogtoOrphan(logtoId: string) {
  await api.delete(`/system/identity-audit/orphan/${logtoId}`);
}

async function provisionLocalUser(logtoId: string, data: { tenantId: string; username: string; role?: string; fullName?: string; email?: string }) {
  await api.post(`/system/identity-audit/orphan/${logtoId}/provision-local`, data);
}

async function blockLocalUser(userId: string) {
  await api.patch(`/system/identity-audit/missing/${userId}/block`);
}

async function linkLogtoOrg(tenantId: string, logtoOrgId: string) {
  await api.post(`/system/identity-audit/tenant/${tenantId}/link`, { logtoOrgId });
}

async function provisionLogtoOrg(tenantId: string) {
  await api.post(`/system/identity-audit/tenant/${tenantId}/provision`);
}

async function deleteLocalUser(userId: string) {
  await api.delete(`/system/identity-audit/missing/${userId}`);
}

async function deleteLocalTenant(tenantId: string) {
  await api.delete(`/system/identity-audit/tenant/${tenantId}`);
}

async function provisionLocalTenant(logtoId: string, data: { name: string; type: string }) {
  await api.post(`/system/identity-audit/orphan-org/${logtoId}/provision-local`, data);
}

async function syncAttributes(userId: string, direction: 'TO_LOCAL' | 'TO_LOGTO' = 'TO_LOCAL') {
  await api.post(`/system/identity-audit/sync-attributes/${userId}`, { direction });
}

async function runBatchAction(action: string, targets: string[]) {
  const { data } = await api.post('/system/identity-audit/batch', { action, targets });
  return data;
}

async function fixMembership(userId: string) {
  await api.post(`/system/identity-audit/fix-membership/${userId}`);
}
