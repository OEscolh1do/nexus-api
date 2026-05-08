import { AlertTriangle, CheckCircle2, GitCompare, Loader2, RefreshCw, ShieldAlert, User, UserMinus, UserPlus, Trash2, Building2, Link2, ExternalLink, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import type {
  AuditStatus,
  IdentityAuditReport,
  IdentityMissing,
  IdentityOrphan,
  OrgOrphan,
  OrgMissing,
  MembershipMismatch,
  AttributeMismatch,
  IdentityAuditHistory,
} from '@/hooks/useSystemHealth';
import * as Dialog from '@radix-ui/react-dialog';
import { useTenantOptions } from '@/hooks/useTenants';

// ─── KPI Card compacto ──────────────────────────────────────────────────────
function AuditKpiCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'muted' | 'success' | 'danger' | 'warning';
}) {
  const colorMap = {
    muted:   'text-slate-300',
    success: 'text-emerald-400',
    danger:  'text-red-400',
    warning: 'text-amber-400',
  };
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-sm px-4 py-3 flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{label}</span>
      <span className={`text-2xl font-mono tabular-nums font-bold ${colorMap[color]}`}>{value}</span>
    </div>
  );
}

// ─── Linha da tabela de Orphans + Ações ──────────────────────────────────────
function OrphanRow({ 
  orphan, 
  onDelete, 
  onProvision 
}: { 
  orphan: IdentityOrphan;
  onDelete: (logtoId: string) => Promise<void>;
  onProvision: (logtoId: string, data: any) => Promise<void>;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [done, setDone] = useState(false);

  // Form para Provisionamento Local
  const { data: tenants = [] } = useTenantOptions();
  const [formData, setFormData] = useState({
    tenantId: '',
    username: orphan.username || orphan.email?.split('@')[0] || '',
    role: 'USER',
    fullName: orphan.name || '',
    email: orphan.email || '',
  });

  const handleDelete = async () => {
    if (confirmText !== (orphan.email || orphan.logtoId)) return;
    setLoading(true);
    try {
      await onDelete(orphan.logtoId);
      setDone(true);
    } finally {
      setLoading(false);
      setDeleteOpen(false);
    }
  };

  const handleProvision = async () => {
    setLoading(true);
    try {
      await onProvision(orphan.logtoId, formData);
      setDone(true);
    } finally {
      setLoading(false);
      setProvisionOpen(false);
    }
  };

  if (done) return null;

  return (
    <>
      <tr className="border-b border-slate-800 hover:bg-slate-800/40">
        <td className="px-3 py-2 font-mono text-[11px] text-slate-400 truncate max-w-[150px]">{orphan.logtoId}</td>
        <td className="px-3 py-2 text-[11px] text-slate-300">{orphan.email ?? '—'}</td>
        <td className="px-3 py-2 text-[11px] text-slate-300">
          <div className="flex flex-col">
            <span>{orphan.name ?? orphan.username ?? '—'}</span>
            {orphan.organizations && orphan.organizations.length > 0 && (
              <span className="text-[10px] text-slate-500 italic">
                Org: {orphan.organizations.join(', ')}
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setProvisionOpen(true)}
              className="h-7 px-2 text-[10px] font-medium rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
            >
              <UserPlus className="h-3 w-3" />
              Criar Local
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="h-7 px-2 text-[10px] font-medium rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Remover do Logto
            </button>
          </div>
        </td>
      </tr>

      {/* Dialog: Remover do Logto */}
      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
          <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-slate-900 border border-slate-700 rounded-sm shadow-xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="h-5 w-5" />
              <Dialog.Title className="text-sm font-semibold">Remover Usuário do Logto</Dialog.Title>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Esta ação é <span className="text-red-400 font-bold uppercase tracking-wider">permanente</span>. 
              O usuário perderá acesso total à plataforma imediatamente.
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase text-slate-500 font-bold">Digite <span className="text-slate-300 select-all font-mono">{orphan.email || orphan.logtoId}</span> para confirmar:</label>
              <input 
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-red-500/50"
                placeholder="Confirme o identificador"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button className="h-8 px-4 text-xs rounded-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700">Cancelar</button>
              </Dialog.Close>
              <button
                onClick={handleDelete}
                disabled={loading || confirmText !== (orphan.email || orphan.logtoId)}
                className="h-8 px-4 text-xs rounded-sm bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 disabled:opacity-30 transition-colors flex items-center gap-2"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Remover permanentemente
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog: Criar Localmente */}
      <Dialog.Root open={provisionOpen} onOpenChange={setProvisionOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
          <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-slate-900 border border-slate-700 rounded-sm shadow-xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <UserPlus className="h-5 w-5" />
              <Dialog.Title className="text-sm font-semibold">Provisionamento Local</Dialog.Title>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase text-slate-500 font-bold">Username</label>
                <input 
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase text-slate-500 font-bold">Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50 appearance-none"
                >
                  <option value="USER">Usuário (Padrão)</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="PLATFORM_ADMIN">Plataforma Admin</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase text-slate-500 font-bold">Tenant Destino</label>
              <select 
                value={formData.tenantId}
                onChange={(e) => setFormData(prev => ({ ...prev, tenantId: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50 appearance-none"
              >
                <option value="">Selecione um tenant...</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button className="h-8 px-4 text-xs rounded-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700">Cancelar</button>
              </Dialog.Close>
              <button
                onClick={handleProvision}
                disabled={loading || !formData.tenantId || !formData.username}
                className="h-8 px-4 text-xs rounded-sm bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-30 transition-colors flex items-center gap-2"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Criar Registro Local
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

// ─── Linha de Org Órfã no Logto ─────────────────────────────────────────────
function OrgOrphanRow({ 
  org, 
  onLink,
  onProvision
}: { 
  org: OrgOrphan; 
  onLink: (tenantId: string, logtoId: string) => Promise<void>;
  onProvision: (logtoId: string, data: { name: string; type: string }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [done, setDone] = useState(false);
  const { data: tenants = [] } = useTenantOptions();

  const handleLink = async () => {
    setLoading(true);
    try {
      await onLink(selectedTenantId, org.logtoId);
      setDone(true);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const handleProvisionLocal = async () => {
    if (!confirm(`Deseja criar um Tenant local chamado "${org.name}" vinculado a esta organização?`)) return;
    setLoading(true);
    try {
      await onProvision(org.logtoId, { name: org.name, type: 'CORPORATE' });
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) return null;

  return (
    <>
      <tr className="border-b border-slate-800 hover:bg-slate-800/40">
        <td className="px-3 py-2 text-[11px] text-slate-300 font-medium">{org.name}</td>
        <td className="px-3 py-2 font-mono text-[10px] text-slate-500">{org.logtoId}</td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleProvisionLocal}
              disabled={loading}
              className="h-7 px-3 text-[10px] font-medium rounded-sm bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlusCircle className="h-3 w-3" />}
              Provisionar Local
            </button>
            <button
              onClick={() => setOpen(true)}
              disabled={loading}
              className="h-7 px-3 text-[10px] font-medium rounded-sm bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <Link2 className="h-3 w-3" />
              Vincular Existente
            </button>
          </div>
        </td>
      </tr>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
          <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-slate-900 border border-slate-700 rounded-sm shadow-xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sky-400">
              <Link2 className="h-5 w-5" />
              <Dialog.Title className="text-sm font-semibold">Vincular Organização</Dialog.Title>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Vincule a organização <span className="text-slate-200">{org.name}</span> do Logto a um Tenant local.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase text-slate-500 font-bold">Tenant Local</label>
              <select 
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500/50"
              >
                <option value="">Selecione um tenant...</option>
                {tenants.filter(t => !t.status || t.status !== 'BLOCKED').map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button className="h-8 px-4 text-xs rounded-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700">Cancelar</button>
              </Dialog.Close>
              <button
                onClick={handleLink}
                disabled={loading || !selectedTenantId}
                className="h-8 px-4 text-xs rounded-sm bg-sky-500/20 border border-sky-500/40 text-sky-300 hover:bg-sky-500/30 disabled:opacity-30 transition-colors flex items-center gap-2"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Vincular
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

// ─── Linha de Org Ausente no Logto ──────────────────────────────────────────
function OrgMissingRow({ 
  org, 
  onProvision,
  onDelete
}: { 
  org: OrgMissing; 
  onProvision: (tenantId: string) => Promise<void>; 
  onDelete: (tenantId: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleProvision = async () => {
    setLoading(true);
    try {
      await onProvision(org.id);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`ATENÇÃO: Deseja EXCLUIR PERMANENTEMENTE o tenant ${org.name}? Esta ação apagará todos os usuários e dados vinculados localmente.`)) return;
    setLoading(true);
    try {
      await onDelete(org.id);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) return null;

  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/40">
      <td className="px-3 py-2 text-[11px] text-slate-300 font-medium">{org.name}</td>
      <td className="px-3 py-2 text-[10px] text-slate-500 uppercase">{org.type}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleProvision}
            disabled={loading}
            className="h-7 px-3 text-[10px] font-medium rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
            Criar no Logto
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="h-7 px-3 text-[10px] font-medium rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
            Excluir Local
          </button>
        </div>
      </td>
    </tr>
  );
}

function AttributeMismatchRow({ 
  mismatch, 
  onSync 
}: { 
  mismatch: AttributeMismatch; 
  onSync: (userId: string, direction?: 'TO_LOCAL' | 'TO_LOGTO') => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      await onSync(mismatch.userId, 'TO_LOCAL');
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) return null;

  const fieldLabels: Record<'name' | 'email' | 'role', string> = {
    name: 'Nome Completo',
    email: 'E-mail',
    role: 'Papel (Role)'
  };

  return (
    <tr className="border-b border-slate-800/50 hover:bg-slate-800/20">
      <td className="px-4 py-2 font-medium text-slate-300">{mismatch.username}</td>
      <td className="px-4 py-2">
        <span className="px-1.5 py-0.5 rounded-sm bg-slate-800 text-slate-400 text-[9px] font-bold uppercase border border-slate-700">
          {fieldLabels[mismatch.field]}
        </span>
      </td>
      <td className="px-4 py-2 text-red-400/80 italic truncate max-w-[150px]" title={mismatch.local || ''}>
        {mismatch.local || '(Vazio)'}
      </td>
      <td className="px-4 py-2 text-emerald-400 font-medium truncate max-w-[150px]" title={mismatch.logto || ''}>
        {mismatch.logto || '(Vazio)'}
      </td>
      <td className="px-4 py-2 text-right">
        <button
          onClick={handleSync}
          disabled={loading}
          className="h-7 px-2 text-[10px] font-medium rounded-sm bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Sincronizar Local
        </button>
      </td>
    </tr>
  );
}

// ─── Linha de Erro de Membership ─────────────────────────────────────────────
function MembershipMismatchRow({ mismatch }: { mismatch: MembershipMismatch }) {
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/40">
      <td className="px-3 py-2 text-[11px] text-slate-300 font-medium">{mismatch.username}</td>
      <td className="px-3 py-2 text-[11px] text-slate-400">{mismatch.tenantName}</td>
      <td className="px-3 py-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-red-400 font-medium">Fora da Org Logto</span>
          <span className="text-[9px] text-slate-500 truncate max-w-[150px]">Atualmente em: {mismatch.currentOrgs.join(', ') || '(Nenhuma)'}</span>
        </div>
      </td>
      <td className="px-3 py-2">
        <span className="text-[10px] text-slate-500">Correção manual via Console</span>
      </td>
    </tr>
  );
}

// ─── Linha de Usuário Ausente no Logto ───────────────────────────────────────
function MissingUserRow({ 
  user,
  onReprovision, 
  onBlock,
  onDelete
}: { 
  user: IdentityMissing; 
  onReprovision: (userId: string) => Promise<void>; 
  onBlock: (userId: string) => Promise<void>; 
  onDelete: (userId: string) => Promise<void>; 
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReprovision = async () => {
    setLoading(true);
    try {
      await onReprovision(user.id);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!confirm(`Deseja bloquear o acesso local de ${user.username}? Isso resolverá a discrepância.`)) return;
    setLoading(true);
    try {
      await onBlock(user.id);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`ATENÇÃO: Deseja EXCLUIR PERMANENTEMENTE ${user.username} do banco local? Esta ação não pode ser desfeita.`)) return;
    setLoading(true);
    try {
      await onDelete(user.id);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) return null;

  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/40">
      <td className="px-3 py-2 text-[11px] text-slate-300 font-medium">{user.username}</td>
      <td className="px-3 py-2 text-[11px] text-slate-400">{user.email}</td>
      <td className="px-3 py-2 text-[11px] text-slate-500">{user.tenantName}</td>
      <td className="px-3 py-2 font-mono text-[10px] text-slate-600">{user.authProviderId || '—'}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleReprovision}
            disabled={loading}
            className="h-7 px-3 text-[10px] font-medium rounded-sm bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Reprovisionar IdP
          </button>
          <button
            onClick={handleBlock}
            disabled={loading}
            className="h-7 px-2 text-[10px] font-medium rounded-sm bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <UserMinus className="h-3 w-3" />
            Bloquear
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="h-7 px-2 text-[10px] font-medium rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
            Excluir
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────
interface IdentityAuditTabProps {
  report: IdentityAuditReport | null;
  status: AuditStatus;
  onRunAudit: () => Promise<void>;
  onReprovision: (userId: string) => Promise<void>;
  onDeleteOrphan: (logtoId: string) => Promise<void>;
  onProvisionLocal: (logtoId: string, data: any) => Promise<void>;
  onBlockLocal: (userId: string) => Promise<void>;
  onDeleteLocal: (userId: string) => Promise<void>;
  onDeleteTenant: (tenantId: string) => Promise<void>;
  onProvisionLocalTenant: (logtoId: string, data: { name: string; type: string }) => Promise<void>;
  onSyncAttributes: (userId: string, direction?: 'TO_LOCAL' | 'TO_LOGTO') => Promise<void>;
  onBatchAction: (action: string, targets: string[]) => Promise<any>;
  onLinkOrg: (tenantId: string, logtoId: string) => Promise<void>;
  onProvisionOrg: (tenantId: string) => Promise<void>;
  lastAudit?: IdentityAuditHistory | null;
}

export default function IdentityAuditTab({
  report,
  status,
  onRunAudit,
  onReprovision,
  onDeleteOrphan,
  onProvisionLocal,
  onBlockLocal,
  onDeleteLocal,
  onDeleteTenant,
  onProvisionLocalTenant,
  onSyncAttributes,
  onBatchAction,
  onLinkOrg,
  onProvisionOrg,
  lastAudit,
}: IdentityAuditTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'orgs'>('users');
  const [batchLoading, setBatchLoading] = useState(false);
  const isLoading = status === 'loading' || batchLoading;

  const allSynced = status === 'done' && 
    report?.summary.orphans_count === 0 && 
    report?.summary.missing_count === 0 &&
    report?.summary.orphan_orgs_count === 0 &&
    report?.summary.missing_orgs_count === 0 &&
    report?.summary.membership_mismatch_count === 0 &&
    report?.summary.attribute_mismatch_count === 0;

  return (
    <div className="flex flex-col gap-6">

      {/* Header & Global Action */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <GitCompare className="h-4 w-4 text-slate-500" />
            Integridade de Identidade
          </h2>
          <div className="flex items-center gap-3">
            <p className="text-[11px] text-slate-500">
              Reconciliação bidirecional entre o Logto e o banco de dados local (db_sumauma).
            </p>
            {lastAudit && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-full">
                <div className={`h-1 w-1 rounded-full ${lastAudit.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">
                  Auto-Audit: {new Date(lastAudit.checkedAt).toLocaleDateString()} {new Date(lastAudit.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          id="run-identity-audit-btn"
          onClick={onRunAudit}
          disabled={isLoading}
          className="flex items-center gap-2 h-9 px-4 text-xs font-medium bg-slate-800 border border-slate-700 rounded-sm text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {isLoading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <RefreshCw className="h-3.5 w-3.5" />}
          {status === 'idle' ? 'Executar Auditoria' : 'Executar Novamente'}
        </button>
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex items-center gap-2 bg-slate-900/50 p-1 border border-slate-800 rounded-sm w-fit">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all ${
            activeSubTab === 'users' 
              ? 'bg-slate-800 text-sky-400 shadow-sm' 
              : 'text-slate-500 hover:text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <User className="h-3 w-3" />
            Usuários
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab('orgs')}
          title="Gestão da estrutura de Tenants e associações de grupo (Membership)"
          className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all ${
            activeSubTab === 'orgs' 
              ? 'bg-slate-800 text-sky-400 shadow-sm' 
              : 'text-slate-500 hover:text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-3 w-3" />
            Organizações
          </div>
        </button>
      </div>

      <p className="text-[11px] text-slate-500 -mt-2 italic">
        {activeSubTab === 'users' 
          ? "Foco em identidades individuais: resolva discrepâncias de quem pode acessar o sistema." 
          : "Foco em estrutura e permissões: garanta que os Tenants e grupos estejam sincronizados."}
      </p>

      {/* Estado inicial */}
      {status === 'idle' && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 border border-dashed border-slate-800 rounded-sm">
          <GitCompare className="h-8 w-8 text-slate-700" />
          <p className="text-sm text-slate-500">Nenhuma auditoria executada ainda.</p>
          <button 
            onClick={onRunAudit}
            className="text-xs text-sky-500 hover:underline"
          >
            Clique aqui para começar
          </button>
        </div>
      )}

      {/* Loading */}
      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 text-slate-500 animate-spin" />
          <p className="text-sm text-slate-500">Sincronizando contextos...</p>
        </div>
      )}

      {/* Erro */}
      {status === 'error' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-sm text-red-400 text-xs">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Falha ao executar a auditoria. Verifique a conexão com o Logto.
        </div>
      )}

      {/* Resultados Contextualizados */}
      {status === 'done' && report && (
        <div className="flex flex-col gap-6">

          {/* KPIs da Sub-aba Ativa */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {activeSubTab === 'users' ? (
              <>
                <AuditKpiCard label="Total Local" value={report.summary.total_local} color="muted" />
                <AuditKpiCard label="Atributos Divergentes" value={report.summary.attribute_mismatch_count} color={report.summary.attribute_mismatch_count > 0 ? 'warning' : 'success'} />
                <AuditKpiCard label="Órfãos no Logto" value={report.summary.orphans_count} color={report.summary.orphans_count > 0 ? 'danger' : 'success'} />
                <AuditKpiCard label="Ausentes no IdP" value={report.summary.missing_count} color={report.summary.missing_count > 0 ? 'warning' : 'success'} />
              </>
            ) : (
              <>
                <AuditKpiCard label="Órfãos no Logto" value={report.summary.orphan_orgs_count} color={report.summary.orphan_orgs_count > 0 ? 'danger' : 'success'} />
                <AuditKpiCard label="Tenants sem Org" value={report.summary.missing_orgs_count} color={report.summary.missing_orgs_count > 0 ? 'warning' : 'success'} />
                <AuditKpiCard label="Erros Membership" value={report.summary.membership_mismatch_count} color={report.summary.membership_mismatch_count > 0 ? 'warning' : 'success'} />
                <AuditKpiCard label="Status Estrutura" value={100} color="success" />
              </>
            )}
          </div>

          {/* Visão de Usuários */}
          {activeSubTab === 'users' && (
            <div className="space-y-6">
              {/* Divergências de Atributos */}
              {report.attributeMismatches.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
                  <div className="px-4 py-2 bg-sky-500/5 border-b border-slate-800 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <GitCompare className="h-3.5 w-3.5 text-sky-400" />
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Divergência de Atributos</h4>
                      </div>
                      {report.attributeMismatches.length > 1 && (
                        <button
                          onClick={async () => {
                            if (!confirm(`Sincronizar todos os ${report.attributeMismatches.length} atributos divergentes a partir do Logto?`)) return;
                            setBatchLoading(true);
                            try {
                              const targets = [...new Set(report.attributeMismatches.map(m => m.userId))];
                              await onBatchAction('SYNC_ATTRIBUTES', targets);
                              onRunAudit();
                            } finally {
                              setBatchLoading(false);
                            }
                          }}
                          disabled={isLoading}
                          className="h-6 px-2 text-[9px] font-bold uppercase tracking-tight bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 rounded-sm transition-colors disabled:opacity-50"
                        >
                          Sincronizar Todos
                        </button>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500">Dados do usuário que diferem entre o banco local e o IdP.</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-950/50 border-b border-slate-800 text-[9px] font-bold uppercase text-slate-500">
                          <th className="px-4 py-2">Usuário</th>
                          <th className="px-4 py-2">Campo</th>
                          <th className="px-4 py-2">Local</th>
                          <th className="px-4 py-2">Logto (Truth)</th>
                          <th className="px-4 py-2 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.attributeMismatches.map((m, idx) => (
                          <AttributeMismatchRow 
                            key={`${m.userId}-${m.field}-${idx}`} 
                            mismatch={m} 
                            onSync={onSyncAttributes} 
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Órfãos */}
              {report.orphansInLogto.length > 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
                  <div className="px-4 py-2 bg-red-500/5 border-b border-slate-800 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Usuários Órfãos no Logto</h4>
                      </div>
                      {report.orphansInLogto.length > 1 && (
                        <button
                          onClick={async () => {
                            if (!confirm(`CUIDADO: Isso excluirá permanentemente ${report.orphansInLogto.length} usuários do Logto. Deseja continuar?`)) return;
                            setBatchLoading(true);
                            try {
                              await onBatchAction('DELETE_ORPHAN_USERS', report.orphansInLogto.map(o => o.logtoId));
                              onRunAudit();
                            } finally {
                              setBatchLoading(false);
                            }
                          }}
                          disabled={isLoading}
                          className="h-6 px-2 text-[9px] font-bold uppercase tracking-tight bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-sm transition-colors disabled:opacity-50"
                        >
                          Excluir Todos
                        </button>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500">Contas existentes no IdP que não possuem registro no banco de dados local.</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-800 bg-slate-800/30">
                        <tr>
                          <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500">ID</th>
                          <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500">E-mail</th>
                          <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500">Contexto</th>
                          <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.orphansInLogto.map(orphan => (
                          <OrphanRow key={orphan.logtoId} orphan={orphan} onDelete={onDeleteOrphan} onProvision={onProvisionLocal} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-sm">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500/20" />
                  <span className="text-[11px] text-slate-500 mt-2">Nenhum usuário órfão detectado.</span>
                </div>
              )}

              {/* Ausentes */}
              {report.missingInLogto.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
                  <div className="px-4 py-2 bg-amber-500/5 border-b border-slate-800 flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-3.5 w-3.5 text-amber-400" />
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Usuários Ausentes no IdP</h4>
                    </div>
                    <span className="text-[9px] text-slate-500">Usuários locais sem credenciais no Logto. Precisam de reprovisionamento para login.</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-800 bg-slate-800/30">
                        <tr>
                          <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500">Username</th>
                          <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500">E-mail</th>
                          <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500">Tenant</th>
                          <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.missingInLogto.map(user => (
                          <MissingUserRow 
                            key={user.id} 
                            user={user} 
                            onReprovision={onReprovision} 
                            onBlock={onBlockLocal}
                            onDelete={onDeleteLocal}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Visão de Organizações */}
          {activeSubTab === 'orgs' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Orgs Órfãs */}
                <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
                  <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-red-400" />
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-400">Orgs Órfãs no Logto</h4>
                      </div>
                      {report.organizations.orphans.length > 1 && (
                        <button
                          onClick={async () => {
                            if (!confirm(`CUIDADO: Isso excluirá permanentemente ${report.organizations.orphans.length} organizações do Logto. Deseja continuar?`)) return;
                            setBatchLoading(true);
                            try {
                              await onBatchAction('DELETE_ORPHAN_ORGS', report.organizations.orphans.map(o => o.logtoId));
                              onRunAudit();
                            } finally {
                              setBatchLoading(false);
                            }
                          }}
                          disabled={isLoading}
                          className="h-6 px-2 text-[9px] font-bold uppercase tracking-tight bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-sm transition-colors disabled:opacity-50"
                        >
                          Limpar Todas
                        </button>
                      )}
                    </div>
                    <span className="text-[9px] text-red-400/50">Organizações no IdP sem vínculo com Tenants locais.</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <tbody>
                        {report.organizations.orphans.map(org => (
                          <OrgOrphanRow 
                            key={org.logtoId} 
                            org={org} 
                            onLink={onLinkOrg} 
                            onProvision={onProvisionLocalTenant}
                          />
                        ))}
                        {report.organizations.orphans.length === 0 && <tr><td className="px-4 py-3 text-slate-500 text-[11px]">Nenhuma org órfã.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tenants sem Org */}
                <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
                  <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-amber-400" />
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Tenants sem Org no Logto</h4>
                    </div>
                    <span className="text-[9px] text-amber-400/50">Tenants locais que ainda não possuem uma organização correspondente no IdP.</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <tbody>
                        {report.organizations.missing.map(org => (
                          <OrgMissingRow 
                            key={org.id} 
                            org={org} 
                            onProvision={onProvisionOrg} 
                            onDelete={onDeleteTenant}
                          />
                        ))}
                        {report.organizations.missing.length === 0 && <tr><td className="px-4 py-3 text-slate-500 text-[11px]">Todos os tenants vinculados.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Membership Mismatches */}
              {report.membershipMismatches.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
                  <div className="px-4 py-2 bg-amber-500/5 border-b border-slate-800 flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Discrepâncias de Membership</h4>
                    </div>
                    <span className="text-[9px] text-slate-500">Usuários associados a organizações incorretas no Logto em relação ao seu Tenant local.</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/30 border-b border-slate-800">
                        <tr>
                          <th className="px-3 py-2 text-[10px] text-slate-500 uppercase">Usuário</th>
                          <th className="px-3 py-2 text-[10px] text-slate-500 uppercase">Tenant</th>
                          <th className="px-3 py-2 text-[10px] text-slate-500 uppercase">Status</th>
                          <th className="px-3 py-2 text-[10px] text-slate-500 uppercase">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.membershipMismatches.map(mismatch => (
                          <MembershipMismatchRow key={mismatch.userId} mismatch={mismatch} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Verificado em */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <p className="text-[10px] text-slate-600 font-mono italic">
              Última auditoria completa: {new Date(report.checkedAt).toLocaleString('pt-BR')}
            </p>
            {allSynced && (
              <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                <CheckCircle2 className="h-3 w-3" />
                Sistema em conformidade
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
