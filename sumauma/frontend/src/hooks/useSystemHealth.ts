import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from '@/stores/toastStore';

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
  summary: IdentityAuditReport['summary'];
  report?: IdentityAuditReport;
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditReport, setAuditReport] = useState<IdentityAuditReport | null>(null);
  const [auditStatus, setAuditStatus] = useState<AuditStatus>('idle');
  const [lastAudit, setLastAudit] = useState<IdentityAuditHistory | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await api.get('/system/health');
      setHealth(response.data);
      setError(null);
    } catch (err) {
      const e = err as { response?: { status?: number; data?: SystemHealth } };
      if (e.response?.status === 503) {
        setHealth(e.response.data ?? null);
      } else {
        const msg = 'Falha ao obter status de saúde do sistema';
        setError(msg);
        toast.error(msg);
      }
    }
  }, []);

  const fetchInfo = useCallback(async () => {
    try {
      const response = await api.get('/system/info');
      setInfo(response.data);
    } catch {
      // Non-critical — SystemPage shows N/A for missing fields
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await api.get('/system/jobs');
      setJobs(response.data.data);
    } catch {
      // Non-critical — CronJobsTable renders with empty list
    }
  }, []);

  const fetchApiUsage = useCallback(async () => {
    try {
      const response = await api.get('/system/api-usage');
      setApiUsage(response.data.data);
    } catch {
      // Non-critical — ApiUsageTable renders with empty list
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await api.get('/system/sessions');
      setSessions(response.data.data);
    } catch {
      // Non-critical — SessionsTable renders with empty list
    }
  }, []);

  const revokeSession = useCallback(async (id: string) => {
    try {
      await api.delete(`/system/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success('Sessão revogada com sucesso.');
    } catch (err) {
      toast.error('Falha ao revogar sessão.');
      throw err;
    }
  }, []);

  const fetchAuditHistory = useCallback(async () => {
    try {
      const response = await api.get<IdentityAuditHistory>('/system/identity-audit/history');
      setLastAudit(response.data);
    } catch {
      // Non-critical — history panel stays empty if unavailable
    }
  }, []);

  const runIdentityAudit = useCallback(async () => {
    setAuditStatus('loading');
    try {
      const response = await api.get<IdentityAuditReport>('/system/identity-audit');
      setAuditReport(response.data);
      setAuditStatus('done');
      fetchAuditHistory();
    } catch {
      setAuditStatus('error');
      toast.error('Falha ao executar auditoria de identidade.');
    }
  }, [fetchAuditHistory]);

  const reprovisionUser = useCallback(async (userId: string) => {
    try {
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
      toast.success('Usuário reprovisionado com sucesso.');
      return response.data;
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error ?? 'Falha ao reprovisionar usuário.');
      throw err;
    }
  }, []);

  const refresh = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    const fetches: Promise<void>[] = [
      fetchHealth(),
      fetchInfo(),
      fetchJobs(),
      fetchApiUsage(),
      fetchSessions(),
    ];
    // Audit history is heavy — only fetch on initial load, not on 60s auto-refresh
    if (isInitial) fetches.push(fetchAuditHistory());
    await Promise.all(fetches);
    setLoading(false);
    setRefreshing(false);
  }, [fetchHealth, fetchInfo, fetchJobs, fetchApiUsage, fetchSessions, fetchAuditHistory]);

  useEffect(() => {
    refresh(true);
    const interval = setInterval(() => refresh(false), 60000); // Auto-refresh 60s
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    health, info, jobs, sessions, apiUsage, loading, refreshing, error, refresh, revokeSession,
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

function wrapAction<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  errorMsg: string
): (...args: TArgs) => Promise<TReturn> {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error ?? errorMsg);
      throw err;
    }
  };
}

async function _deleteLogtoOrphan(logtoId: string) {
  await api.delete(`/system/identity-audit/orphan/${logtoId}`);
}

async function _provisionLocalUser(logtoId: string, data: { tenantId: string; username: string; role?: string; fullName?: string; email?: string }) {
  await api.post(`/system/identity-audit/orphan/${logtoId}/provision-local`, data);
}

async function _blockLocalUser(userId: string) {
  await api.patch(`/system/identity-audit/missing/${userId}/block`);
}

async function _linkLogtoOrg(tenantId: string, logtoOrgId: string) {
  await api.post(`/system/identity-audit/tenant/${tenantId}/link`, { logtoOrgId });
}

async function _provisionLogtoOrg(tenantId: string) {
  await api.post(`/system/identity-audit/tenant/${tenantId}/provision`);
}

async function _deleteLocalUser(userId: string) {
  await api.delete(`/system/identity-audit/missing/${userId}`);
}

async function _deleteLocalTenant(tenantId: string) {
  await api.delete(`/system/identity-audit/tenant/${tenantId}`);
}

async function _provisionLocalTenant(logtoId: string, data: { name: string; type: string }) {
  await api.post(`/system/identity-audit/orphan-org/${logtoId}/provision-local`, data);
}

async function _syncAttributes(userId: string, direction: 'TO_LOCAL' | 'TO_LOGTO' = 'TO_LOCAL') {
  await api.post(`/system/identity-audit/sync-attributes/${userId}`, { direction });
}

async function _runBatchAction(action: string, targets: string[]) {
  const { data } = await api.post('/system/identity-audit/batch', { action, targets });
  return data;
}

async function _fixMembership(userId: string) {
  await api.post(`/system/identity-audit/fix-membership/${userId}`);
}

const deleteLogtoOrphan   = wrapAction(_deleteLogtoOrphan,   'Falha ao remover usuário do Logto.');
const provisionLocalUser  = wrapAction(_provisionLocalUser,  'Falha ao provisionar usuário local.');
const blockLocalUser      = wrapAction(_blockLocalUser,      'Falha ao bloquear usuário local.');
const linkLogtoOrg        = wrapAction(_linkLogtoOrg,        'Falha ao vincular organização.');
const provisionLogtoOrg   = wrapAction(_provisionLogtoOrg,   'Falha ao provisionar organização no Logto.');
const deleteLocalUser     = wrapAction(_deleteLocalUser,     'Falha ao excluir usuário local.');
const deleteLocalTenant   = wrapAction(_deleteLocalTenant,   'Falha ao excluir tenant local.');
const provisionLocalTenant = wrapAction(_provisionLocalTenant, 'Falha ao provisionar tenant local.');
const syncAttributes      = wrapAction(_syncAttributes,      'Falha ao sincronizar atributos.');
const runBatchAction      = wrapAction(_runBatchAction,      'Falha ao executar ação em lote.');
const fixMembership       = wrapAction(_fixMembership,       'Falha ao corrigir membership.');
