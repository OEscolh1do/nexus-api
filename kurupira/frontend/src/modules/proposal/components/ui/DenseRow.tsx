import React from 'react';
import { HelpCircle } from 'lucide-react';

export const DenseRow = ({
    label, value, suffix, description, highlight = false, info
}: {
    label: string,
    value: React.ReactNode,
    suffix?: string,
    description?: string,
    highlight?: boolean,
    info?: string
}) => (
    <div className={`flex justify-between items-center py-2 px-3 border-b border-slate-50 last:border-0 rounded-sm transition-colors ${highlight ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}`}>
        <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{label}</span>
                {info && (
                    <div className="group relative">
                        <HelpCircle size={10} className="text-slate-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg z-50">
                            {info}
                        </div>
                    </div>
                )}
            </div>
            {description && <span className="text-[10px] text-slate-400 leading-tight">{description}</span>}
        </div>
        <div className={`text-sm font-mono font-bold ${highlight ? 'text-indigo-700' : 'text-slate-800'}`}>
            {value} {suffix && <span className={`text-[10px] ${highlight ? 'text-indigo-400' : 'text-slate-400'} ml-0.5`}>{suffix}</span>}
        </div>
    </div>
);
