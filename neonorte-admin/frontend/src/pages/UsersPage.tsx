import { useState, useCallback, useEffect } from 'react';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  Plus,
} from 'lucide-react';
import { useUsers, type User } from '@/hooks/useUsers';
import { useDebounce } from '@/hooks/useDebounce';
import api from '@/lib/api';
import RoleBadge from '@/components/users/RoleBadge';
import UserDrawer from '@/components/users/UserDrawer';

// ─── Filter bar ───────────────────────────────────────────────────────────────

interface Filters {
  q: string;
  tenantId: string;
  role: string;
}

interface TenantOption {
  id: string;
  name: string;
}

function FilterBar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
}) {
  const [tenants, setTenants] = useState<TenantOption[]>([]);

  useEffect(() => {
    api.get('/tenants/options')
      .then(res => setTenants(res.data.data))
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        <input
          id="users-search"
          type="text"
          placeholder="Buscar por nome ou username…"
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          className="h-8 w-64 rounded-sm border border-slate-700 bg-slate-800 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
        />
      </div>

      <SlidersHorizontal className="h-3.5 w-3.5 text-slate-600" />

      {/* Tenant filter */}
      <select
        id="users-filter-tenant"
        value={filters.tenantId}
        onChange={(e) => onChange({ tenantId: e.target.value })}
        className="h-8 rounded-sm border border-slate-700 bg-slate-800 px-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500/50 max-w-[200px]"
      >
        <option value="">Todas as organizações</option>
        {tenants.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      {/* Role filter */}
      <select
        id="users-filter-role"
        value={filters.role}
        onChange={(e) => onChange({ role: e.target.value })}
        className="h-8 rounded-sm border border-slate-700 bg-slate-800 px-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500/50"
      >
        <option value="">Todas as roles</option>
        <option value="PLATFORM_ADMIN">PLATFORM_ADMIN</option>
        <option value="ADMIN">ADMIN</option>
        <option value="ENGINEER">ENGINEER</option>
        <option value="VIEWER">VIEWER</option>
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
      <p className="text-[11px] text-slate-500">
        {total.toLocaleString('pt-BR')} usuários
      </p>
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

function UserRow({
  user,
  onClick,
}: {
  user: User;
  onClick: () => void;
}) {
  return (
    <tr
      className="grid-row cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Nome e Username */}
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <p className="text-xs font-medium text-slate-200">{user.fullName || user.username}</p>
          <p className="text-[10px] text-slate-500">{user.username}</p>
        </div>
      </td>

      {/* Tenant */}
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <p className="text-xs text-slate-300">{user.tenant?.name || '—'}</p>
          <p className="text-[10px] text-slate-600 font-tabular">{user.tenantId}</p>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>

      {/* Cargo */}
      <td className="px-4 py-3">
        <span className="text-xs text-slate-400">{user.jobTitle || '—'}</span>
      </td>

      {/* Criado em */}
      <td className="px-4 py-3 font-tabular text-[11px] text-slate-500">
        {new Date(user.createdAt).toLocaleDateString('pt-BR', {
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
  { label: 'Usuário', cls: 'w-[250px]' },
  { label: 'Organização', cls: 'w-[200px]' },
  { label: 'Role', cls: 'w-[120px]' },
  { label: 'Cargo', cls: 'w-[150px]' },
  { label: 'Criado em', cls: 'w-[110px]' },
];

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [rawQ, setRawQ] = useState('');
  const [filters, setFilters] = useState<Omit<Filters, 'q'>>({ tenantId: '', role: '' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedQ = useDebounce(rawQ, 300);

  const { data: users, pagination, loading, error, refetch } = useUsers({
    page,
    limit: PAGE_SIZE,
    q: debouncedQ || undefined,
    tenantId: filters.tenantId || undefined,
    role: filters.role || undefined,
  });

  const handleFilterChange = useCallback((partial: Partial<Filters>) => {
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
            <Users className="h-5 w-5 text-slate-500" />
            Usuários
          </h1>
          <p className="text-xs text-slate-500">Usuários do Kurupira-Iaçã — gestão cross-tenant de roles e permissões</p>
        </div>
        <div className="flex items-center gap-2">
          {pagination && (
            <span className="font-tabular rounded-sm border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-400">
              {pagination.total.toLocaleString('pt-BR')} usuários
            </span>
          )}
          <button
            id="btn-novo-usuario"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-sm border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={{ q: rawQ, ...filters }}
        onChange={handleFilterChange}
      />

      {/* DataGrid */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-sm border border-slate-800 bg-slate-900">
        {/* Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-slate-900">
              <tr className="border-b border-slate-800">
                {TABLE_COLS.map(({ label, cls }) => (
                  <th
                    key={label}
                    className={`${cls} px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500`}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {label === 'Usuário' && (
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
                    {Array.from({ length: TABLE_COLS.length }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 w-full animate-pulse rounded-sm bg-slate-800" />
                      </td>
                    ))}
                  </tr>
                ))}

              {error && (
                <tr>
                  <td colSpan={TABLE_COLS.length} className="px-4 py-12 text-center">
                    <p className="text-xs text-red-400">
                      {error}
                    </p>
                  </td>
                </tr>
              )}

              {!loading && !error && users.length === 0 && (
                <tr>
                  <td colSpan={TABLE_COLS.length} className="px-4 py-12 text-center">
                    <Users className="mx-auto mb-2 h-6 w-6 text-slate-700" />
                    <p className="text-xs text-slate-500">Nenhum usuário encontrado</p>
                  </td>
                </tr>
              )}

              {!loading &&
                users.map((u) => (
                  <UserRow key={u.id} user={u} onClick={() => setSelectedId(u.id)} />
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

      {/* Drawer — visualizar usuário */}
      {selectedId && (
        <UserDrawer userId={selectedId} onClose={() => setSelectedId(null)} onMutated={refetch} />
      )}

      {/* Drawer — criar usuário */}
      {createOpen && (
        <UserDrawer
          userId={null}
          onClose={() => setCreateOpen(false)}
          onMutated={() => { refetch(); setPage(1); }}
        />
      )}
    </div>
  );
}
