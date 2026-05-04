import { useState, useCallback } from 'react';
import {
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  ArrowUpDown,
  Plus,
  Briefcase,
  User2,
} from 'lucide-react';
import { useTenants, type Tenant } from '@/hooks/useTenants';
import TenantStatusBadge from '@/components/tenants/TenantStatusBadge';
import TenantDrawer from '@/components/tenants/TenantDrawer';
import { useDebounce } from '@/hooks/useDebounce';

import { PLAN_SEATS } from '@/lib/tenantUtils';
// ─── Plan badge ───────────────────────────────────────────────────────────────

const PLAN_COLOR: Record<string, string> = {
  FREE: 'badge-pending',
  STARTER: 'badge-info',
  PRO: 'badge-active',
  ENTERPRISE: 'text-violet-400 bg-violet-500/10 border border-violet-500/20',
};

function PlanBadge({ plan }: { plan: string }) {
  return <span className={`badge ${PLAN_COLOR[plan] ?? 'badge-info'}`}>{plan}</span>;
}

// ─── API usage mini-bar ───────────────────────────────────────────────────────

function UsageBar({ current, quota }: { current: number; quota: number }) {
  const pct = quota > 0 ? Math.min((current / quota) * 100, 100) : 0;
  const color = pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 rounded-full bg-slate-800">
        <div className={`h-1 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-tabular text-[11px] text-slate-500">{pct.toFixed(0)}%</span>
    </div>
  );
}

// ─── Seats mini-bar ───────────────────────────────────────────────────────────

function SeatsBar({ current, plan }: { current: number; plan: string }) {
  const max = PLAN_SEATS[plan] ?? 5;
  const isUnlimited = max > 1000;
  const pct = isUnlimited ? 0 : Math.min((current / max) * 100, 100);
  const color = pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-amber-500' : 'bg-emerald-500';
  
  if (isUnlimited) {
    return <span className="font-tabular text-[11px] text-slate-500">{current} / Ilimitado</span>;
  }
  
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-12 rounded-full bg-slate-800">
        <div className={`h-1 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-tabular text-[11px] text-slate-500">{current}/{max}</span>
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

interface Filters {
  q: string;
  plan: string;
}

function FilterBar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        <input
          id="tenants-search"
          type="text"
          placeholder="Buscar organização…"
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          className="h-8 w-56 rounded-sm border border-slate-700 bg-slate-800 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
        />
      </div>



      {/* Plan filter */}
      <select
        id="tenants-filter-plan"
        value={filters.plan}
        onChange={(e) => onChange({ plan: e.target.value })}
        className="h-8 rounded-sm border border-slate-700 bg-slate-800 px-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500/50"
      >
        <option value="">Todos os planos</option>
        <option value="FREE">FREE</option>
        <option value="STARTER">STARTER</option>
        <option value="PRO">PRO</option>
        <option value="ENTERPRISE">ENTERPRISE</option>
      </select>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
      <p className="text-[11px] text-slate-500">{total.toLocaleString('pt-BR')} organizações</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="flex h-7 w-7 items-center justify-center rounded-sm border border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200 disabled:opacity-30 transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="font-tabular min-w-[64px] text-center text-[11px] text-slate-500">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="flex h-7 w-7 items-center justify-center rounded-sm border border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200 disabled:opacity-30 transition-colors"
          aria-label="Próxima página"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function TenantRow({ tenant, onClick }: { tenant: Tenant; onClick: () => void }) {
  return (
    <tr
      className="grid-row cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Name + type */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {tenant.type === 'MASTER' && (
            <Shield className="h-3.5 w-3.5 shrink-0 text-violet-400" />
          )}
          <div>
            <p className="text-xs font-medium text-slate-200">{tenant.name}</p>
            {tenant.type === 'CORPORATE' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                <Briefcase className="h-2.5 w-2.5" />
                Empresa
              </span>
            )}
            {tenant.type === 'INDIVIDUAL' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-sky-500/70 mt-0.5">
                <User2 className="h-2.5 w-2.5" />
                Autônomo
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Plan */}
      <td className="px-4 py-3">
        <PlanBadge plan={tenant.apiPlan} />
      </td>

      {/* Seats */}
      <td className="px-4 py-3">
        <SeatsBar current={tenant._count.users} plan={tenant.apiPlan} />
      </td>

      {/* API usage */}
      <td className="px-4 py-3">
        <UsageBar current={tenant.apiCurrentUsage} quota={tenant.apiMonthlyQuota} />
      </td>

      {/* SSO */}
      <td className="px-4 py-3">
        {tenant.ssoEnforced ? (
          <span className="badge badge-active">SSO</span>
        ) : (
          <span className="text-[11px] text-slate-600">—</span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <TenantStatusBadge status={tenant.status} />
      </td>

      {/* Created at */}
      <td className="px-4 py-3 font-tabular text-[11px] text-slate-500">
        {new Date(tenant.createdAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const TABLE_COLS = [
  { label: 'Organização', cls: 'w-[260px]' },
  { label: 'Plano', cls: 'w-[100px]' },
  { label: 'Assentos', cls: 'w-[120px]' },
  { label: 'Uso de API', cls: 'w-[140px]' },
  { label: 'SSO', cls: 'w-[70px]' },
  { label: 'Status', cls: 'w-[90px]' },
  { label: 'Criado em', cls: 'w-[100px]' },
];

export default function TenantsPage() {
  const [page, setPage] = useState(1);
  const [rawQ, setRawQ] = useState('');
  const [filters, setFilters] = useState({ plan: '' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedQ = useDebounce(rawQ, 300);

  const { data: tenants, pagination, loading, error, refetch } = useTenants({
    page,
    limit: PAGE_SIZE,
    q: debouncedQ || undefined,
    plan: filters.plan || undefined,
  });

  const handleFilterChange = useCallback((partial: Partial<{ q: string; plan: string }>) => {
    if ('q' in partial) setRawQ(partial.q ?? '');
    else setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }, []);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
            <Building2 className="h-5 w-5 text-slate-500" />
            Organizações
          </h1>
          <p className="text-xs text-slate-500">Organizações do Kurupira-Iaçã — planos, assinaturas e limites de API</p>
        </div>
        <div className="flex items-center gap-2">
          {pagination && (
            <span className="font-tabular rounded-sm border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-400">
              {pagination.total.toLocaleString('pt-BR')} org.
            </span>
          )}
          <button
            id="btn-nova-organizacao"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-sm border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova Organização
          </button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar filters={{ q: rawQ, ...filters }} onChange={handleFilterChange} />

      {/* DataGrid */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-sm border border-slate-800 bg-slate-900">
        {/* Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-slate-900">
              <tr className="border-b border-slate-800">
                {TABLE_COLS.map(({ label, cls }) => (
                  <th
                    key={label}
                    className={`${cls} px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500`}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {label === 'Organização' && (
                        <ArrowUpDown className="h-3 w-3 text-slate-700" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 w-full animate-pulse rounded-sm bg-slate-800" />
                      </td>
                    ))}
                  </tr>
                ))}

              {error && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <p className="text-xs text-red-400">{error}</p>
                  </td>
                </tr>
              )}

              {!loading && !error && tenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Building2 className="mx-auto mb-2 h-6 w-6 text-slate-700" />
                    <p className="text-xs text-slate-500">Nenhuma organização encontrada</p>
                  </td>
                </tr>
              )}

              {!loading &&
                tenants.map((t) => (
                  <TenantRow key={t.id} tenant={t} onClick={() => setSelectedId(t.id)} />
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPage={setPage}
          />
        )}
      </div>

      {/* Drawer — visualizar organização */}
      {selectedId && (
        <TenantDrawer
          tenantId={selectedId}
          onClose={() => setSelectedId(null)}
          onMutated={refetch}
        />
      )}

      {/* Drawer — criar organização */}
      {createOpen && (
        <TenantDrawer
          tenantId={null}
          onClose={() => setCreateOpen(false)}
          onMutated={() => { refetch(); setPage(1); }}
        />
      )}
    </div>
  );
}
