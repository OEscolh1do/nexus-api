import { useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { useCreateTenant } from '@/hooks/useTenants';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CreateTenantFormProps {
  onClose: () => void;
  onCreated: (id: string, name: string) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PLAN_OPTIONS = [
  { value: 'FREE', label: 'Free', desc: '1.000 req/mês' },
  { value: 'STARTER', label: 'Starter', desc: '10.000 req/mês' },
  { value: 'PRO', label: 'Pro', desc: '100.000 req/mês' },
  { value: 'ENTERPRISE', label: 'Enterprise', desc: 'Ilimitado' },
];

const QUOTA_BY_PLAN: Record<string, number> = {
  FREE: 1000,
  STARTER: 10000,
  PRO: 100000,
  ENTERPRISE: 9999999,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function CreateTenantForm({ onClose, onCreated }: CreateTenantFormProps) {
  const [name, setName] = useState('');
  const [apiPlan, setApiPlan] = useState('FREE');
  const [apiMonthlyQuota, setApiMonthlyQuota] = useState(QUOTA_BY_PLAN['FREE']);

  const { mutate: create, loading, error } = useCreateTenant(onCreated);

  function handlePlanChange(plan: string) {
    setApiPlan(plan);
    setApiMonthlyQuota(QUOTA_BY_PLAN[plan] ?? 1000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    create({ name, apiPlan, apiMonthlyQuota }).catch(() => {});
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
        <Building2 className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-200">Nova Organização</span>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
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
            Plano de API
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PLAN_OPTIONS.map((opt) => (
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
                <p className="text-[10px] text-slate-500">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quota personalizada (exceto Enterprise) */}
        {apiPlan !== 'ENTERPRISE' && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Quota Mensal (requisições)
            </label>
            <input
              id="create-tenant-quota"
              type="number"
              value={apiMonthlyQuota}
              onChange={(e) => setApiMonthlyQuota(Number(e.target.value))}
              min={0}
              step={1000}
              className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-sm text-slate-200 focus:border-sky-500/50 focus:outline-none"
            />
          </div>
        )}

        {/* Info box */}
        <div className="rounded-sm border border-slate-800 bg-slate-900/50 px-3 py-2.5">
          <p className="text-[11px] text-slate-500">
            A organização será criada como <strong className="text-slate-400">Sub-Tenant</strong> sem usuários. Adicione usuários após a criação.
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
          disabled={loading || !name.trim()}
          className="flex items-center gap-2 rounded-sm border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-colors disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Criando…
            </>
          ) : (
            'Criar Organização'
          )}
        </button>
      </div>
    </form>
  );
}
