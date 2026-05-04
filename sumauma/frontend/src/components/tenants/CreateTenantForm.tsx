import { useState, useEffect } from 'react';
import { Building2, Loader2, Eye, EyeOff } from 'lucide-react';
import { useCreateTenant } from '@/hooks/useTenants';
import { PLAN_SEATS, QUOTA_BY_PLAN } from '@/lib/tenantUtils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CreateTenantFormProps {
  onClose: () => void;
  onCreated: (id: string, name: string) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PLAN_OPTIONS = [
  { value: 'FREE', label: 'Gratuito', desc: '1.000 simulações' },
  { value: 'STARTER', label: 'Starter', desc: '10.000 simulações' },
  { value: 'PRO', label: 'Pro', desc: '100.000 simulações' },
  { value: 'ENTERPRISE', label: 'Corporativo', desc: 'Simulações ilimitadas' },
];



// ─── Component ───────────────────────────────────────────────────────────────

export default function CreateTenantForm({ onClose, onCreated }: CreateTenantFormProps) {
  const [name, setName] = useState('');
  const [apiPlan, setApiPlan] = useState('FREE');
  const [apiMonthlyQuota, setApiMonthlyQuota] = useState(QUOTA_BY_PLAN['FREE']);

  const [ownerFullName, setOwnerFullName] = useState('');
  const [ownerUsername, setOwnerUsername] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tenantType, setTenantType] = useState<'CORPORATE' | 'INDIVIDUAL'>('CORPORATE');

  const { mutate: create, loading, error } = useCreateTenant(onCreated);

  useEffect(() => {
    if (!ownerFullName || ownerUsername) return;
    const generated = ownerFullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(' ')
      .slice(0, 2)
      .join('_');
    setOwnerUsername(generated);
  }, [ownerFullName, ownerUsername]);

  function handlePlanChange(plan: string) {
    setApiPlan(plan);
    setApiMonthlyQuota(QUOTA_BY_PLAN[plan] ?? 1000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tenantType === 'CORPORATE' && !name.trim()) return;
    if (!ownerFullName || !ownerUsername || ownerPassword.length < 8) return;
    
    create({ 
      name: tenantType === 'CORPORATE' ? name : `Workspace de ${ownerFullName.trim()}`, 
      apiPlan: tenantType === 'CORPORATE' ? apiPlan : 'FREE', 
      apiMonthlyQuota, 
      ownerFullName: ownerFullName.trim(),
      ownerUsername: ownerUsername.trim(),
      ownerPassword: ownerPassword,
      type: tenantType,
    }).catch(() => {});
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
        <Building2 className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-200">
          {tenantType === 'CORPORATE' ? 'Nova Organização (Empresa)' : 'Novo Cadastro (Autônomo)'}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {/* Tipo de Cliente */}
        <div className="space-y-2">
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Tipo de Cliente
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTenantType('CORPORATE')}
              className={`rounded-sm border px-3 py-2 text-left transition-colors ${
                tenantType === 'CORPORATE'
                  ? 'border-sky-500/50 bg-sky-500/10 text-sky-300'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              <p className="text-xs font-medium">Empresa</p>
              <p className="text-[10px] text-slate-500">Múltiplos usuários</p>
            </button>
            <button
              type="button"
              onClick={() => setTenantType('INDIVIDUAL')}
              className={`rounded-sm border px-3 py-2 text-left transition-colors ${
                tenantType === 'INDIVIDUAL'
                  ? 'border-sky-500/50 bg-sky-500/10 text-sky-300'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              <p className="text-xs font-medium">Autônomo (Indivíduo)</p>
              <p className="text-[10px] text-slate-500">Cria usuário + workspace padrão</p>
            </button>
          </div>
        </div>

        {tenantType === 'CORPORATE' && (
          <>
            {/* Nome */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Nome da Organização <span className="text-red-400">*</span>
          </label>
          <input
            id="create-tenant-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Construtora Amazônia Ltda."
            autoFocus
            className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
          />
        </div>



        {/* Plano */}
        <div className="space-y-2">
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Plano de Uso e Acessos
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PLAN_OPTIONS.map((opt) => {
              const maxSeats = PLAN_SEATS[opt.value] ?? 1;
              const isUnlimited = maxSeats > 1000;
              const seatsText = isUnlimited ? 'Usuários ilim.' : `${maxSeats} usuário${maxSeats > 1 ? 's' : ''}`;
              
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handlePlanChange(opt.value)}
                  className={`rounded-sm border px-3 py-2 text-left transition-colors ${
                    apiPlan === opt.value
                      ? 'border-sky-500/50 bg-sky-500/10 text-sky-300'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  <p className="text-xs font-medium">{opt.label}</p>
                  <p className="text-[10px] text-slate-500">{opt.desc} • {seatsText}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quota personalizada (exceto Enterprise) */}
        {apiPlan !== 'ENTERPRISE' && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Capacidade Mensal de Simulações
            </label>
            <input
              id="create-tenant-quota"
              type="number"
              value={apiMonthlyQuota}
              onChange={(e) => setApiMonthlyQuota(Number(e.target.value))}
              min={0}
              step={1000}
              className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 font-tabular text-sm text-slate-200 focus:border-sky-500/50 focus:outline-none"
            />
          </div>
            )}
          </>
        )}

        <div className="h-px bg-slate-800 my-4" />

        {/* Cadastro do Primeiro Usuário */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-200">
              {tenantType === 'CORPORATE' ? 'Primeiro Usuário (Administrador)' : 'Dados do Engenheiro'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {tenantType === 'CORPORATE' 
                ? 'Cria o acesso principal (Dono/Gestor) obrigatório para a empresa.' 
                : 'Cria o acesso e o workspace individual automaticamente.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Nome Completo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={ownerFullName}
              onChange={(e) => setOwnerFullName(e.target.value)}
              placeholder="Ex: Carlos Souza"
              required
              className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Identificador de Acesso <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={ownerUsername}
              onChange={(e) => setOwnerUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="carlos.souza"
              required
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
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-600">Mínimo 8 caracteres.</p>
          </div>
        </div>

        {/* Info box */}
        <div className="rounded-sm border border-slate-800 bg-slate-900/50 px-3 py-2.5">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {tenantType === 'CORPORATE' ? (
              <>
                <span className="block mb-1">
                  O plano <strong className="text-slate-300">{PLAN_OPTIONS.find(p => p.value === apiPlan)?.label}</strong> permite até <strong className="text-slate-300">{PLAN_SEATS[apiPlan] > 1000 ? 'Usuários ilimitados' : `${PLAN_SEATS[apiPlan]} usuários`}</strong> simultâneos na organização.
                </span>
                O preenchimento do primeiro usuário já lhe dá acesso imediato como Administrador ao Kurupira.
              </>
            ) : (
              <>O plano <strong className="text-slate-300">Gratuito</strong> padrão será atribuído a este usuário, com acesso restrito a um (1) membro e cota limitada.</>
            )}
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
          disabled={loading || (tenantType === 'CORPORATE' && !name.trim()) || !ownerFullName || !ownerUsername || ownerPassword.length < 8}
          className="flex items-center gap-2 rounded-sm border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-colors disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Criando…
            </>
          ) : (
            tenantType === 'CORPORATE' ? 'Criar Organização' : 'Criar Conta'
          )}
        </button>
      </div>
    </form>
  );
}
