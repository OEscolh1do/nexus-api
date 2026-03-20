
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { Users, BarChart, GitFork, CalendarDays } from 'lucide-react';
import { TeamCalendar } from '../components/TeamCalendar';
import { OrgTreeChart } from '../components/OrgTreeChart';
import { WorkloadHeatmap } from '../components/WorkloadHeatmap';
import type { WorkloadMetric } from '../types';

export const PeopleView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'ORG' | 'ANALYTICS'>('ANALYTICS');
  const [workloadData, setWorkloadData] = useState<WorkloadMetric[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // --- API ---
  const loadAnalytics = useCallback(async () => {
    setIsLoadingAnalytics(true);
    try {
        // Use shared API client and correct V2 route
        const workloadRes = await api.get('/ops/workload');
        // Backend returns { success: true, data: [...] }
        if (workloadRes.data && workloadRes.data.data) {
            setWorkloadData(workloadRes.data.data);
        }
    } catch(e) {
        console.error("Failed to load workload", e);
    } finally {
        setIsLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <div className="space-y-6 flex flex-col h-full max-w-7xl mx-auto pb-10">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 shrink-0 border-b border-slate-200/80 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-purple-500/20">
                <Users className="text-white w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Hub de Pessoas
            </h2>
          </div>
          <p className="text-slate-500 text-[14px]">
            Gestão operacional de equipes, capacidade (workload), férias e organograma.
          </p>
        </div>

        <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 w-full sm:w-auto overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-semibold rounded-lg transition-all min-w-fit ${activeTab === 'ANALYTICS' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/30 dark:hover:bg-slate-800/50'}`}
          >
            <BarChart className="w-4 h-4" /> Pulso & Carga
          </button>
          <button
            onClick={() => setActiveTab('CALENDAR')}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-semibold rounded-lg transition-all min-w-fit ${activeTab === 'CALENDAR' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/30 dark:hover:bg-slate-800/50'}`}
          >
            <CalendarDays className="w-4 h-4" /> Calendário
          </button>
          <button
            onClick={() => setActiveTab('ORG')}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-semibold rounded-lg transition-all min-w-fit ${activeTab === 'ORG' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/30 dark:hover:bg-slate-800/50'}`}
          >
            <GitFork className="w-4 h-4" /> Organograma
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {activeTab === 'ANALYTICS' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
             {isLoadingAnalytics ? ( 
                 <div className="p-12 text-center text-slate-400">Carregando métricas...</div> 
             ) : (
                 <WorkloadHeatmap metrics={workloadData} />
             )}
          </div>
        )}

        {activeTab === 'CALENDAR' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full">
            <TeamCalendar />
          </div>
        )}

        {activeTab === 'ORG' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <OrgTreeChart />
          </div>
        )}
      </div>
    </div>
  );
};
