import { useState, useEffect, useRef, useCallback } from 'react';
import { Users, Loader2, Eye, EyeOff, AlertCircle, Building2, User } from 'lucide-react';
import { useCreateUser } from '@/hooks/useUsers';
import { useTenantOptions } from '@/hooks/useTenants';
import { PLAN_SEATS } from '@/lib/tenantUtils';

interface CreateAccountDrawerProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateAccountDrawer({ onClose, onCreated }: CreateAccountDrawerProps) {
  const [type, setType] = useState<'INDIVIDUAL' | 'CORPORATE'>('INDIVIDUAL');
  
  // Shared fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  
  // INDIVIDUAL specific
  const [orgName, setOrgName] = useState('');
  
  // CORPORATE specific
  const [role, setRole] = useState<'ADMIN' | 'ENGINEER'>('ENGINEER');
  const [tenantId, setTenantId] = useState('');

  const handleCreateSuccess = useCallback(() => {
    onCreated();
    onClose();
  }, [onCreated, onClose]);

  const { mutate: create, loading, error } = useCreateUser(handleCreateSuccess);
  const { data: tenantOptions, loading: loadingTenants } = useTenantOptions();

  // Refs keep the latest values readable inside the effect without causing cycles
  const usernameRef = useRef(username);
  usernameRef.current = username;
  const orgNameRef = useRef(orgName);
  orgNameRef.current = orgName;

  // Auto-generate username and orgName
  useEffect(() => {
    // Auto-generate username only if the field hasn't been manually edited
    if (!usernameRef.current && fullName) {
      const generated = fullName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_');
      setUsername(generated);
    }

    // Auto-generate orgName for INDIVIDUAL if empty
    if (type === 'INDIVIDUAL' && fullName && !orgNameRef.current) {
      setOrgName(`Workspace de ${fullName.trim()}`);
    }
  }, [fullName, type]);

  const selectedTenant = type === 'CORPORATE' ? tenantOptions.find(t => t.id === tenantId) : null;
  const maxSeats = selectedTenant ? (PLAN_SEATS[selectedTenant.apiPlan] ?? 1) : 0;
  const isTenantFull = selectedTenant ? selectedTenant._count.users >= maxSeats : false;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !email || !username || !password) return;
    if (type === 'CORPORATE' && (!tenantId || isTenantFull)) return;
    
    create({ 
      type,
      fullName, 
      email,
      username, 
      password, 
      role: type === 'INDIVIDUAL' ? undefined : role, 
      tenantId: type === 'CORPORATE' ? tenantId : undefined,
      orgName: type === 'INDIVIDUAL' ? orgName : undefined,
      jobTitle: jobTitle || undefined 
    }).catch(() => {});
  }

  const isValid = fullName.trim() && email.includes('@') && username.trim() && password.length >= 8 && 
    (type === 'INDIVIDUAL' ? orgName.trim().length > 0 : (tenantId && !isTenantFull));

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
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
            <Users className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-200">Nova Conta e Acesso</span>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-6 overflow-y-auto p-5">

            {/* Account Type Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Tipo de Conta
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('INDIVIDUAL')}
                  className={`rounded-sm border px-3 py-2 text-left transition-colors ${
                    type === 'INDIVIDUAL'
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <User className="h-3.5 w-3.5" />
                    <p className="text-xs font-medium">Autônomo</p>
                  </div>
                  <p className="text-[10px] text-slate-500">Cria organização automaticamente.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setType('CORPORATE')}
                  className={`rounded-sm border px-3 py-2 text-left transition-colors ${
                    type === 'CORPORATE'
                      ? 'border-sky-500/50 bg-sky-500/10 text-sky-300'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Building2 className="h-3.5 w-3.5" />
                    <p className="text-xs font-medium">Membro Corporativo</p>
                  </div>
                  <p className="text-[10px] text-slate-500">Adiciona à uma organização existente.</p>
                </button>
              </div>
            </div>

            {/* Identity Group */}
            <div className="space-y-4 rounded-sm border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2">
                Identidade do Usuário
              </h3>
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Nome Completo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Carlos Souza"
                  autoFocus
                  className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  E-mail Profissional <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos.souza@empresa.com.br"
                  className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Identificador de Acesso <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="carlos.souza"
                  className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 font-tabular text-sm text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Senha Temporária <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Cargo <span className="text-slate-700">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ex: Engenheiro Elétrico Sênior"
                  className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Context Group */}
            <div className="space-y-4 rounded-sm border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2">
                Contexto Organizacional
              </h3>

              {type === 'INDIVIDUAL' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      Nome da Organização (Gerada) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      O usuário será o administrador exclusivo (Plano FREE). O nome pode ser ajustado acima.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      Organização <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      disabled={loadingTenants}
                      className={`w-full rounded-sm border bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none ${
                        isTenantFull ? 'border-red-500/50' : 'border-slate-700 focus:border-sky-500/50'
                      } disabled:opacity-50`}
                    >
                      <option value="">— Selecionar organização —</option>
                      {tenantOptions.map((t) => (
                        <option key={t.id} value={t.id} disabled={t.status === 'BLOCKED'}>
                          {t.name}
                          {t.status === 'BLOCKED' ? ' (bloqueada)' : ` (${t._count.users}/${PLAN_SEATS[t.apiPlan] || '?'} usuários)`}
                        </option>
                      ))}
                    </select>
                    {isTenantFull && (
                      <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Limite de usuários atingido para esta organização ({selectedTenant?.apiPlan}).
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      Nível de Acesso na Empresa
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('ENGINEER')}
                        className={`rounded-sm border px-2 py-1.5 text-left transition-colors ${
                          role === 'ENGINEER'
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                            : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                        }`}
                      >
                        <p className="text-xs font-medium">Engenheiro</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('ADMIN')}
                        className={`rounded-sm border px-2 py-1.5 text-left transition-colors ${
                          role === 'ADMIN'
                            ? 'border-sky-500/50 bg-sky-500/10 text-sky-300'
                            : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                        }`}
                      >
                        <p className="text-xs font-medium">Administrador</p>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-sm border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !isValid}
              className={`flex items-center gap-2 rounded-sm border px-4 py-2 text-xs font-medium transition-colors disabled:opacity-40 ${
                type === 'INDIVIDUAL' 
                  ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                  : 'border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Criando…
                </>
              ) : (
                'Criar Conta & Acesso'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
