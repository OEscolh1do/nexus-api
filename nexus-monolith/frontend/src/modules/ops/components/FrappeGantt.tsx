import React, { useRef, useLayoutEffect, useEffect } from 'react';
import Gantt from 'frappe-gantt';
import './frappe-gantt-base.css'; // Import vendored base styles
import './frappe-gantt-custom.css'; // Import our overrides
import type { OperationalTask, Project } from '../types';

interface FrappeTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies: string;
    custom_class?: string;
    // Extra fields for logic
    _start?: Date;
    _end?: Date;
    _task_obj?: OperationalTask;
}

interface Props {
  tasks: OperationalTask[];
  projects: Project[];
  viewMode: 'Day' | 'Week' | 'Month';
  onTaskUpdate?: (taskId: string, start: Date, end: Date) => void;
  onTaskClick?: (taskId: string) => void;
}

export const FrappeGantt: React.FC<Props> = ({ tasks, projects, viewMode, onTaskUpdate, onTaskClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ganttInstance = useRef<any>(null);

  // Transform Data
  const ganttData = React.useMemo(() => {
    const data: FrappeTask[] = [];
    const sortedProjects = [...projects].sort((a, b) => a.title.localeCompare(b.title));

    // Grouping Logic
    const tasksByProject = tasks.reduce((acc, t) => {
        if (!acc[t.projectId]) acc[t.projectId] = [];
        acc[t.projectId].push(t);
        return acc;
    }, {} as Record<string, OperationalTask[]>);

    sortedProjects.forEach(proj => {
        const pTasks = tasksByProject[proj.id] || [];
        
        // 1. Project Header Task (Optional, but good for visual grouping)
        // Calculate range
        let pStart = new Date();
        let pEnd = new Date();
        if (pTasks.length > 0) {
             const starts = pTasks.map(t => new Date(t.startDate || Date.now()).getTime());
             const ends = pTasks.map(t => new Date(t.endDate || t.startDate || Date.now()).getTime());
             pStart = new Date(Math.min(...starts));
             pEnd = new Date(Math.max(...ends));
             if (pEnd <= pStart) pEnd.setDate(pStart.getDate() + 1);
        } else {
             pEnd.setDate(pStart.getDate() + 1);
        }

        data.push({
            id: `PROJ-${proj.id}`,
            name: `📁 ${proj.title}`,
            start: pStart.toISOString().split('T')[0],
            end: pEnd.toISOString().split('T')[0],
            progress: 0,
            dependencies: '',
            custom_class: 'project-header'
        });

        // 2. Tasks
        pTasks.forEach(t => {
            let cls = 'blue'; // Default
            if (t.status === 'BLOQUEADO') cls = 'blocked';
            else if (t.status === 'CONCLUIDO') cls = 'completed';
            else if (t.isMilestone) cls = 'purple';

            const start = t.startDate ? new Date(t.startDate) : new Date();
            let end = t.endDate || t.dueDate ? new Date(t.endDate || t.dueDate!) : new Date(start);
            if (end <= start) {
                 const d = new Date(start);
                 d.setDate(d.getDate() + 1);
                 end = d;
            }

            // Calculate dependencies string
            let depString = '';
            if (t.predecessors && t.predecessors.length > 0) {
                depString = t.predecessors.map(p => p.predecessorId).join(',');
            } else if (t.dependencies && t.dependencies.length > 0) {
                depString = t.dependencies.join(',');
            }

            data.push({
                id: t.id,
                name: t.title,
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0],
                progress: t.completionPercent || 0,
                dependencies: depString,
                custom_class: cls,
                _task_obj: t
            });
        });
    });

    return data;
  }, [tasks, projects]);

  // Refs for callbacks to avoid re-init on handler updates
  const onTaskUpdateRef = useRef(onTaskUpdate);
  const onTaskClickRef = useRef(onTaskClick);

  useEffect(() => {
     onTaskUpdateRef.current = onTaskUpdate;
     onTaskClickRef.current = onTaskClick;
  }, [onTaskUpdate, onTaskClick]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    if (ganttData.length === 0) {
        containerRef.current.innerHTML = `<div class="p-8 text-center text-slate-400">Sem tarefas para exibir.</div>`;
        ganttInstance.current = null;
        return;
    }

    // Clean up previous instance
    containerRef.current.innerHTML = ''; 

    try {
        ganttInstance.current = new Gantt(containerRef.current, ganttData, {
            header_height: 50,
            column_width: 30,
            step: 24,
            view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
            bar_height: 25, // Thicker bars like Exemplo 1
            bar_corner_radius: 5,
            arrow_curve: 10, // Smoother curves
            padding: 20,
            view_mode: viewMode,
            date_format: 'YYYY-MM-DD',
            language: 'en', 
            custom_popup_html: (task: FrappeTask) => {
                if (task.id.startsWith('PROJ-')) return '';
                
                // Formatação igual ao Exemplo 1
                const sDate = task._start ? task._start.toLocaleDateString() : '';
                const eDate = task._end ? task._end.toLocaleDateString() : '';
                
                return `
                    <div class="details-container">
                      <h5>${task.name}</h5>
                      <p>Início: <span>${sDate}</span></p>
                      <p>Fim: <span>${eDate}</span></p>
                      <p>${task.progress}% concluído</p>
                      ${task._task_obj?.assignedTo ? `<p>Responsável: <span>${task._task_obj.assignedTo}</span></p>` : ''}
                    </div>
                `;
            },
            on_date_change: (task: FrappeTask, start: Date, end: Date) => {
                if (task.id.startsWith('PROJ-')) return;
                if (onTaskUpdateRef.current) onTaskUpdateRef.current(task.id, start, end);
            },
            on_click: (task: FrappeTask) => {
                 if (task.id.startsWith('PROJ-')) return;
                 if (onTaskClickRef.current) onTaskClickRef.current(task.id);
            }
        });

        // Set view mode immediately
        if (ganttInstance.current && typeof ganttInstance.current.change_view_mode === 'function') {
            ganttInstance.current.change_view_mode(viewMode);
        }

    } catch (e) {
        console.error("Frappe Gantt Init Error:", e);
    }
    
  }, [ganttData, viewMode]);

  return (
    <div className="w-full overflow-auto bg-slate-50 dark:bg-slate-900 rounded-lg shadow-inner custom-scrollbar relative">
       <div ref={containerRef} className="mx-auto" />
    </div>
  );
};
