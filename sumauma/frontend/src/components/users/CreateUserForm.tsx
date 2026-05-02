import { useState, useCallback } from 'react';
import { Users, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useCreateUser } from '@/hooks/useUsers';
import { useTenantOptions } from '@/hooks/useTenants';

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin', desc: 'Acesso total ao tenant' },
  { value: 'MANAGER', label: 'Gerente', desc: 'Gerencia projetos e equipe' },
  { value: 'ENGINEER', label: 'Engenheiro', desc: 'Cria e edita projetos' },
  { value: 'VIEWER', label: 'Visualizador', desc: 'Somente leitura' },
];

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
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState('ENGINEER');
  const [tenantId, setTenantId] = useState(defaultTenantId ?? '');
  const [jobTitle, setJobTitle] = useState('');

  const { mutate: create, loading, error } = useCreateUser(onCreated);
  const { data: tenantOptions, loading: loadingTenants } = useTenantOptions();

  // Auto-gerar username a partir do nome completo
  const handleFullNameBlur = useCallback(() => {
    if (username) return;
    const generated = fullName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '.');
    setUsername(generated);
  }, [fullName, username]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !username || !password || !role || !tenantId) return;
    create({ fullName, username, password, role, tenantId, jobTitle: jobTitle || undefined }).catch(() => {});
  }

  const isValid = fullName.trim() && username.trim() && password.length >= 8 && role && tenantId;

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
        <Users className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-200">Novo Usuário</span>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">

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
            onBlur={handleFullNameBlur}
            placeholder="Ex: Carlos Souza"
            autoFocus
            className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
          />
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Username <span className="text-red-400">*</span>
          </label>
          <input
            id="create-user-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
            placeholder="carlos.souza"
            className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
          />
          <p className="text-[10px] text-slate-600">Único na plataforma. Gerado automaticamente ao preencher o nome.</p>
        </div>

        {/* Senha */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Senha Temporária <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              id="create-user-password"
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 pr-9 text-sm text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              tabIndex={-1}
            >
              {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          {password && password.length < 8 && (
            <p className="text-[10px] text-amber-400">Mínimo de 8 caracteres.</p>
          )}
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
            className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500/50 focus:outline-none disabled:opacity-50"
          >
            <option value="">— Selecionar organização —</option>
            {tenantOptions.map((t) => (
              <option key={t.id} value={t.id} disabled={t.status === 'BLOCKED'}>
                {t.name}{t.status === 'BLOCKED' ? ' (bloqueada)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Role */}
        <div className="space-y-2">
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Perfil de Acesso <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className={`rounded-sm border px-3 py-2 text-left transition-colors ${
                  role === opt.value
                    ? 'border-sky-500/50 bg-sky-500/10 text-sky-300'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                }`}
              >
                <p className="text-xs font-medium">{opt.label}</p>
                <p className="text-[10px] text-slate-500">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cargo (opcional) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Cargo <span className="text-slate-700">(opcional)</span>
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
          <p className="text-[11px] text-amber-300/80">
            Compartilhe a senha com o usuário por um canal seguro. Recomenda-se que ele a troque no primeiro acesso.
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
