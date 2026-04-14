import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComposerPlaceholderProps {
    type: 'module' | 'inverter';
    title: string;
    suggestionItem?: string;
    children?: React.ReactNode; 
    icon?: React.ReactNode;
}

export const ComposerPlaceholder: React.FC<ComposerPlaceholderProps> = ({ 
    type, 
    title, 
    suggestionItem, 
    children, 
    icon 
}) => {
   const isModule = type === 'module';
   
   return (
      <div className={cn(
          "relative rounded-sm border border-dashed flex flex-col p-4 shadow-lg shadow-black/10 transition-colors z-20 animate-in fade-in zoom-in-95 duration-500",
          isModule 
            ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10" 
            : "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
      )}>
          {/* LEGO Bump for module (Top) */}
          {isModule && (
              <div className="absolute -top-[12px] left-1/2 -translate-x-1/2 w-16 h-3 bg-amber-500/5 border-t border-l border-r border-dashed border-amber-500/30 rounded-t-md z-30 flex items-center justify-center">
                   <span className="text-[6px] font-bold text-amber-500/50 uppercase tracking-widest leading-none">+</span>
              </div>
          )}

          <div className="flex items-center gap-2 mb-3">
             <div className={cn(
                 "w-6 h-6 rounded flex items-center justify-center bg-slate-900 border border-slate-800",
                 isModule ? "text-amber-500" : "text-emerald-500"
             )}>
                 {icon || <Plus size={14} />}
             </div>
             <h4 className={cn(
                 "text-[10px] font-bold uppercase tracking-widest", 
                 isModule ? "text-amber-500/80" : "text-emerald-500/80"
             )}>
                 {title}
             </h4>
          </div>

          {suggestionItem && (
             <div className="text-[9px] text-slate-500 mb-4 px-1 leading-relaxed">
                 Sugestão compatível: <span className="font-bold text-slate-300">{suggestionItem}</span>
             </div>
          )}

          {/* Área Dinâmica (Selectors) */}
          <div className="mt-auto relative z-40">
             {children}
          </div>

          {/* LEGO Notch for Modulo Bottom */}
          {isModule && (
              <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-[62px] h-3 bg-slate-950 border-t border-l border-r border-dashed border-slate-800 rounded-t-md z-30" />
          )}
          {/* LEGO Notch for Inverter Top */}
          {!isModule && (
              <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[62px] h-3 bg-slate-950 border-t border-l border-r border-dashed border-slate-800 rounded-t-md z-30" />
          )}
      </div>
   );
};
