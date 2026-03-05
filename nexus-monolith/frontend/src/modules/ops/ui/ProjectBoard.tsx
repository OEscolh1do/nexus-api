
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { OpsService } from '../ops.service';
import { Target, AlertTriangle, Calendar, MoreVertical, Briefcase, Clock, CheckCircle2, ChevronRight, User } from 'lucide-react';
// FrappeGantt import removed as unused

import type { OperationalTask, Project, Strategy } from '../types';

// Helper UI Components (Inline for now to avoid dependency hell)
const GlassCard: React.FC<{children: React.ReactNode, className?: string}> = ({children, className}) => (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm ${className}`}>{children}</div>
);

const StatusBadge: React.FC<{status: string}> = ({status}) => {
    let color = 'bg-slate-100 text-slate-600';
    if(status === 'ATIVO') color = 'bg-emerald-100 text-emerald-700';
    if(status === 'ATRASADO') color = 'bg-red-100 text-red-700';
    return <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${color}`}>{status}</span>;
}

// Internal Project Card Component
const ProjectCard: React.FC<{
  project: Project & { progressPercentage: number; strategyId?: string; managerId?: string };
  strategy?: Strategy;
  tasks: OperationalTask[];
  onOpenDetails: () => void;
}> = ({ project, strategy, tasks, onOpenDetails }) => {

  const today = new Date();
  const end = strategy?.endDate ? new Date(strategy.endDate) : new Date();
  const isLate = today > end && project.progressPercentage < 100;
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <GlassCard className="group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
      <div className="flex flex-col md:flex-row items-stretch min-h-[120px]">

        {/* LEFT COLUMN: Identity & Status */}
        <div className="p-5 shrink-0 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <StatusBadge status={project.status} />
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <MoreVertical size={16} />
              </button>
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight mb-2">{project.title}</h3>
            {strategy && (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium tracking-wide uppercase">
                <Target size={12} style={{ color: strategy.colorCode }} />
                {strategy.code}
                </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <User size={12} />
            <span>Gerente: <strong className="text-slate-600 dark:text-slate-300">{project.managerId || 'N/A'}</strong></span>
          </div>
        </div>

        {/* MIDDLE COLUMN: Execution & Progress */}
        <div className="p-5 flex-1 flex flex-col justify-center gap-4">

          {/* Progress Section */}
          <div>
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className="text-slate-500">Execução Global</span>
              <span className="text-slate-700 dark:text-white">{project.progressPercentage}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${project.progressPercentage === 100 ? 'bg-emerald-500' : 'bg-linear-to-r from-blue-500 to-indigo-500'}`}
                style={{ width: `${project.progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Timeline Info (Horizontal) */}
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-slate-50 dark:bg-slate-900/50 rounded text-slate-400"><Calendar size={14} /></span>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Prazo Final</span>
                <span className={`font-semibold ${isLate ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                  {daysRemaining > 0 ? `${daysRemaining} dias` : 'Encerrado'}
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-100 dark:bg-slate-800" />

            {/* Mini Task Stats */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-slate-500">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span>{tasks.filter(t => t.status === 'CONCLUIDO').length}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <Clock size={12} className="text-slate-400" />
                <span>{tasks.filter(t => t.status !== 'CONCLUIDO').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Actions */}
        <div className="p-4 w-full md:w-32 bg-slate-50/50 dark:bg-slate-900/20 md:border-l border-slate-100 dark:border-slate-800 flex md:flex-col items-center justify-center gap-2">
          <button 
            onClick={onOpenDetails}
            className="w-full py-2 px-3 rounded-lg text-xs font-bold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center gap-1"
          >
            Detalhes <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

export const ProjectBoard: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [projects, setProjects] = useState<(Project & { progressPercentage: number, strategyId?: string })[]>([]);
  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // API Call Helper removed in favor of shared api client and OpsService

  const loadData = useCallback(async () => {
      setIsLoading(true);
      try {
          // 1. Fetch Strategies
          // Server maps /api/v2/strategies. Client base is /api/v2. So /strategies.
          const stratP = api.get('/strategies'); 

          // 2. Fetch Projects (via Service which calls /v2/ops/projects)
          const projP = OpsService.getAllProjects(); 

          const [stratRes, projectsData] = await Promise.all([stratP, projP]);

          // Strategies
          if(stratRes.data && stratRes.data.success) {
             setStrategies(stratRes.data.data);
          }

          // Projects (OpsService returns T directly if successful, or throws)
          setProjects(projectsData.map(p => ({
              ...p,
              progressPercentage: p.progressPercentage || 0, // Ensure prop exists
              strategyId: p.strategyId || undefined
          })));

          // 3. Flatten Tasks from Projects
          const allTasks = projectsData.flatMap(p => 
            (p.tasks || []).map(t => ({
                ...t, 
                projectId: p.id,
                endDate: t.endDate || undefined, // Types compatibility
                completionPercent: t.completionPercent || 0
            }))
          );
          setTasks(allTasks as OperationalTask[]);

      } catch (e) {
          console.error("Board Load Error", e);
      } finally {
          setIsLoading(false);
      }
  }, []);


  useEffect(() => {
      loadData();
  }, [loadData]);

  const activeProjects = projects.filter(p => p.status === 'ATIVO' || !p.status); // Fallback status
  const criticalCount = projects.filter(p => p.progressPercentage < 50).length; // Simplified logic

  if (isLoading) {
      return (
          <div className="flex bg-slate-50 dark:bg-slate-950 h-screen items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
      );
  }

  return (
    <div className="space-y-8 pb-20 max-w-[95%] xl:max-w-[1800px] mx-auto p-6">

      {/* HEADER WITH STATS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Briefcase className="text-indigo-600 dark:text-indigo-400" />
            Portfólio de Projetos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Gestão executiva e acompanhamento de entregas.
          </p>
        </div>

        <div className="flex gap-4">
          <GlassCard className="px-5 py-3 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Target size={20} />
            </div>
            <div>
              <span className="block text-2xl font-bold text-slate-800 dark:text-white">{activeProjects.length}</span>
              <span className="text-xs text-slate-500 font-medium uppercase">Ativos</span>
            </div>
          </GlassCard>
          <GlassCard className="px-5 py-3 flex items-center gap-3 border-l-4 border-l-red-500">
            <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="block text-2xl font-bold text-slate-800 dark:text-white">{criticalCount}</span>
              <span className="text-xs text-slate-500 font-medium uppercase">Atenção</span>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* STRATEGY SECTIONS */}
      {/* If no strategies link, show Unclassified bucket */}
      <div className="space-y-8">
        
        {/* Render grouped by strategy if possible */}
        {strategies.length > 0 ? strategies.map(strategy => {
          const strategyProjects = projects.filter(p => p.strategyId === strategy.id);
          if (strategyProjects.length === 0) return null;

          return (
            <div key={strategy.id} className="animate-in fade-in duration-700">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-lg font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded-full" style={{ backgroundColor: strategy.colorCode || '#ccc' }} />
                  {strategy.title}
                </h2>
                <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1 ml-4" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {strategyProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    strategy={strategy}
                    tasks={tasks.filter(t => t.projectId === project.id)}
                    onOpenDetails={() => console.log('Open details for', project.id)}
                  />
                ))}
              </div>
            </div>
          );
        }) : (
            // Fallback Grid if no strategy mapping
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {projects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    tasks={tasks.filter(t => t.projectId === project.id)}
                    onOpenDetails={() => console.log('Open details for', project.id)}
                  />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
