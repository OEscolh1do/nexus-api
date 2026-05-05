import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { User, Building2, ShieldX, Loader2 } from 'lucide-react';

interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  user: { username: string; fullName: string } | null;
  tenant: { name: string } | null;
}

export default function SessionsTable() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/system/sessions');
      setSessions(response.data.data);
    } catch (err) {
      console.error('Falha ao buscar sessões');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Tem certeza que deseja revogar esta sessão? O usuário será deslogado imediatamente.')) return;
    
    setRevokingId(id);
    try {
      await api.delete(`/system/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Erro ao revogar sessão');
    } finally {
      setRevokingId(null);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center bg-slate-900 border border-slate-800 rounded-sm">
        <Loader2 className="h-6 w-6 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
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
                      {session.tenant?.name || 'Global'}
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
                      onClick={() => handleRevoke(session.id)}
                      disabled={revokingId === session.id}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-sm transition-all"
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
  );
}
