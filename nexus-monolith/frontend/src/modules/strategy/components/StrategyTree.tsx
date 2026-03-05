import React, { useState } from 'react';
import type { Strategy, KeyResult, Risk } from '../types';
import { ChevronDown, ChevronRight, Target, AlertTriangle, Layers, Activity, ShieldAlert, Users, DollarSign, Cpu, Edit2, Trash2 } from 'lucide-react';

interface StrategyTreeProps {
  strategies: Strategy[];
  onEdit?: (strategy: Strategy) => void;
  onDelete?: (strategyId: string) => void;
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
    LOW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  };
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colors[level]}`}>{level}</span>;
}

const StatusBadge = ({ status }: { status: string }) => {
    const isActive = status === 'EM_ANDAMENTO' || status === 'ATIVE';
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
            {isActive ? 'ATIVO' : 'CONCLUIDO'}
        </span>
    )
}

const StrategyNode: React.FC<{ 
  strategy: Strategy; 
  level: number; 
  onEdit?: (strategy: Strategy) => void;
  onDelete?: (strategyId: string) => void;
}> = ({ strategy, level, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(true); 
  
  const hasChildren = strategy.children && strategy.children.length > 0;
  // Fallback to empty array if undefined
  const krs = strategy.keyResults || [];
  const risks = strategy.risks || [];

  const levelColor = level === 0 
    ? 'border-l-4 border-l-purple-500 bg-slate-50 dark:bg-slate-900/50' 
    : level === 1 
      ? 'border-l-2 border-l-emerald-500 ml-6' 
      : 'border-l border-slate-300 dark:border-slate-700 ml-12 opacity-90';

  return (
    <div className={`mb-4 transition-all duration-300 ${level === 0 ? 'mt-8' : 'mt-2'}`}>
      <div 
        className={`p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer ${levelColor} flex flex-col gap-3 group bg-white dark:bg-slate-800`}
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              className={`p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${!hasChildren && 'invisible'}`}
            >
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs`} style={{ backgroundColor: strategy.colorCode || '#6366f1' }}>
               {strategy.type === 'PILLAR' ? <Layers size={16} /> : <Target size={16} />}
            </div>

            <div>
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {strategy.title}
                {strategy.code && <span className="text-[10px] font-mono font-normal opacity-50 px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded">
                  {strategy.code}
                </span>}
              </h3>
              {strategy.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{strategy.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {risks.length > 0 && (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400" title={`${risks.length} Riscos Mapeados`}>
                  <ShieldAlert size={14} />
                  <span className="text-xs font-bold">{risks.length}</span>
                </div>
             )}
             
             {/* Action Buttons */}
             <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               {onEdit && (
                 <button
                   onClick={(e) => { e.stopPropagation(); onEdit(strategy); }}
                   className="p-1.5 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 transition-colors"
                   title="Editar"
                 >
                   <Edit2 size={14} />
                 </button>
               )}
               {onDelete && (
                 <button
                   onClick={(e) => { e.stopPropagation(); onDelete(strategy.id); }}
                   className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
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
          <div className="ml-12 pl-4 border-l border-slate-200 dark:border-slate-700 space-y-3 pt-2">
            
            {/* OKRs Mesh */}
            {krs.length > 0 && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                 {krs.map((kr: KeyResult) => (
                    <div key={kr.id} className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <PerspectiveIcon type={kr.perspective} />
                         <div>
                           <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{kr.title}</div>
                           <div className="text-[10px] text-slate-400 flex gap-1">
                               <span>{kr.indicatorType}</span> • <span>{kr.perspective}</span>
                           </div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-xs font-bold font-mono">
                            {kr.currentValue} / {kr.targetValue} {kr.unit}
                         </div>
                         <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                            <div 
                              className="h-full bg-purple-500" 
                              style={{ width: `${Math.min((kr.currentValue / kr.targetValue) * 100, 100)}%` }} 
                            />
                         </div>
                      </div>
                    </div>
                 ))}
               </div>
            )}

            {/* Risks Warning */}
            {risks.length > 0 && (
               <div className="bg-amber-50 dark:bg-amber-900/10 p-2 rounded border border-amber-100 dark:border-amber-800/30">
                 <h5 className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-500 mb-1 flex items-center gap-1">
                   <AlertTriangle size={10} /> Riscos Monitorados
                 </h5>
                 <div className="space-y-1">
                   {risks.map((risk: Risk) => (
                     <div key={risk.id} className="flex justify-between items-center text-xs">
                        <span className="text-slate-700 dark:text-slate-300">{risk.title}</span>
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
            <StrategyNode key={child.id} strategy={child} level={level + 1} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export const StrategicTree: React.FC<StrategyTreeProps> = ({ strategies, onEdit, onDelete }) => {
  // Filter only root nodes (Pillars) to start the tree
  const rootNodes = strategies.filter(s => !s.parentId);

  if (rootNodes.length === 0 && strategies.length > 0) {
      // Fallback: If no hierarchy found (legacy data), show flat list
      return (
          <div className="space-y-4">
              <div className="p-4 bg-amber-50 text-amber-800 text-xs rounded border border-amber-200">
                  Modo de compatibilidade: Estrutura plana (Sem hierarquia definida).
              </div>
              {strategies.map(s => <StrategyNode key={s.id} strategy={s} level={0} onEdit={onEdit} onDelete={onDelete} />)}
          </div>
      )
  }

  return (
    <div className="space-y-6">
      {rootNodes.map(pillar => (
        <StrategyNode key={pillar.id} strategy={pillar} level={0} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};
