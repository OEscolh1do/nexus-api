
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
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 shrink-0 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Users className="text-purple-600 dark:text-purple-400" />
            Hub de Pessoas
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Pulso da equipe, disponibilidade e estrutura organizacional.
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl shadow-inner border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'ANALYTICS' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <BarChart size={16} /> Pulso & Carga
          </button>
          <button
            onClick={() => setActiveTab('CALENDAR')}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'CALENDAR' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <CalendarDays size={16} /> Calendário
          </button>
          <button
            onClick={() => setActiveTab('ORG')}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'ORG' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <GitFork size={16} /> Organograma
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
