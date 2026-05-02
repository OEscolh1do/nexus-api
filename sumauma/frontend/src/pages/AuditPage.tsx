import { useState } from 'react';
import { History, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAuditLogs, AuditLogsParams } from '@/hooks/useAuditLogs';
import AuditFilters from '@/components/audit/AuditFilters';
import AuditLogRow from '@/components/audit/AuditLogRow';

export default function AuditPage() {
  const [params, setParams] = useState<AuditLogsParams>({
    page: 1,
    limit: 50,
  });

  const { logs, pagination, loading, error, exportLogs } = useAuditLogs(params);

  const handlePageChange = (newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  };

  const handleFiltersChange = (newFilters: any) => {
    setParams(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleClearFilters = () => {
    setParams({ page: 1, limit: 50 });
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
            <History className="h-5 w-5 text-slate-500" />
            Logs de Auditoria
          </h1>
          <p className="text-xs text-slate-500">
            Rastreabilidade total de ações na plataforma Neonorte
          </p>
        </div>

        <button
          onClick={exportLogs}
          className="flex items-center gap-2 h-9 px-4 text-xs font-medium bg-slate-800 border border-slate-700 rounded-sm text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar CSV
        </button>
      </div>

      <AuditFilters 
        filters={params} 
        setFilters={handleFiltersChange} 
        onClear={handleClearFilters} 
      />

      <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-2 bg-slate-800/50 border-b border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <div className="w-44">Data / Hora</div>
          <div className="w-40 text-center">Ação</div>
          <div className="w-32">Usuário</div>
          <div className="w-40">Tenant</div>
          <div className="flex-1">Detalhes</div>
          <div className="w-24 text-right">IP</div>
          <div className="w-4"></div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-sm text-red-400">
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Nenhum log encontrado para os filtros selecionados.
            </div>
          ) : (
            logs.map(log => <AuditLogRow key={log.id} log={log} />)
          )}
        </div>

        {pagination && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800/30 border-t border-slate-800">
            <p className="text-[11px] text-slate-500">
              Total: <span className="text-slate-300 font-mono">{pagination.total}</span> logs encontrados
            </p>
            
            <div className="flex items-center gap-2">
              <button
                disabled={params.page === 1}
                onClick={() => handlePageChange((params.page || 1) - 1)}
                className="p-1.5 rounded-sm border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="text-[11px] font-medium text-slate-400 min-w-[60px] text-center">
                Página {params.page} / {pagination.totalPages}
              </span>

              <button
                disabled={params.page === pagination.totalPages}
                onClick={() => handlePageChange((params.page || 1) + 1)}
                className="p-1.5 rounded-sm border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
