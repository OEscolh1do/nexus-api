import { useState, useCallback, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useInverters, type InverterEquipment } from '@/hooks/useCatalog';
import { useDebounce } from '@/hooks/useDebounce';
import InverterDrawer from './InverterDrawer';

interface Filters {
  q: string;
  isActive: string;
}

const PAGE_SIZE = 20;

export default function InvertersDataGrid({ refreshTrigger }: { refreshTrigger: number }) {
  const [page, setPage] = useState(1);
  const [rawQ, setRawQ] = useState('');
  const [filters, setFilters] = useState<Omit<Filters, 'q'>>({ isActive: '' });
  const [selectedInverter, setSelectedInverter] = useState<InverterEquipment | null>(null);

  const debouncedQ = useDebounce(rawQ, 300);

  const { data: inverters, pagination, loading, error, refetch } = useInverters({
    page,
    limit: PAGE_SIZE,
    q: debouncedQ || undefined,
    isActive: filters.isActive === 'true' ? true : filters.isActive === 'false' ? false : undefined,
  });

  // Refetch when external trigger changes (e.g. after upload)
  useEffect(() => { refetch(); }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = useCallback((partial: Partial<Filters>) => {
    if ('q' in partial) setRawQ(partial.q ?? '');
    else setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }, []);

  return (
    <div className="flex h-full flex-col gap-4 mt-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por fabricante ou modelo…"
            value={rawQ}
            onChange={(e) => handleFilterChange({ q: e.target.value })}
            className="h-8 w-64 rounded-sm border border-slate-700 bg-slate-800 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
          />
        </div>

        <SlidersHorizontal className="h-3.5 w-3.5 text-slate-600 ml-2" />
        
        <select
          value={filters.isActive}
          onChange={(e) => handleFilterChange({ isActive: e.target.value })}
          className="h-8 rounded-sm border border-slate-700 bg-slate-800 px-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500/50"
        >
          <option value="">Status: Todos</option>
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </select>
      </div>

      {/* Grid */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-sm border border-slate-800 bg-slate-900">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-slate-900">
              <tr className="border-b border-slate-800">
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">Fabricante</th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">Modelo</th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">Potência AC</th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">Conexão</th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">MPPTs</th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    <td colSpan={6} className="px-4 py-3"><div className="h-3 w-full animate-pulse rounded-sm bg-slate-800" /></td>
                  </tr>
                ))}
              
              {!loading && inverters.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-xs text-slate-500">
                    Nenhum inversor encontrado.
                  </td>
                </tr>
              )}

              {!loading && inverters.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setSelectedInverter(m)}
                  className="grid-row cursor-pointer"
                >
                  <td className="px-4 py-3 text-xs font-medium text-slate-200">{m.manufacturer}</td>
                  <td className="px-4 py-3 text-xs text-slate-300 font-mono">{m.model}</td>
                  <td className="px-4 py-3 text-xs text-slate-300 font-mono">{(m.nominalPowerW / 1000).toFixed(1)} kW</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {m.electricalData?.phase ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">
                    {m.mpptCount ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${m.isActive ? 'badge-active' : 'badge-blocked'}`}>
                      {m.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
            <p className="text-[11px] text-slate-500">{pagination.total} inversores</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-sm border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="font-tabular min-w-[64px] text-center text-[11px] text-slate-500">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-sm border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedInverter && (
        <InverterDrawer
          inverterEquipment={selectedInverter}
          onClose={() => setSelectedInverter(null)}
          onMutated={refetch}
        />
      )}
    </div>
  );
}
