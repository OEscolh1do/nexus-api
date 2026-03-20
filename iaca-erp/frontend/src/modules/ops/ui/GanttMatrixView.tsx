import React, { useState, useEffect, useCallback } from 'react';
import { CalendarRange, AlertCircle, Loader2, Plus } from 'lucide-react';
import { FrappeGantt } from '../components/FrappeGantt';
import { TaskFormModal } from '../components/TaskFormModal';
import { OpsService, type UserOption } from '../ops.service';
import type { OperationalTask, Project } from '../types';
import { Button } from '@/components/ui/button';

type User = UserOption; 

export const GanttMatrixView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month'>('Day');
  
  // Data State
  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<OperationalTask | undefined>(undefined);

  // Drag Scroll State
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startX = React.useRef(0); 
  const startScrollLeft = React.useRef(0); 

  const loadData = useCallback(async () => {
      setIsLoading(true);
      try {
          // Fetch Projects
          const projectsData = await OpsService.getAllProjects();
          setProjects(projectsData);

          // Extract all tasks
          const allTasks = projectsData.flatMap(p => 
             (p.tasks || []).map(t => ({
                 ...t,
                 projectId: p.id
             }))
          );
          setTasks(allTasks);

          // Fetch Users using Service
          try {
             const usersData = await OpsService.getUsers();
             setUsers(usersData);
          } catch (uErr) {
             console.warn("Failed to load users for Gantt", uErr);
          }
      } catch (e) {
          console.error("Gantt Load Error", e);
      } finally {
          setIsLoading(false);
      }
  }, []);

  useEffect(() => {
      loadData();
  }, [loadData]);

  // --- HANDLERS ---
  const handleTaskClick = (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
          setEditingTask(task);
          setIsModalOpen(true);
      }
  };

  const handleTaskUpdate = async (taskId: string, start: Date, end: Date) => {
      // Optimistic update
      const sStr = start.toISOString().split('T')[0];
      const eStr = end.toISOString().split('T')[0];

      const oldTasks = [...tasks];
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, startDate: sStr, endDate: eStr } : t));

      try {
          await OpsService.updateTask(taskId, { startDate: sStr, endDate: eStr }); 
      } catch (e) {
          console.error("Update failed", e);
          setTasks(oldTasks); // Revert
      }
  };

  const handleFormSubmit = async (data: Partial<OperationalTask>) => {
      try {
          if (editingTask) {
              await OpsService.updateTask(editingTask.id, data);
          } else {
              // Create logic placeholder
          }
          await loadData();
      } catch (e) {
          console.error(e);
      }
  };

  const handleDelete = async (taskId: string) => {
      try {
          await OpsService.deleteTask(taskId);
          setTasks(prev => prev.filter(t => t.id !== taskId));
      } catch(e) {
          console.error(e);
      }
  };

  // --- DRAG SCROLL LOGIC ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.bar-wrapper, .popup-wrapper')) return;
    setIsDragging(true);
    startX.current = e.clientX;
    startScrollLeft.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.clientX;
    const walk = (x - startX.current); 
    scrollContainerRef.current.scrollLeft = startScrollLeft.current - walk;
  };

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>;

  return (
    <div className="flex flex-col h-full space-y-2 relative">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarRange className="text-purple-600" />
            Cronograma Mestre
          </h2>
          <p className="text-sm text-slate-500">
            {projects.length} Projetos Ativos • {tasks.length} Tarefas
          </p>
        </div>

        <div className="flex items-center gap-4">
             <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button 
                    onClick={() => setViewMode('Day')}
                    className={`px-3 py-1 text-xs rounded-md ${viewMode === 'Day' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                >Dia</button>
                <button 
                    onClick={() => setViewMode('Week')}
                    className={`px-3 py-1 text-xs rounded-md ${viewMode === 'Week' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                >Semana</button>
                <button 
                    onClick={() => setViewMode('Month')}
                    className={`px-3 py-1 text-xs rounded-md ${viewMode === 'Month' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                >Mês</button>
             </div>
             
             <Button onClick={() => { setEditingTask(undefined); setIsModalOpen(true); }}>
                <Plus size={16} className="mr-2" />
                Nova Tarefa
             </Button>
        </div>
      </div>

      {/* Gantt Area */}
      <div className="flex-1 overflow-visible bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col relative">
        {tasks.length > 0 ? (
          <div
            ref={scrollContainerRef}
            className={`flex-1 overflow-auto p-4 custom-scrollbar ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseLeave={() => setIsDragging(false)}
            onMouseUp={() => setIsDragging(false)}
            onMouseMove={handleMouseMove}
          >
            <FrappeGantt
              tasks={tasks}
              projects={projects}
              viewMode={viewMode}
              onTaskUpdate={handleTaskUpdate}
              onTaskClick={handleTaskClick}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <AlertCircle size={48} className="mb-4 opacity-50" />
            <p>Nenhuma tarefa agendada.</p>
          </div>
        )}
      </div>

      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        onDelete={handleDelete}
        projects={projects}
        users={users}
        initialData={editingTask || undefined}
        allTasks={tasks}
      />
    </div>
  );
};
