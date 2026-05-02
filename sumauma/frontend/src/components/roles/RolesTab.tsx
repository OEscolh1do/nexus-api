import { useState } from 'react';
import { ShieldCheck, ShieldAlert, Users, Plus } from 'lucide-react';
import RoleDrawer from './RoleDrawer';
import { useRoles } from '@/hooks/useRoles';

export default function RolesTab() {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { roles, loading, error, refetch } = useRoles();

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Tab Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div>
          <p className="text-xs text-slate-400">
            Gerencie perfis customizados e matrizes de permissões para cada organização.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo Perfil
          </button>
        </div>
      </div>

      {/* Tabela de Roles */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-sm border border-slate-800 bg-slate-900">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-slate-900">
              <tr className="border-b border-slate-800">
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 w-[200px]">Nome do Perfil</th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 w-[150px]">Organização</th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 w-[100px]">Nível</th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 w-[120px]">Permissões</th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 w-[100px]">Usuários</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  <td colSpan={5} className="px-4 py-3"><div className="h-3 w-full animate-pulse rounded-sm bg-slate-800" /></td>
                </tr>
              ))}
              
              {error && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-xs text-red-400">
                    <ShieldAlert className="mx-auto mb-2 h-6 w-6 text-red-500" />
                    Erro ao carregar perfis: {error}
                  </td>
                </tr>
              )}

              {!loading && !error && roles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-slate-700" />
                    <p className="text-xs text-slate-500">Nenhum perfil customizado encontrado</p>
                  </td>
                </tr>
              )}

              {!loading && roles.map((role: any) => (
                <tr
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className="cursor-pointer border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-xs font-medium text-slate-200">
                    {role.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-slate-400">
                      {role.tenant?.name || 'Sistema Global'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      role.level === 'PLATFORM' 
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {role.level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-tabular bg-slate-800 text-slate-300 px-2 py-0.5 rounded-sm">
                      {role.permissions.length} ações
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Users className="h-3 w-3" />
                      {role._count?.users || 0}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {(selectedRoleId || createOpen) && (
        <RoleDrawer
          roleId={selectedRoleId}
          onClose={() => {
            setSelectedRoleId(null);
            setCreateOpen(false);
          }}
          onMutated={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}
