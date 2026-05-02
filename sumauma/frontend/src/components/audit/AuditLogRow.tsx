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
    return new Date(ts).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className={`border-b border-slate-800 transition-colors ${isExpanded ? 'bg-slate-900/50' : 'hover:bg-slate-800/30'}`}>
      <div 
        className="flex items-center gap-4 px-4 py-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-44 flex items-center gap-2 text-[11px] font-mono text-slate-500">
          <Clock className="h-3 w-3" />
          {formatTimestamp(log.timestamp)}
        </div>

        <div className="w-40 px-2 py-0.5 rounded-sm bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-sky-400 text-center truncate">
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
