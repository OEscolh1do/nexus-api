import { useState } from 'react';
import { ShieldCheck, ShieldOff, Shield, AlertTriangle, Lock, Unlock, Terminal } from 'lucide-react';
import api from '@/lib/api';
import useSWR from 'swr';

interface Operator {
  id: string;
  username: string;
  fullName: string;
  role: string;
  status: 'ACTIVE' | 'BLOCKED';
  jobTitle: string | null;
  createdAt: string;
}

const fetcher = (url: string) => api.get(url).then(res => res.data);

function StatusBadge({ status }: { status: 'ACTIVE' | 'BLOCKED' }) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        ATIVO
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
      BLOQUEADO
    </span>
  );
}

export default function OperatorsPage() {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { data, error, isLoading, mutate } = useSWR<{ data: Operator[]; total: number }>(
    '/operators',
    fetcher
  );

  const operators = data?.data || [];

  async function handleToggleBlock(op: Operator) {
    setActionLoading(op.id);
    try {
      const endpoint = op.status === 'ACTIVE'
        ? `/operators/${op.id}/block`
        : `/operators/${op.id}/unblock`;
      await api.patch(endpoint);
      mutate();
    } catch (err: any) {
      console.error('[OperatorsPage] Erro:', err.response?.data?.error);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
            <Shield className="h-5 w-5 text-violet-400" />
            Operadores de Plataforma
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acesso irrestrito ao painel Sumaúma. Criação exclusivamente via CLI no servidor.
          </p>
        </div>

        {/* Instrução de criação — lembrete Poka-Yoke */}
        <div className="flex items-start gap-3 rounded-sm border border-violet-500/20 bg-violet-500/5 px-4 py-3 max-w-sm">
          <Terminal className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-violet-300">Como criar um novo operador?</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Execute no servidor via SSH:</p>
            <code className="text-[11px] text-emerald-400 font-mono block mt-1">
              node scripts/create-operator.js
            </code>
          </div>
        </div>
      </div>

      {/* Aviso de segurança */}
      <div className="flex items-center gap-2 rounded-sm border border-amber-500/20 bg-amber-500/5 px-4 py-2.5">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <p className="text-[11px] text-amber-300/80">
          <strong>Poka-Yoke ativo:</strong> Não é possível criar ou promover operadores via esta interface.
          Alterações de nível de acesso só são possíveis via script protegido no servidor.
        </p>
      </div>

      {/* Tabela */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-sm border border-slate-800 bg-slate-900">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-slate-900">
              <tr className="border-b border-slate-800">
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 w-[240px]">
                  Operador
                </th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 w-[160px]">
                  Cargo
                </th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 w-[120px]">
                  Nível
                </th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 w-[110px]">
                  Status
                </th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 w-[120px]">
                  Desde
                </th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 w-[100px]">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-3 w-full animate-pulse rounded-sm bg-slate-800" />
                  </td>
                </tr>
              ))}

              {error && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-xs text-red-400">
                    Erro ao carregar operadores. Verifique a conexão com o backend.
                  </td>
                </tr>
              )}

              {!isLoading && !error && operators.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Shield className="mx-auto mb-2 h-7 w-7 text-slate-700" />
                    <p className="text-xs text-slate-500">Nenhum operador de plataforma encontrado.</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Use o script CLI para adicionar o primeiro operador.
                    </p>
                  </td>
                </tr>
              )}

              {!isLoading && operators.map((op: any) => (
                <tr
                  key={op.id}
                  className={`border-b border-slate-800/50 ${op.status === 'BLOCKED' ? 'opacity-60' : ''}`}
                >
                  {/* Nome */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/20">
                        <Shield className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-200">{op.fullName}</p>
                        <p className="text-[10px] font-mono text-slate-500">{op.username}</p>
                      </div>
                    </div>
                  </td>

                  {/* Cargo */}
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-slate-400">{op.jobTitle || '—'}</span>
                  </td>

                  {/* Nível */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                      <ShieldCheck className="h-3 w-3" />
                      PLATFORM
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={op.status} />
                  </td>

                  {/* Data */}
                  <td className="px-4 py-3 font-tabular text-[11px] text-slate-500">
                    {new Date(op.createdAt).toLocaleDateString('pt-BR')}
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleBlock(op)}
                      disabled={actionLoading === op.id}
                      title={op.status === 'ACTIVE' ? 'Bloquear operador' : 'Desbloquear operador'}
                      className={`flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[10px] font-medium transition-colors disabled:opacity-50 ${
                        op.status === 'ACTIVE'
                          ? 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10'
                          : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      {actionLoading === op.id ? (
                        <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                      ) : op.status === 'ACTIVE' ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <Unlock className="h-3 w-3" />
                      )}
                      {op.status === 'ACTIVE' ? 'Bloquear' : 'Restaurar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé informativo */}
        {!isLoading && operators.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2.5">
            <p className="text-[11px] text-slate-600">
              {operators.filter((o: any) => o.status === 'ACTIVE').length} ativo(s) ·{' '}
              {operators.filter((o: any) => o.status === 'BLOCKED').length} bloqueado(s) ·{' '}
              {operators.length} total
            </p>
            <div className="flex items-center gap-1.5">
              <ShieldOff className="h-3 w-3 text-slate-700" />
              <span className="text-[10px] text-slate-700">Criação via HTTP bloqueada</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
