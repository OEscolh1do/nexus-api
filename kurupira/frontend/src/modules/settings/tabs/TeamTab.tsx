import { useEffect, useState } from 'react';
import { KurupiraClient } from '@/services/NexusClient';
import { Shield, ShieldAlert, Users, Info, Plus } from 'lucide-react';

interface TeamMember {
  id: string;
  username: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export function TeamTab() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Opcional: Pegar o user do Zustand (se estiver sincronizando)
  // const user = useSolarStore(state => state.user);

  useEffect(() => {
    async function loadTeam() {
      try {
        setLoading(true);
        const data = await KurupiraClient.team.list();
        setMembers(data);
      } catch (err: any) {
        setError(err.message || 'Falha ao carregar equipe');
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30"><ShieldAlert className="w-3 h-3" /> Master</span>;
      case 'TENANT_ADMIN':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30"><Shield className="w-3 h-3" /> Gestor</span>;
      case 'ENGINEER':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Engenheiro</span>;
      case 'SALES':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/20 text-sky-400 border border-sky-500/30">Vendedor</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">{role}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Minha Equipe
          </h2>
          <p className="text-sm text-slate-400">
            Usuários que pertencem à sua organização e têm acesso ao Kurupira.
          </p>
        </div>
      </div>

      {/* Banner Informativo (God-Mode Enforcement) */}
      <div className="bg-slate-800/50 border border-indigo-500/20 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-slate-200">Gestão Centralizada Ywara</h4>
          <p className="text-xs text-slate-400 mt-1">
            Para garantir a segurança e o correto controle de faturamento, a criação de novos usuários, exclusão e alteração de perfis de acesso devem ser solicitadas diretamente ao suporte da Neonorte. 
          </p>
          <button 
            className="mt-3 text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            onClick={() => alert('Em breve: Integração com Helpdesk Neonorte')}
          >
            <Plus className="w-3 h-3" /> Solicitar novo acesso (Assento)
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando membros da equipe...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">{error}</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400 border-b border-slate-700/50">
              <tr>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Perfil de Acesso</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Entrada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-200">{member.fullName}</div>
                    <div className="text-xs text-slate-500">{member.username}</div>
                  </td>
                  <td className="px-4 py-3">
                    {getRoleBadge(member.role)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell">
                    {new Date(member.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    Nenhum membro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
