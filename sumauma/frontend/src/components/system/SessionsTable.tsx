import { useState, useCallback } from 'react';
import { User, Building2, ShieldX, Loader2, AlertTriangle, X } from 'lucide-react';
import { Session } from '@/hooks/useSystemHealth';

interface SessionsTableProps {
  sessions: Session[];
  onRevoke: (id: string) => Promise<void>;
  loading: boolean;
}

// ─── Inline confirm modal ─────────────────────────────────────────────────────

function RevokeConfirmModal({
  session,
  onConfirm,
  onCancel,
  loading,
}: {
  session: Session;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-red-500/20 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 flex items-center justify-center rounded bg-red-500/10 border border-red-500/20 flex-shrink-0">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-200">
              Revogar Sessão
            </span>
          </div>
          <button onClick={onCancel} className="text-slate-600 hover:text-slate-400 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
          O usuário <span className="font-semibold text-slate-200">@{session.user?.username ?? 'desconhecido'}</span>{' '}
          será deslogado imediatamente e não poderá usar este token novamente.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldX className="h-3 w-3" />}
            {loading ? 'Revogando…' : 'Revogar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SessionsTable({ sessions, onRevoke, loading }: SessionsTableProps) {
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmSession, setConfirmSession] = useState<Session | null>(null);

  const handleRevokeConfirmed = useCallback(async () => {
    if (!confirmSession) return;
    setRevokingId(confirmSession.id);
    setConfirmSession(null);
    try {
      await onRevoke(confirmSession.id);
    } finally {
      setRevokingId(null);
    }
  }, [confirmSession, onRevoke]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center bg-slate-900 border border-slate-800 rounded-sm">
        <Loader2 className="h-6 w-6 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {confirmSession && (
        <RevokeConfirmModal
          session={confirmSession}
          onConfirm={handleRevokeConfirmed}
          onCancel={() => setConfirmSession(null)}
          loading={revokingId === confirmSession.id}
        />
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
        <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sessões Ativas (Top 100)</h3>
          <span className="text-[10px] font-mono text-sky-400 font-bold">{sessions.length} conexões</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <th className="px-4 py-2 font-medium">Usuário</th>
                <th className="px-4 py-2 font-medium">Tenant</th>
                <th className="px-4 py-2 font-medium">Início</th>
                <th className="px-4 py-2 font-medium">Expira</th>
                <th className="px-4 py-2 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-500 italic">
                    Nenhuma sessão ativa encontrada.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-slate-800">
                          <User className="h-3 w-3 text-slate-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-200">{session.user?.fullName || 'N/A'}</span>
                          <span className="text-[10px] text-slate-500 font-mono">@{session.user?.username || 'desconhecido'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Building2 className="h-3 w-3" />
                        {session.user?.tenant?.name || 'Global'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[10px] font-mono text-slate-500">
                      {new Date(session.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-[10px] font-mono text-slate-500">
                      {new Date(session.expiresAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setConfirmSession(session)}
                        disabled={revokingId === session.id}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-sm transition-all disabled:opacity-40"
                        title="Revogar Sessão"
                      >
                        {revokingId === session.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ShieldX className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
