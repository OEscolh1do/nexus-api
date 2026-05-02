import { useState } from 'react';
import {
  X,
  User as UserIcon,
  Briefcase,
  Building2,
  Calendar,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  ChevronRight,
  History,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useUser,
  useBlockUser,
  useUnblockUser,
  usePatchUser,
  useResetPassword,
  useIsSelf,
  type UserDetail,
} from '@/hooks/useUsers';
import RoleBadge from './RoleBadge';
import ConfirmUserBlockModal from './ConfirmUserBlockModal';
import CreateUserForm from './CreateUserForm';

// ─── Role edit sub-panel ──────────────────────────────────────────────────────

// POKA-YOKE: PLATFORM_ADMIN deliberadamente ausente.
// Operadores de plataforma só podem ser criados via script CLI no servidor.
const ROLE_OPTIONS = ['ADMIN', 'MANAGER', 'ENGINEER', 'VIEWER'];

function EditRolePanel({
  user,
  onClose,
  onSaved,
}: {
  user: UserDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { mutate: patch, loading } = usePatchUser(onSaved);
  const [role, setRole] = useState(user.role);

  function handleSave() {
    patch(user.id, { role });
  }

  return (
    <div className="mt-4 rounded-sm border border-slate-700 bg-slate-800/60 p-4 space-y-3">
      <p className="text-xs font-medium text-slate-300 uppercase tracking-wider">Alterar Role</p>
      <div className="space-y-1">
        <label className="text-[11px] text-slate-500">Nível de Acesso</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-sm border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
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
          disabled={loading || role === user.role}
          className="rounded-sm border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

interface UserDrawerProps {
  userId: string | null;
  onClose: () => void;
  onMutated?: () => void;
}

export default function UserDrawer({ userId, onClose, onMutated }: UserDrawerProps) {
  // Modo create
  if (userId === null) {
    return (
      <>
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl">
          <CreateUserForm
            onClose={onClose}
            onCreated={() => { onMutated?.(); onClose(); }}
          />
        </div>
      </>
    );
  }

  const { data: user, loading, refetch } = useUser(userId);

  const handleSuccess = () => {
    refetch();
    onMutated?.();
  };

  const { mutate: block, loading: blocking } = useBlockUser(handleSuccess);
  const { mutate: unblock, loading: unblocking } = useUnblockUser(handleSuccess);
  const { mutate: resetPassword, loading: resetting, successMsg: resetMsg } = useResetPassword(handleSuccess);

  const navigate = useNavigate();

  const [showBlock, setShowBlock] = useState(false);
  const [showEditRole, setShowEditRole] = useState(false);

  const isSelf = useIsSelf(userId);
  const isBlocked = user?.status === 'BLOCKED';

  function handleBlock() {
    if (!userId) return;
    block(userId).then(() => setShowBlock(false)).catch(() => {});
  }

  function handleResetPassword() {
    if (!userId) return;
    resetPassword(userId);
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
            <UserIcon className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-200">Detalhe do Usuário</span>
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
          ) : !user ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-xs text-red-400">Falha ao carregar usuário</p>
            </div>
          ) : (
            <>
              {/* Identity */}
              <section>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-100">{user.fullName || user.username}</h2>
                    <p className="mt-0.5 font-tabular text-[11px] text-slate-600">{user.username}</p>
                  </div>
                  <span className="badge badge-info">{user.role}</span>
                </div>

                {isSelf && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-sm border border-violet-500/20 bg-violet-500/5 px-2.5 py-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-[11px] text-violet-300">Este é o seu próprio usuário</span>
                  </div>
                )}
              </section>

              {/* Role & Org */}
              <section className="space-y-3 rounded-sm border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Nível de Acesso
                  </p>
                  <RoleBadge role={user.role} />
                </div>

                <div className="pt-2 border-t border-slate-800/50">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-2">
                    Organização
                  </p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-200">{user.tenant?.name || 'Sem tenant'}</span>
                    {user.tenant?.apiPlan && (
                      <span className="badge badge-info ml-auto">{user.tenant.apiPlan}</span>
                    )}
                  </div>
                </div>

                {showEditRole && !isSelf && (
                  <EditRolePanel
                    user={user}
                    onClose={() => setShowEditRole(false)}
                    onSaved={() => setShowEditRole(false)}
                  />
                )}
              </section>

              {/* Info grid */}
              <section className="grid grid-cols-2 gap-2">
                <div className="rounded-sm border border-slate-800 bg-slate-900 p-3">
                  <Briefcase className="mb-1 h-3.5 w-3.5 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-200 truncate" title={user.jobTitle || 'N/A'}>
                    {user.jobTitle || 'N/A'}
                  </p>
                  <p className="text-[10px] text-slate-500">Cargo</p>
                </div>
                <div className="rounded-sm border border-slate-800 bg-slate-900 p-3">
                  <Calendar className="mb-1 h-3.5 w-3.5 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-200">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-[10px] text-slate-500">Membro desde</p>
                </div>
              </section>

              {/* Reset Password Success Message */}
              {resetMsg && (
                <div className="rounded-sm border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-xs text-emerald-400">{resetMsg}</p>
                </div>
              )}

              {/* Audit Logs */}
              {user.auditLogs && user.auditLogs.length > 0 && (
                <section className="space-y-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Histórico Recente (AuditLog)
                  </p>
                  <div className="rounded-sm border border-slate-800 divide-y divide-slate-800">
                    {user.auditLogs.map((log) => (
                      <div key={log.id} className="flex flex-col gap-1 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-300">{log.action}</span>
                          <span className="font-tabular text-[10px] text-slate-500">
                            {new Date(log.timestamp).toLocaleString('pt-BR', {
                              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          Entidade: {log.entity}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate(`/audit?userId=${userId}`)}
                    className="flex w-full items-center justify-center gap-2 rounded-sm border border-slate-700 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors mt-2"
                  >
                    <History className="h-3.5 w-3.5" />
                    Ver Timeline Completa
                  </button>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {user && (
          <div className="border-t border-slate-800 px-5 py-4 space-y-2">
            {/* Edit role */}
            {!isSelf && (
              <button
                onClick={() => setShowEditRole((v) => !v)}
                className="flex w-full items-center justify-between rounded-sm border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-300 hover:border-slate-600 hover:bg-slate-800 transition-colors"
              >
                <span>Alterar Role</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Reset password */}
            <button
              onClick={handleResetPassword}
              disabled={resetting}
              className="flex w-full items-center justify-between rounded-sm border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
            >
              <span>{resetting ? 'Solicitando...' : 'Reset de Senha'}</span>
              <KeyRound className="h-3.5 w-3.5" />
            </button>

            {/* Block / Unblock */}
            {!isSelf && (
              isBlocked ? (
                <button
                  onClick={() => unblock(userId)}
                  disabled={unblocking}
                  className="flex w-full items-center justify-between rounded-sm border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                >
                  <span>{unblocking ? 'Desbloqueando…' : 'Desbloquear Usuário'}</span>
                  <Unlock className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowBlock(true)}
                  className="flex w-full items-center justify-between rounded-sm border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/15 transition-colors"
                >
                  <span>Bloquear Usuário</span>
                  <Lock className="h-3.5 w-3.5" />
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Confirm block modal */}
      {showBlock && user && (
        <ConfirmUserBlockModal
          username={user.username}
          onConfirm={handleBlock}
          onCancel={() => setShowBlock(false)}
          loading={blocking}
        />
      )}
    </>
  );
}
