import { useState, useEffect } from 'react';
import { Users, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useCreateUser } from '@/hooks/useUsers';
import { useTenantOptions } from '@/hooks/useTenants';
import { PLAN_SEATS } from '@/lib/tenantUtils';

// ─── Constants ───────────────────────────────────────────────────────────────

// ─── Props ───────────────────────────────────────────────────────────────────

interface CreateUserFormProps {
  onClose: () => void;
  onCreated: () => void;
  /** Pré-seleciona um tenant (ex: chamado do TenantDrawer) */
  defaultTenantId?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CreateUserForm({ onClose, onCreated, defaultTenantId }: CreateUserFormProps) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'ADMIN' | 'ENGINEER'>('ENGINEER');
  const [tenantId, setTenantId] = useState(defaultTenantId ?? '');
  const [jobTitle, setJobTitle] = useState('');

  const { mutate: create, loading, error } = useCreateUser(() => {
    onCreated();
    setFullName('');
    setUsername('');
    setPassword('');
    setTenantId(defaultTenantId || '');
    setJobTitle('');
  });
  const { data: tenantOptions, loading: loadingTenants } = useTenantOptions();

  useEffect(() => {
    if (!fullName || username) return;
    const generated = fullName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_');
    setUsername(generated);
  }, [fullName, username]);

  const selectedTenant = tenantOptions.find(t => t.id === tenantId);
  const maxSeats = selectedTenant ? (PLAN_SEATS[selectedTenant.apiPlan] ?? 1) : 0;
  const isTenantFull = selectedTenant ? selectedTenant._count.users >= maxSeats : false;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !username || !password || !tenantId || isTenantFull) return;
    create({ fullName, username, password, role, tenantId, jobTitle: jobTitle || undefined }).catch(() => {});
  }

  const isValid = fullName.trim() && username.trim() && password.length >= 8 && tenantId && !isTenantFull;

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
        <Users className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-200">Adicionar Membro Corporativo</span>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-5 overflow-y-auto p-5">

        {/* Nível de Acesso */}
        <div className="space-y-2">
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Nível de Acesso
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('ENGINEER')}
              className={`rounded-sm border px-3 py-2 text-left transition-colors ${
                role === 'ENGINEER'
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              <p className="text-xs font-medium">Engenheiro</p>
              <p className="text-[10px] text-slate-500">Cria e edita projetos</p>
            </button>
            <button
              type="button"
              onClick={() => setRole('ADMIN')}
              className={`rounded-sm border px-3 py-2 text-left transition-colors ${
                role === 'ADMIN'
                  ? 'border-sky-500/50 bg-sky-500/10 text-sky-300'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              <p className="text-xs font-medium">Administrador</p>
              <p className="text-[10px] text-slate-500">Gerencia equipe e org</p>
            </button>
          </div>
        </div>

        {/* Nome Completo */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Nome Completo <span className="text-red-400">*</span>
          </label>
          <input
            id="create-user-fullname"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ex: Carlos Souza"
            autoFocus
            className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
          />
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Identificador de Acesso <span className="text-red-400">*</span>
          </label>
          <input
            id="create-user-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="carlos.souza"
            className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 font-tabular text-sm text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
          />
          <p className="text-[10px] text-slate-600">Este é o nome único que o usuário usará para o login.</p>
        </div>

        {/* Senha */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Senha Temporária <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              id="create-user-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-[10px] text-slate-600">Mínimo 8 caracteres.</p>
        </div>

        {/* Organização */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Organização <span className="text-red-400">*</span>
          </label>
          <select
            id="create-user-tenant"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            disabled={loadingTenants || !!defaultTenantId}
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

        {/* Cargo (opcional) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Cargo na Empresa <span className="text-slate-700">(opcional)</span>
          </label>
          <input
            id="create-user-jobtitle"
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Ex: Engenheiro Elétrico Sênior"
            className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
          />
        </div>

        {/* Aviso senha temporária */}
        <div className="flex gap-2 rounded-sm border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          <p className="text-[11px] text-amber-300/80 leading-relaxed">
            O usuário deverá alterar esta senha no primeiro acesso para garantir a segurança da conta.
          </p>
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
          className="flex items-center gap-2 rounded-sm border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-colors disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Criando…
            </>
          ) : (
            'Criar Usuário'
          )}
        </button>
      </div>
    </form>
  );
}
