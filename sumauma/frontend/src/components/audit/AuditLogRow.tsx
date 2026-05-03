import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, User, Building2 } from 'lucide-react';
import { AuditLog } from '@/hooks/useAuditLogs';
import DiffViewer from './DiffViewer';

interface AuditLogRowProps {
  log: AuditLog;
}

export default function AuditLogRow({ log }: AuditLogRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    const abs = date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    
    // Simples tempo relativo
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    let relative = '';
    if (minutes < 1) relative = 'agora';
    else if (minutes < 60) relative = `há ${minutes} min`;
    else if (hours < 24) relative = `há ${hours} h`;
    else relative = `há ${days} d`;

    return { abs, relative };
  };

  const getActionColor = (action: string) => {
    if (action === 'ADMIN_LOGIN') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (action === 'ADMIN_LOGOUT') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (action.includes('DELETE')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (action.includes('CREATE')) return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    return 'bg-slate-800 text-slate-400 border-slate-700';
  };

  return (
    <div className={`border-b border-slate-800 transition-colors ${isExpanded ? 'bg-slate-900/50' : 'hover:bg-slate-800/30'}`}>
      <div 
        className="flex items-center gap-4 px-4 py-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-44 flex flex-col justify-center text-[11px] font-mono leading-tight">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="h-3 w-3" />
            {formatTimestamp(log.timestamp).abs}
          </div>
          <span className="text-[10px] text-slate-600 ml-4.5">{formatTimestamp(log.timestamp).relative}</span>
        </div>

        <div className={`w-40 px-2 py-0.5 rounded-sm border ${getActionColor(log.action)} text-[10px] font-bold uppercase tracking-wider text-center truncate`}>
          {log.action}
        </div>

        <div className="w-32 flex items-center gap-1.5 text-xs text-slate-300 truncate">
          <User className="h-3 w-3 text-slate-500" />
          {log.user?.username || 'Sistema'}
        </div>

        <div className="w-40 flex items-center gap-1.5 text-xs text-slate-400 truncate">
          <Building2 className="h-3 w-3 text-slate-600" />
          {log.tenant?.name || 'Global'}
        </div>

        <div className="flex-1 text-xs text-slate-500 truncate">
          {log.details || '-'}
        </div>

        <div className="w-24 text-[10px] font-mono text-slate-600 text-right">
          {log.ipAddress || '0.0.0.0'}
        </div>

        <div className="text-slate-600">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-14 pb-6 space-y-4 animate-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-medium uppercase text-slate-500">Entidade</span>
              <p className="text-xs text-slate-200">{log.entity || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-medium uppercase text-slate-500">Resource ID</span>
              <p className="text-[10px] font-mono text-slate-400">{log.resourceId || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-medium uppercase text-slate-500">User Agent</span>
              <p className="text-[10px] text-slate-500 truncate" title={log.userAgent || ''}>{log.userAgent || 'N/A'}</p>
            </div>
          </div>

          <DiffViewer before={log.before} after={log.after} />
        </div>
      )}
    </div>
  );
}
