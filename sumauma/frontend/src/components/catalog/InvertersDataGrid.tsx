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

  // Refetch when external trigger changes (e.g. after upload) and reset to page 1
  // so the user doesn't land on a now-empty page after a new item is added.
  useEffect(() => { setPage(1); refetch(); }, [refreshTrigger, refetch]);

  const handleFilterChange = useCallback((partial: Partial<Filters>) => {
    if ('q' in partial) setRawQ(partial.q ?? '');
    else setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }, []);

  if (selectedInverter) {
    return (
      <div className="flex-1 min-h-0 animate-in fade-in duration-500">
        <InverterDrawer
          inverterEquipment={selectedInverter}
          onClose={() => setSelectedInverter(null)}
          onMutated={refetch}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 mt-4 animate-in fade-in duration-500">
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
      <div className="flex flex-1 flex-col overflow-hidden rounded-sm border border-slate-800 bg-slate-900 shadow-xl">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Fabricante</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Modelo</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Potência AC</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Vmax CC</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Eficiência</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">MPPTs</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Diagramas</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-4"><div className="h-3 w-full animate-pulse rounded-full bg-slate-800/50" /></td>
                  </tr>
                ))}

              {error && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-red-400">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && inverters.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-xs text-slate-600 font-bold uppercase tracking-widest italic">
                    Nenhum equipamento localizado no catálogo global.
                  </td>
                </tr>
              )}

              {!loading && !error && inverters.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setSelectedInverter(m)}
                  className="group cursor-pointer hover:bg-sky-500/[0.03] transition-colors"
                >
                  <td className="px-4 py-3.5 text-xs font-bold text-slate-300">{m.manufacturer}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-400 font-mono group-hover:text-sky-400 transition-colors">{m.model}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-400 font-mono text-right">{(m.nominalPowerW / 1000).toFixed(1)} kW</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 font-mono text-right">
                    {m.maxInputV ? `${m.maxInputV}V` : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 font-mono text-right">
                    {m.efficiency ? `${(m.efficiency * (m.efficiency <= 1 ? 100 : 1)).toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-mono text-slate-500 text-center">
                    {m.mpptCount ?? '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center">
                      <div
                        title={m.typologyConfig ? 'Topologia configurada' : 'Sem topologia'}
                        className={`h-1.5 w-1.5 rounded-full ${m.typologyConfig ? 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'bg-slate-800'}`}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter ${m.isActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800 text-slate-600 border border-slate-700'}`}>
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
          <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3 bg-slate-900/50">
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{pagination.total} Equipamentos Registrados</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-mono min-w-[80px] text-center text-[11px] text-slate-400 font-bold">
                {page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.totalPages}
                className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
