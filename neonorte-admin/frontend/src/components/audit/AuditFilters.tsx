
import { Search, XCircle } from 'lucide-react';

interface AuditFiltersProps {
  filters: any;
  setFilters: (filters: any) => void;
  onClear: () => void;
}

export default function AuditFilters({ filters, setFilters, onClear }: AuditFiltersProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev: any) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-900 border border-slate-800 rounded-sm">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-medium uppercase text-slate-500">Busca Detalhes</label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            name="q"
            value={filters.q || ''}
            onChange={handleChange}
            placeholder="Filtrar por detalhes..."
            className="h-8 w-48 pl-8 pr-3 text-xs bg-slate-800 border border-slate-700 rounded-sm text-slate-200 focus:outline-none focus:border-sky-500/50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-medium uppercase text-slate-500">Ação</label>
        <input
          name="action"
          value={filters.action || ''}
          onChange={handleChange}
          placeholder="Ex: USER_CREATED"
          className="h-8 w-40 px-3 text-xs bg-slate-800 border border-slate-700 rounded-sm text-slate-200 focus:outline-none focus:border-sky-500/50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-medium uppercase text-slate-500">Data De</label>
        <input
          type="date"
          name="dateFrom"
          value={filters.dateFrom || ''}
          onChange={handleChange}
          className="h-8 px-3 text-xs bg-slate-800 border border-slate-700 rounded-sm text-slate-200 focus:outline-none focus:border-sky-500/50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-medium uppercase text-slate-500">Data Até</label>
        <input
          type="date"
          name="dateTo"
          value={filters.dateTo || ''}
          onChange={handleChange}
          className="h-8 px-3 text-xs bg-slate-800 border border-slate-700 rounded-sm text-slate-200 focus:outline-none focus:border-sky-500/50"
        />
      </div>

      <button
        onClick={onClear}
        className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
      >
        <XCircle className="h-3.5 w-3.5" />
        Limpar
      </button>
    </div>
  );
}
