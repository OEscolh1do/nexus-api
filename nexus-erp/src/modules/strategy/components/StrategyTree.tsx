import { useState, memo } from 'react';
import type { Strategy, KeyResult, Risk } from '../types';
import { ChevronDown, ChevronRight, Target, AlertTriangle, Layers, Activity, ShieldAlert, Users, DollarSign, Cpu, Edit2, Trash2, Plus } from 'lucide-react';

interface StrategyTreeProps {
  strategies: Strategy[];
  onEdit?: (strategy: Strategy) => void;
  onDelete?: (strategyId: string) => void;
  onAddKeyResult?: (strategyId: string) => void;
  onCheckIn?: (kr: KeyResult) => void;
  onAddRisk?: (strategyId: string) => void;
}

const PerspectiveIcon = ({ type }: { type?: string }) => {
  switch (type) {
    case 'FINANCIAL': return <DollarSign size={14} className="text-emerald-500" />;
    case 'CUSTOMER': return <Users size={14} className="text-blue-500" />;
    case 'PROCESS': return <Activity size={14} className="text-amber-500" />;
    case 'LEARNING': return <Cpu size={14} className="text-purple-500" />;
    default: return <Target size={14} className="text-slate-400" />;
  }
};

const RiskBadge = ({ level }: { level: 'LOW' | 'MEDIUM' | 'HIGH' }) => {
  const colors = {
    LOW: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    MEDIUM: 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    HIGH: 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${colors[level]}`}>{level}</span>;
}

const StatusBadge = ({ status }: { status: string }) => {
    const isActive = status === 'EM_ANDAMENTO' || status === 'ATIVE';
    return (
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${isActive ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-500/10 dark:border-indigo-500/20' : 'bg-slate-50 text-slate-600 border-slate-200/60 dark:bg-slate-800 dark:border-slate-700'}`}>
            {isActive ? 'ATIVO' : 'CONCLUIDO'}
        </span>
    )
}

const StrategyNode = memo<{ 
  strategy: Strategy; 
  level: number; 
  onEdit?: (strategy: Strategy) => void;
  onDelete?: (strategyId: string) => void;
  onAddKeyResult?: (strategyId: string) => void;
  onCheckIn?: (kr: KeyResult) => void;
  onAddRisk?: (strategyId: string) => void;
}>(({ strategy, level, onEdit, onDelete, onAddKeyResult, onCheckIn, onAddRisk }) => {
  const [expanded, setExpanded] = useState(true); 
  
  const hasChildren = strategy.children && strategy.children.length > 0;
  // Fallback to empty array if undefined
  const krs = strategy.keyResults || [];
  const risks = strategy.risks || [];

  const levelColor = level === 0 
    ? 'border-l-[3px] border-l-purple-500 bg-white shadow-sm border border-slate-200/60 dark:bg-slate-900/60 dark:border-slate-800' 
    : level === 1 
      ? 'border-l-[3px] border-l-emerald-500 bg-slate-50 border border-slate-200/60 dark:bg-slate-800/80 dark:border-slate-700/60 ml-6' 
      : 'border-l-[3px] border-l-sky-500 bg-slate-50 border border-slate-200/40 dark:bg-slate-800/50 dark:border-slate-700/40 ml-12 opacity-95';

  return (
    <div className={`mb-3 transition-all duration-300 ${level === 0 ? 'mt-6' : 'mt-2'}`}>
      <div 
        className={`p-4 rounded-xl hover:shadow-md transition-shadow cursor-pointer ${levelColor} flex flex-col gap-3 group`}
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button 
              className={`p-1 w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400 shrink-0 ${!hasChildren && 'invisible'}`}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ring-1 ring-black/5 shadow-sm shrink-0`} style={{ backgroundColor: strategy.colorCode || '#6366f1' }}>
               {strategy.type === 'PILLAR' ? <Layers size={16} /> : <Target size={16} />}
            </div>

            <div className="min-w-0">
              <h3 className="font-semibold text-[14px] text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight truncate">
                {strategy.title}
                {strategy.code && <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded-md shrink-0 border border-slate-200 dark:border-slate-700">
                  {strategy.code}
                </span>}
              </h3>
              {strategy.description && (
                <p className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{strategy.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 pl-10 sm:pl-0 sm:shrink-0">
             {risks.length > 0 && (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400" title={`${risks.length} Riscos Mapeados`}>
                  <ShieldAlert size={14} />
                  <span className="text-xs font-bold">{risks.length}</span>
                </div>
             )}
             
             {/* Action Buttons */}
             <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
               {onAddRisk && (
                 <button
                   onClick={(e) => { e.stopPropagation(); onAddRisk(strategy.id); }}
                   className="p-1.5 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/40 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                   title="Mapear Risco"
                 >
                   <ShieldAlert size={14} className="text-amber-500" />
                 </button>
               )}
               {onAddKeyResult && (
                 <button
                   onClick={(e) => { e.stopPropagation(); onAddKeyResult(strategy.id); }}
                   className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                   title="Adicionar Key Result"
                 >
                   <Target size={14} className="text-purple-500" />
                 </button>
               )}
               {onEdit && (
                 <button
                   onClick={(e) => { e.stopPropagation(); onEdit(strategy); }}
                   className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                   title="Editar"
                 >
                   <Edit2 size={14} />
                 </button>
               )}
               {onDelete && (
                 <button
                   onClick={(e) => { e.stopPropagation(); onDelete(strategy.id); }}
                   className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                   title="Excluir"
                 >
                   <Trash2 size={14} />
                 </button>
               )}
             </div>
             
             <StatusBadge status={strategy.isActive ? 'EM_ANDAMENTO' : 'CONCLUIDO'} />
          </div>
        </div>

        {/* METRICS & OKRs (Expanded) */}
        {expanded && (krs.length > 0 || risks.length > 0) && (
          <div className="ml-0 sm:ml-12 pl-0 sm:pl-4 border-t border-slate-100 dark:border-slate-800 sm:border-t-0 sm:border-l sm:border-slate-200 sm:dark:border-slate-700 space-y-4 pt-4 sm:pt-2">
            
            {/* OKRs Mesh */}
            {krs.length > 0 && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                 {krs.map((kr: KeyResult) => {
                    const progress = Math.min((kr.currentValue / kr.targetValue) * 100, 100);
                    return (
                     <div key={kr.id} className="bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3 group/kr relative">
                      <div className="flex items-start gap-2.5">
                         <div className="mt-0.5"><PerspectiveIcon type={kr.perspective} /></div>
                         <div className="min-w-0 pr-8">
                           <div className="text-[13px] font-medium text-slate-800 dark:text-slate-200 leading-snug break-words">{kr.title}</div>
                           <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                               <span className="font-semibold text-slate-600 dark:text-slate-400">{kr.indicatorType}</span>
                               <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                               <span>{kr.perspective}</span>
                           </div>
                         </div>
                      </div>

                      {/* Check-in Hover Action */}
                      {onCheckIn && (
                        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover/kr:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); onCheckIn(kr); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200/50 dark:border-emerald-500/20 transition-colors shadow-sm"
                            title="Fazer Check-in (Atualizar)"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                      <div className="text-right">
                         <div className="flex justify-between items-baseline mb-1.5">
                             <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                 {progress.toFixed(0)}%
                             </div>
                             <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono tracking-tight">
                                {kr.currentValue.toLocaleString()} / <span className="text-slate-400">{kr.targetValue.toLocaleString()} {kr.unit}</span>
                             </div>
                         </div>
                         <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" 
                              style={{ width: `${progress}%` }} 
                            />
                         </div>
                      </div>
                    </div>
                 )})}
               </div>
            )}

            {/* Risks Warning */}
            {risks.length > 0 && (
               <div className="bg-amber-50/80 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
                 <h5 className="text-[11px] uppercase font-bold text-amber-700 dark:text-amber-500 mb-2 flex items-center gap-1.5 tracking-wider">
                   <AlertTriangle size={12} className="text-amber-500" /> Matriz de Riscos ({risks.length})
                 </h5>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                   {risks.map((risk: Risk) => (
                     <div key={risk.id} className="flex justify-between items-center text-[13px] bg-white/60 dark:bg-slate-900/50 px-3 py-2 rounded-lg border border-amber-100/50 dark:border-amber-900/20 shadow-sm">
                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate pr-2">{risk.title}</span>
                        <RiskBadge level={risk.probability === 'HIGH' || risk.impact === 'HIGH' ? 'HIGH' : 'MEDIUM'} />
                     </div>
                   ))}
                 </div>
               </div>
            )}
          </div>
        )}
      </div>

      {/* Recursive Children */}
      {expanded && hasChildren && (
        <div className="pl-4">
          {strategy.children!.map(child => (
            <StrategyNode key={child.id} strategy={child} level={level + 1} onEdit={onEdit} onDelete={onDelete} onAddKeyResult={onAddKeyResult} onCheckIn={onCheckIn} onAddRisk={onAddRisk} />
          ))}
        </div>
      )}
    </div>
  );
});

export const StrategicTree = memo<StrategyTreeProps>(({ strategies, onEdit, onDelete, onAddKeyResult, onCheckIn, onAddRisk }) => {
  // Filter only root nodes (Pillars) to start the tree
  const rootNodes = strategies.filter(s => !s.parentId);

  if (rootNodes.length === 0 && strategies.length > 0) {
      // Fallback: If no hierarchy found (legacy data), show flat list
      return (
          <div className="space-y-4">
              <div className="p-4 bg-amber-50 text-amber-800 text-xs rounded border border-amber-200">
                  Modo de compatibilidade: Estrutura plana (Sem hierarquia definida).
              </div>
              {strategies.map(s => <StrategyNode key={s.id} strategy={s} level={0} onEdit={onEdit} onDelete={onDelete} onAddKeyResult={onAddKeyResult} onCheckIn={onCheckIn} onAddRisk={onAddRisk} />)}
          </div>
      )
  }

  return (
    <div className="space-y-6">
      {rootNodes.map(pillar => (
        <StrategyNode key={pillar.id} strategy={pillar} level={0} onEdit={onEdit} onDelete={onDelete} onAddKeyResult={onAddKeyResult} onCheckIn={onCheckIn} onAddRisk={onAddRisk} />
      ))}
    </div>
  );
});
