import { useState } from 'react';
import {
  X,
  Building2,
  Users,
  Activity,
  Shield,
  Zap,
  RefreshCw,
  Lock,
  Unlock,
  ChevronRight,
  Trash2,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import {
  useTenant,
  useBlockTenant,
  useUnblockTenant,
  usePatchTenant,
  useDeleteTenant,
  type TenantDetail,
} from '@/hooks/useTenants';
import TenantStatusBadge from './TenantStatusBadge';
import ConfirmBlockModal from './ConfirmBlockModal';
import ConfirmTenantDeleteModal from './ConfirmTenantDeleteModal';
import CreateTenantForm from './CreateTenantForm';
import CreateUserForm from '@/components/users/CreateUserForm';
import RoleBadge from '@/components/users/RoleBadge';
import { PLAN_SEATS } from '@/lib/tenantUtils';
// ─── Plan edit sub-panel ──────────────────────────────────────────────────────

const PLAN_OPTIONS = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

function EditPlanPanel({
  tenant,
  onClose,
  onSaved,
}: {
  tenant: TenantDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { mutate: patch, loading } = usePatchTenant(onSaved);
  const [plan, setPlan] = useState(tenant.apiPlan);
  const [quota, setQuota] = useState(String(tenant.apiMonthlyQuota));

  function handleSave() {
    patch(tenant.id, { apiPlan: plan, apiMonthlyQuota: Number(quota) });
  }

  return (
    <div className="mt-4 rounded-sm border border-slate-700 bg-slate-800/60 p-4 space-y-3">
      <p className="text-xs font-medium text-slate-300 uppercase tracking-wider">Editar Plano</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] text-slate-500">Plano de API</label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value as TenantDetail['apiPlan'])}
            className="w-full rounded-sm border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50"
          >
            {PLAN_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-500">Quota Mensal (req)</label>
          <input
            type="number"
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
            min={0}
            className="w-full rounded-sm border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50 font-tabular"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-sm border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}

// ─── Inject Quota sub-panel ───────────────────────────────────────────────────

function InjectQuotaPanel({
  tenant,
  onClose,
  onSaved,
}: {
  tenant: TenantDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { mutate: patch, loading } = usePatchTenant(onSaved);
  const [extra, setExtra] = useState('100');

  function handleSave() {
    const newQuota = tenant.apiMonthlyQuota + Number(extra);
    patch(tenant.id, { apiMonthlyQuota: newQuota });
  }

  return (
    <div className="mt-4 rounded-sm border border-slate-700 bg-slate-800/60 p-4 space-y-3">
      <p className="text-xs font-medium text-slate-300 uppercase tracking-wider">Injetar Quota Extra</p>
      <div className="space-y-1">
        <label className="text-[11px] text-slate-500">Adicionar Quota de Simulações (+)</label>
        <input
          type="number"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          min={1}
          className="w-full rounded-sm border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50 font-tabular"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-sm border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-colors disabled:opacity-50"
        >
          {loading ? 'Injetando…' : 'Injetar'}
        </button>
      </div>
    </div>
  );
}

// ─── Usage bars ───────────────────────────────────────────────────────────────

function ApiUsageBar({ current, quota }: { current: number; quota: number }) {
  const pct = quota > 0 ? Math.min((current / quota) * 100, 100) : 0;
  const color =
    pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-400">Simulações de Engenharia</span>
        <span className="font-tabular text-slate-300">
          {current.toLocaleString('pt-BR')} / {quota.toLocaleString('pt-BR')}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800">
        <div
          className={`h-1.5 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-500">{pct.toFixed(1)}% utilizado</p>
    </div>
  );
}

function SeatsUsageBar({ current, plan }: { current: number; plan: string }) {
  const max = PLAN_SEATS[plan] ?? 5;
  const isUnlimited = max > 1000;
  const pct = isUnlimited ? 0 : Math.min((current / max) * 100, 100);
  const color = pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-1.5 pt-3 border-t border-slate-800">
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-400">Assentos Ativos</span>
        <span className="font-tabular text-slate-300">
          {current} / {isUnlimited ? 'Ilimitado' : max}
        </span>
      </div>
      {!isUnlimited && (
        <>
          <div className="h-1.5 w-full rounded-full bg-slate-800">
            <div
              className={`h-1.5 rounded-full transition-all ${color}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">{pct.toFixed(0)}% utilizado</p>
        </>
      )}
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

interface TenantDrawerProps {
  tenantId: string | null;
  onClose: () => void;
  onMutated?: () => void;
}

export default function TenantDrawer({ tenantId, onClose, onMutated }: TenantDrawerProps) {
  // Modo create
  if (tenantId === null) {
    return (
      <>
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl">
          <CreateTenantForm
            onClose={onClose}
            onCreated={(_id, _name) => { onMutated?.(); onClose(); }}
          />
        </div>
      </>
    );
  }

  const { data: tenant, loading, refetch } = useTenant(tenantId);

  const handleSuccess = () => {
    refetch();
    onMutated?.();
  };

  const { mutate: block, loading: blocking } = useBlockTenant(handleSuccess);
  const { mutate: unblock, loading: unblocking } = useUnblockTenant(handleSuccess);
  const { mutate: patch, loading: resetting } = usePatchTenant(handleSuccess);
  const { mutate: deleteTenant, loading: deleting } = useDeleteTenant(() => { onMutated?.(); onClose(); });

  const [showBlock, setShowBlock] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [showInjectQuota, setShowInjectQuota] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const isMaster = tenant?.type === 'MASTER';
  const isBlocked = tenant?.status === 'BLOCKED';
  const maxSeats = tenant ? (PLAN_SEATS[tenant.apiPlan] ?? 1) : 0;
  const isUnlimitedSeats = maxSeats > 1000;
  const isSeatsFull = !isUnlimitedSeats && !!tenant && tenant._count.users >= maxSeats;

  function handleBlock() {
    if (!tenantId) return;
    block(tenantId).then(() => setShowBlock(false)).catch(() => {});
  }

  function handleDelete() {
    if (!tenantId) return;
    deleteTenant(tenantId).then(() => setShowDelete(false)).catch(() => {});
  }

  function handleResetQuota() {
    if (!tenantId) return;
    patch(tenantId, { apiCurrentUsage: 0 });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-200">Detalhe da Organização</span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:text-slate-200 transition-colors"
            aria-label="Fechar drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-xs text-slate-500">Carregando...</p>
            </div>
          ) : !tenant ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-xs text-red-400">Falha ao carregar organização</p>
            </div>
          ) : (
            <>
              {/* Identity */}
              <section>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-100">{tenant.name}</h2>
                    </div>
                    <p className="mt-0.5 font-tabular text-[11px] text-slate-600">{tenant.id}</p>
                  </div>
                  <TenantStatusBadge status={tenant.status} />
                </div>

                {isMaster && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-sm border border-violet-500/20 bg-violet-500/5 px-2.5 py-1.5">
                    <Shield className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-[11px] text-violet-300">Tenant MASTER — imutável</span>
                  </div>
                )}
              </section>

              {/* Stats row */}
              <section className="grid grid-cols-3 gap-2">
                {[
                  { Icon: Users, label: 'Usuários', value: String(tenant._count.users) },
                  { Icon: Activity, label: 'Audit Logs', value: String(tenant._count.auditLogs) },
                  { Icon: Zap, label: 'SSO', value: tenant.ssoEnforced ? 'Ativo' : 'Off' },
                ].map(({ Icon, label, value }) => (
                  <div
                    key={label}
                    className="rounded-sm border border-slate-800 bg-slate-900 p-3 text-center"
                  >
                    <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-slate-500" />
                    <p className="font-tabular text-sm font-semibold text-slate-200">{value}</p>
                    <p className="text-[10px] text-slate-500">{label}</p>
                  </div>
                ))}
              </section>

              {/* Limites e Quotas */}
              <section className="space-y-3 rounded-sm border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Limites e Quotas
                  </p>
                  <span className="badge badge-info">{tenant.apiPlan}</span>
                </div>
                
                <ApiUsageBar
                  current={tenant.apiCurrentUsage}
                  quota={tenant.apiMonthlyQuota}
                />
                
                <SeatsUsageBar
                  current={tenant._count.users}
                  plan={tenant.apiPlan}
                />

                {showEditPlan && (
                  <EditPlanPanel
                    tenant={tenant}
                    onClose={() => setShowEditPlan(false)}
                    onSaved={() => setShowEditPlan(false)}
                  />
                )}
                
                {showInjectQuota && (
                  <InjectQuotaPanel
                    tenant={tenant}
                    onClose={() => setShowInjectQuota(false)}
                    onSaved={() => setShowInjectQuota(false)}
                  />
                )}
              </section>

              {/* Users list */}
              {tenant.users && tenant.users.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      Usuários ({tenant._count.users})
                    </p>
                  </div>
                  <div className="rounded-sm border border-slate-800 divide-y divide-slate-800">
                    {tenant.users.slice(0, 10).map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between px-3 py-2"
                      >
                        <div>
                          <p className="text-xs text-slate-300">{u.fullName || u.username}</p>
                          <p className="text-[11px] text-slate-600">{u.username}</p>
                        </div>
                        <RoleBadge role={u.role} />
                      </div>
                    ))}
                    {tenant._count.users > 10 && (
                      <div className="flex items-center justify-between px-3 py-2">
                        <p className="text-[11px] text-slate-500">
                          +{tenant._count.users - 10} outros usuários
                        </p>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Metadata */}
              <section className="text-[11px] text-slate-600 space-y-0.5">
                <p>
                  Criado em:{' '}
                  <span className="text-slate-400">
                    {new Date(tenant.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                </p>
                {tenant.ssoProvider && (
                  <p>
                    SSO Provider: <span className="text-slate-400">{tenant.ssoProvider}</span>
                  </p>
                )}
              </section>
            </>
          )}
        </div>

        {/* Footer actions */}
        {tenant && !isMaster && (
          <div className="border-t border-slate-800 px-5 py-4 space-y-2">
            {/* Adicionar Membro */}
            {isSeatsFull ? (
              <div className="flex items-center gap-2 rounded-sm border border-slate-700 bg-slate-800/40 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                <p className="text-[11px] text-amber-300/80">
                  Limite de assentos atingido ({tenant._count.users}/{maxSeats}). Upgrade o plano para adicionar membros.
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowAddMember(true)}
                className="flex w-full items-center justify-between rounded-sm border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <span>Adicionar Membro</span>
                <UserPlus className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => { setShowInjectQuota((v) => !v); setShowEditPlan(false); }}
              className="flex w-full items-center justify-between rounded-sm border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-xs text-sky-400 hover:bg-sky-500/10 transition-colors"
            >
              <span>Injetar Quota Extra</span>
              <Zap className="h-3.5 w-3.5" />
            </button>

            {/* Edit plan */}
            <button
              onClick={() => { setShowEditPlan((v) => !v); setShowInjectQuota(false); }}
              className="flex w-full items-center justify-between rounded-sm border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-300 hover:border-slate-600 hover:bg-slate-800 transition-colors"
            >
              <span>Editar Plano / Quota</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            {/* Reset quota */}
            <button
              onClick={handleResetQuota}
              disabled={resetting}
              className="flex w-full items-center justify-between rounded-sm border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
            >
              <span>{resetting ? 'Resetando…' : 'Resetar Quota Mensal'}</span>
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            {/* Block / Unblock */}
            {isBlocked ? (
              <button
                onClick={() => unblock(tenantId)}
                disabled={unblocking}
                className="flex w-full items-center justify-between rounded-sm border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
              >
                <span>{unblocking ? 'Desbloqueando…' : 'Desbloquear Organização'}</span>
                <Unlock className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setShowBlock(true)}
                className="flex w-full items-center justify-between rounded-sm border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/15 transition-colors"
              >
                <span>Bloquear Organização</span>
                <Lock className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Delete */}
            <button
              onClick={() => setShowDelete(true)}
              disabled={deleting}
              className="flex w-full items-center justify-between rounded-sm border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all disabled:opacity-50"
            >
              <span>{deleting ? 'Excluindo…' : 'Excluir Organização'}</span>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Confirm block modal */}
      {showBlock && tenant && (
        <ConfirmBlockModal
          tenantName={tenant.name}
          usersCount={tenant._count.users}
          onConfirm={handleBlock}
          onCancel={() => setShowBlock(false)}
          loading={blocking}
        />
      )}

      {/* Confirm delete modal */}
      {showDelete && tenant && (
        <ConfirmTenantDeleteModal
          tenantName={tenant.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
        />
      )}

      {/* Sub-drawer: Adicionar Membro — z-50 para sobrepor o drawer pai (z-40) */}
      {showAddMember && tenantId && (
        <>
          <div
            className="fixed inset-0 z-[45] bg-black/30"
            onClick={() => setShowAddMember(false)}
            aria-hidden="true"
          />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-700 bg-slate-950 shadow-2xl">
            <CreateUserForm
              defaultTenantId={tenantId}
              onClose={() => setShowAddMember(false)}
              onCreated={() => {
                setShowAddMember(false);
                refetch();
                onMutated?.();
              }}
            />
          </div>
        </>
      )}
    </>
  );
}
