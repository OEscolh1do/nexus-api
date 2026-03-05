import React, { useMemo } from 'react';
import { Compass, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, Badge } from '../../../components/ui/mock-components';
import type { Strategy } from '../types';

// We need a Project type here, or import it. 
// For loose coupling, I'll define a local interface or import if available.
interface ProjectSummary {
  id: string;
  title: string;
  strategyId?: string;
  progressPercentage: number;
}

interface StrategyCompassProps {
  strategies: Strategy[];
  projects: ProjectSummary[];
}

export const StrategyCompass: React.FC<StrategyCompassProps> = ({ strategies, projects }) => {
  
  // 1. Flatten Strategies is not needed if we just want roots for North Star, but for KR we use the list provided.
  // The list 'strategies' likely contains ALL nodes (flat from backend).
  
  const pillars = useMemo(() => strategies.filter(s => s.type === 'PILLAR' || !s.parentId), [strategies]);
  
  const allKeyResults = useMemo(() => {
    // Strategies is already a flat list of all nodes. No need to recurse.
    // Just map and flatten.
    return strategies.flatMap(strategy => 
        (strategy.keyResults || []).map(kr => ({
            kr,
            strategyTitle: strategy.title
        }))
    );
  }, [strategies]);

  // 2. Map Projects to Strategies
  const alignmentMap = useMemo(() => {
     const map = new Map<string, ProjectSummary[]>();
     projects.forEach(p => {
         if(p.strategyId) {
             const existing = map.get(p.strategyId) || [];
             map.set(p.strategyId, [...existing, p]);
         }
     });
     return map;
  }, [projects]);

  return (
    <div className="space-y-8 p-2">
       
       {/* 1. NORTH STAR HEADER */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {pillars.map(pillar => (
               <Card key={pillar.id} className="p-4 border-l-4" style={{ borderLeftColor: pillar.colorCode || '#6366f1' }}>
                   <div className="flex items-center gap-3 mb-2">
                       <Compass size={24} style={{ color: pillar.colorCode || '#6366f1' }} />
                       <h3 className="font-bold text-lg">{pillar.title}</h3>
                   </div>
                   <p className="text-sm text-slate-500 mb-3 line-clamp-2">{pillar.description || "Objetivo estratégico principal da organização."}</p>
                   {/* Mini Project Count */}
                   <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                       <Zap size={14} className="text-amber-500" />
                       <span>{alignmentMap.get(pillar.id)?.length || 0} Projetos Vinculados</span>
                   </div>
               </Card>
           ))}
       </div>

       {/* 2. ALIGNMENT MATRIX */}
       <div>
           <h4 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-200">
               <Zap className="text-amber-500" /> Matriz de Alinhamento Tático
           </h4>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {strategies.flatMap(s => s.children || []).map(strategy => {
                   const linkedProjects = alignmentMap.get(strategy.id) || [];
                   return (
                       <Card key={strategy.id} className="p-0 overflow-hidden flex flex-col">
                           <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b flex justify-between items-center">
                               <span className="font-semibold text-sm truncate" title={strategy.title}>{strategy.title}</span>
                               <Badge variant="outline">{linkedProjects.length}</Badge>
                           </div>
                           <div className="p-3 flex-1 bg-white dark:bg-slate-950">
                               {linkedProjects.length > 0 ? (
                                   <ul className="space-y-2">
                                       {linkedProjects.map(p => (
                                           <li key={p.id} className="text-xs flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-colors cursor-default">
                                               <span className="truncate flex-1">{p.title}</span>
                                               <span className={`text-[10px] font-bold px-1.5 rounded-full ${p.progressPercentage === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                   {p.progressPercentage}%
                                               </span>
                                           </li>
                                       ))}
                                   </ul>
                               ) : (
                                   <div className="h-full flex flex-col items-center justify-center text-slate-300 py-4 gap-2">
                                       <AlertTriangle size={16} />
                                       <span className="text-xs">Sem projetos vinculados</span>
                                   </div>
                               )}
                           </div>
                       </Card>
                   )
               })}
           </div>
       </div>

       {/* 3. KEY RESULTS SCORECARD */}
       <div>
            <h4 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-200">
               <TrendingUp className="text-emerald-500" /> Scorecard de Resultados (KPIs)
           </h4>
           <div className="bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-sm">
               <div className="space-y-4">
                   {allKeyResults.map(({ kr, strategyTitle }) => {
                       const progress = Math.min((kr.currentValue / kr.targetValue) * 100, 100);
                       return (
                           <div key={kr.id} className="flex items-center gap-4 py-2 border-b last:border-0 border-slate-100 dark:border-slate-800">
                               <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0">
                                   {Math.round(progress)}%
                               </div>
                               <div className="flex-1 min-w-0">
                                   <div className="flex justify-between mb-1">
                                       <span className="font-medium text-sm truncate" title={kr.title}>{kr.title}</span>
                                       <span className="text-xs text-slate-500">{kr.currentValue} / {kr.targetValue} {kr.unit}</span>
                                   </div>
                                   <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                       <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-emerald-500' : progress >= 70 ? 'bg-indigo-500' : 'bg-amber-500'}`} 
                                            style={{ width: `${progress}%` }} 
                                        />
                                   </div>
                                   <p className="text-[10px] text-slate-400 mt-1 truncate">Vinculado a: {strategyTitle}</p>
                               </div>
                           </div>
                       )
                   })}
                   {allKeyResults.length === 0 && (
                       <div className="text-center text-slate-400 py-4 text-sm">Nenhum Key Result monitorado no momento.</div>
                   )}
               </div>
           </div>
       </div>
    </div>
  );
};
