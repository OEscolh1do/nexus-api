import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { useRoles } from '@/hooks/useRoles';
import RoleBuilderMatrix from './RoleBuilderMatrix';

interface RoleDrawerProps {
  roleId: string | null;
  onClose: () => void;
  onMutated: () => void;
}

export default function RoleDrawer({ roleId, onClose, onMutated }: RoleDrawerProps) {
  const { roles } = useRoles();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [level, setLevel] = useState<'PLATFORM' | 'TENANT'>('TENANT');
  const [tenantId, setTenantId] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  // Para PLATFORM_ADMIN poder escolher de qual tenant é a role
  // Numa implementação real, preencher isso via useTenants
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    // Carregar tenants para dropdown (se level == TENANT)
    api.get('/tenants/options')
      .then(res => setTenants(res.data.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (roleId) {
      // Editar: encontrar role e popular
      const existing = roles.find((r: any) => r.id === roleId);
      if (existing) {
        setName(existing.name);
        setLevel(existing.level);
        setTenantId(existing.tenantId || '');
        setSelectedPermissionIds(existing.permissions.map((p: any) => p.permissionId));
      }
    } else {
      // Criar: limpar form
      setName('');
      setLevel('TENANT');
      setTenantId('');
      setSelectedPermissionIds([]);
    }
  }, [roleId, roles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name,
        level,
        tenantId: level === 'TENANT' ? tenantId : undefined,
        permissionIds: selectedPermissionIds
      };

      if (roleId) {
        await api.patch(`/roles/${roleId}`, payload);
      } else {
        await api.post('/roles', payload);
      }

      onMutated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar o perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
      <div className="flex w-[800px] flex-col bg-slate-900 border-l border-slate-800 shadow-2xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-200">
            {roleId ? 'Editar Perfil de Acesso' : 'Novo Perfil de Acesso'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-sm p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="role-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Meta-dados da Role */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Nome do Perfil <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Engenheiro Projetista"
                  className="h-9 w-full rounded-sm border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Nível do Perfil</label>
                <select
                  value={level}
                  onChange={e => setLevel(e.target.value as 'PLATFORM' | 'TENANT')}
                  className="h-9 w-full rounded-sm border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200 focus:border-sky-500/50 focus:outline-none"
                  disabled={!!roleId} // não permitir mudar nível na edição
                >
                  <option value="TENANT">Tenant (Cliente final)</option>
                  <option value="PLATFORM">Plataforma (Administração Interna)</option>
                </select>
              </div>

              {level === 'TENANT' && (
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">Organização (Tenant) <span className="text-red-400">*</span></label>
                  <select
                    required
                    value={tenantId}
                    onChange={e => setTenantId(e.target.value)}
                    className="h-9 w-full rounded-sm border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200 focus:border-sky-500/50 focus:outline-none"
                    disabled={!!roleId} // se já existe, não muda de tenant
                  >
                    <option value="">Selecione uma organização...</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 my-2"></div>

            {/* Matriz de Permissões */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Matriz de Permissões</h3>
                <span className="text-xs bg-slate-800 text-sky-400 px-2 py-0.5 rounded-full font-tabular">
                  {selectedPermissionIds.length} selecionadas
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-2">
                Conceda acessos a módulos específicos do Ywara habilitando as ações abaixo.
              </p>
              
              <RoleBuilderMatrix 
                selectedPermissionIds={selectedPermissionIds} 
                onChange={setSelectedPermissionIds} 
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 rounded-sm border border-red-900/50 bg-red-900/20 p-3 text-xs text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-900/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            form="role-form"
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-sm bg-sky-600 px-4 py-2 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
          >
            {loading && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />}
            {!loading && <Save className="h-3.5 w-3.5" />}
            {roleId ? 'Salvar Alterações' : 'Criar Perfil'}
          </button>
        </div>
      </div>
    </div>
  );
}
