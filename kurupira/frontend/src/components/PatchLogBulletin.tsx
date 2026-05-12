import React, { useState } from 'react';
import { X, Bell, Rocket, Wrench, Bug, Zap, Shield, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import changelogData from '../assets/changelog.json';

interface LogEntry {
  type: string;
  text: string;
}

interface VersionEntry {
  version: string;
  date: string;
  logs: LogEntry[];
}

const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'feature': return <Rocket size={12} className="text-emerald-400" />;
    case 'improvement': return <Zap size={12} className="text-sky-400" />;
    case 'fix': return <Bug size={12} className="text-red-400" />;
    case 'performance': return <Zap size={12} className="text-amber-400" />;
    case 'security': return <Shield size={12} className="text-indigo-400" />;
    default: return <Wrench size={12} className="text-slate-400" />;
  }
};

export const PatchLogBulletin: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const latestVersion = changelogData[0]?.version || '0.0.0';

  return (
    <>
      {/* Gatilho Flutuante (Neurodesign: Padrão Z / Canto Inferior Direito) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full shadow-lg hover:border-emerald-500/50 hover:bg-slate-800 transition-all group"
      >
        <div className="relative">
          <Bell size={14} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        </div>
        <div className="flex flex-col items-start leading-none">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Engineering Bulletin</span>
          <span className="text-[10px] font-mono font-bold text-slate-300">v{latestVersion}</span>
        </div>
      </button>

      {/* Drawer Lateral (Industrial Design) */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-[#0B0D13] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-sm">
                  <Bell size={18} className="text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Patch Logs</h2>
                  <p className="text-[10px] font-medium text-slate-500">Últimas atualizações do sistema</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-800">
              {(changelogData as VersionEntry[]).map((entry, idx) => (
                <div key={entry.version} className="relative">
                  {/* Linha de Conexão (Timeline) */}
                  {idx < changelogData.length - 1 && (
                    <div className="absolute left-[7px] top-6 bottom-[-32px] w-[1px] bg-slate-800" />
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 z-10 bg-[#0B0D13]",
                      idx === 0 ? "border-emerald-500" : "border-slate-800"
                    )} />
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-black text-slate-100 font-mono tracking-tight">v{entry.version}</span>
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{entry.date}</span>
                    </div>
                  </div>

                  <div className="pl-7 space-y-3">
                    {entry.logs.map((log, lIdx) => (
                      <div key={lIdx} className="flex gap-3 group">
                        <div className="mt-1 flex-shrink-0">
                          <TypeIcon type={log.type} />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                          {log.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/10">
              <div className="p-4 rounded-sm bg-slate-900/40 border border-slate-800 flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-amber-500/50" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual de Boas Práticas</span>
                </div>
                <ChevronRight size={14} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
