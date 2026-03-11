import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { OpsService, type UserOption } from '../ops.service';
import {
  Workflow,
  Plus,
  Calendar,
  Filter,
  Lock,
  Edit,
  Copy,
  FileText,
  LayoutTemplate,
  ChevronRight,
  X,
  User as UserIcon
} from 'lucide-react';
import { TaskFormModal } from '../components/TaskFormModal';
import type { OperationalTask, Project } from '../types';

// Types for Kanban
type TaskStatus = 'BACKLOG' | 'EM_ANALISE' | 'ENCAMINHADO' | 'BLOQUEADO' | 'CONCLUIDO';


const COLUMNS: { id: TaskStatus; label: string; color: string; darkColor: string }[] = [
  { id: 'BACKLOG', label: 'Backlog', color: 'border-slate-300', darkColor: 'dark:border-slate-600' },
  { id: 'EM_ANALISE', label: 'Em Execução', color: 'border-blue-400', darkColor: 'dark:border-blue-500' },
  { id: 'ENCAMINHADO', label: 'Encaminhado', color: 'border-purple-400', darkColor: 'dark:border-purple-500' },
  { id: 'BLOQUEADO', label: 'Bloqueado', color: 'border-red-400', darkColor: 'dark:border-red-500' },
  { id: 'CONCLUIDO', label: 'Concluído', color: 'border-emerald-400', darkColor: 'dark:border-emerald-500' }
];

// --- TEMPLATE SELECTION MODAL ---
const TemplateSelectionModal = React.memo<{
  isOpen: boolean;
  onClose: () => void;
  templates: OperationalTask[];
  onSelectTemplate: (t: OperationalTask) => void;
  onCreateBlank: () => void;
  onCreateTemplate: () => void;
  onEditTemplate: (t: OperationalTask) => void;
  canExecute: boolean;
}>(({ isOpen, onClose, templates, onSelectTemplate, onCreateBlank, onCreateTemplate, onEditTemplate, canExecute }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh]">

        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Plus size={24} className="text-purple-600" />
              Nova Tarefa
            </h3>
            <p className="text-sm text-slate-500">Escolha como iniciar seu trabalho.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          {/* SECTION 1: ACTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={onCreateBlank}
              className="group flex items-start gap-4 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 cursor-pointer transition-all shadow-sm hover:shadow-md"
            >
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors shadow-sm">
                <FileText size={24} className="text-slate-500 dark:text-slate-400 group-hover:text-purple-700 dark:group-hover:text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 mb-1">Tarefa em Branco</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Criar uma tarefa do zero sem configurações pré-definidas.</p>
              </div>
              <ChevronRight className="self-center text-slate-300 group-hover:text-purple-500" />
            </div>

            {canExecute && (
              <div
                onClick={onCreateTemplate}
                className="group flex items-start gap-4 p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 cursor-pointer transition-all"
              >
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900 transition-colors">
                  <LayoutTemplate size={24} className="text-slate-400 dark:text-slate-500 group-hover:text-purple-700 dark:group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-600 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-300 mb-1">Criar Novo Modelo</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Definir um novo padrão de tarefa com checklists e configurações fixas.</p>
                </div>
                <Plus className="self-center text-slate-300 group-hover:text-purple-500" />
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="bg-white dark:bg-slate-900 px-4 text-slate-400">Modelos Disponíveis</span>
            </div>
          </div>

          <div>
            {templates.length === 0 ? (
              <div className="text-center p-8 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                <p className="text-slate-400 text-sm italic">Nenhum modelo cadastrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(tpl => (
                  <div
                    key={tpl.id}
                    className="relative flex flex-col p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:ring-2 hover:ring-purple-400/50 hover:shadow-lg transition-all group"
                  >
                    {canExecute && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditTemplate(tpl); }}
                        className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-md transition-colors z-10 opacity-0 group-hover:opacity-100"
                        title="Editar Modelo"
                      >
                        <Edit size={14} />
                      </button>
                    )}

                    <h5 className="font-bold text-slate-700 dark:text-slate-200 mb-2 leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {tpl.title}
                    </h5>

                    <button
                      onClick={() => onSelectTemplate(tpl)}
                      // UI_DEEP_FIX: items-center gap-x-2 leading-none
                      className="mt-auto w-full py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-100 dark:border-purple-800/30 flex items-center justify-center gap-x-2 transition-colors"
                    >
                      <Copy className="w-4 h-4 shrink-0" /> 
                      <span className="leading-none pt-0.5">Usar Modelo</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
});

export const KanbanView: React.FC = () => {
  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]); // Typed
  const [users, setUsers] = useState<UserOption[]>([]); // Typed
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{id: string; username: string} | null>(null);

  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // DRAG TO SCROLL
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<OperationalTask | null>(null);
  const [targetColumnStatus, setTargetColumnStatus] = useState<TaskStatus | undefined>(undefined);
  const [targetIsTemplate, setTargetIsTemplate] = useState(false);

  // AUTH (Simplified)
  const canExecute = true; // Assume true for MVP

  // --- API ---
  // --- API replaced by imports ---
  
  const loadData = useCallback(async () => {
      setIsLoading(true);
      try {
          // Decode token safely
          const token = localStorage.getItem('token');
          if (token && token.split('.').length === 3) {
              try {
                  const base64Url = token.split('.')[1];
                  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                  const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                  }).join(''));
                  const payload = JSON.parse(jsonPayload);
                  setCurrentUser({ id: payload.id, username: payload.username });
              } catch (e) {
                  // Silent fail for token errors
                  console.warn("Token parsing error (safe ignored)", e);
              }
          }

      const [pRes, uRes] = await Promise.all([
              OpsService.getAllProjects(),
              OpsService.getUsers()
          ]);
          
          const projectsData = pRes;
          setProjects(projectsData);
          
          // Flatten tasks from projects for Kanban
          const allTasks: OperationalTask[] = projectsData.flatMap(p => 
            (p.tasks || []).map(t => ({
                ...t, 
                projectId: p.id,
                endDate: t.endDate || '' // Fallback for strict type
            }))
          );
          setTasks(allTasks);

          setUsers(uRes as UserOption[]); // Type assertion safe as Interface matches

      } catch (e) {
          console.error("Failed to load Kanban data", e);
      } finally {
          setIsLoading(false);
      }
  }, []);

  useEffect(() => {
      loadData();
  }, [loadData]);

  // --- HANDLERS ---

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (!canExecute) return;
    e.dataTransfer.setData('taskId', taskId);
    setDraggingId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (!canExecute) return;

    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);

    if (!task || task.status === newStatus) return;

    // Optimistic Update
    const prevTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
        await OpsService.updateTaskStatus(taskId, newStatus);
    } catch(e) {
        console.error("Move failed", e);
        setTasks(prevTasks); // Rollback
    }

    setDraggingId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (canExecute) e.preventDefault();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[draggable="true"], button, input, a')) return;
    if (e.button !== 0) return;
    if (!boardContainerRef.current) return;
    setIsPanning(true);
    startX.current = e.clientX;
    startScrollLeft.current = boardContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !boardContainerRef.current) return;
    e.preventDefault();
    const x = e.clientX;
    const walk = (x - startX.current);
    boardContainerRef.current.scrollLeft = startScrollLeft.current - walk;
  };

  const handleOpenCreateTarget = useCallback((status?: TaskStatus) => {
    setTargetColumnStatus(status);
    setIsSelectionModalOpen(true);
  }, []);

  const handleFormSubmit = useCallback(async (data: Partial<OperationalTask>) => {
    const finalIsTemplate = targetIsTemplate || editingTask?.isTemplate || false;

    try {
        if (editingTask) {
             await OpsService.updateTask(editingTask.id, { ...data, isTemplate: finalIsTemplate });
        } else {
             const pid = data.projectId || projects[0]?.id;
             if(pid) {
                 await OpsService.addTask(pid, { ...data, isTemplate: finalIsTemplate });
             } else {
                 console.error("No project selected for task");
             }
        }
        await loadData();
    } catch (e) {
        console.error(e);
    }
  }, [targetIsTemplate, editingTask, projects, loadData]);

  const handleDeleteTask = useCallback(async (id: string) => {
      try {
          await OpsService.deleteTask(id);
          setTasks(prev => prev.filter(t => t.id !== id));
      } catch (e) { console.error(e); }
  }, []);

  const handleSelectTemplate_Action = useCallback(async (template: OperationalTask) => {
      try {
          const pid = template.projectId || projects[0]?.id;
          if(pid) {
             await OpsService.addTask(pid, {
                 title: template.title,
                 description: template.description,
                 status: 'TODO',
                 isTemplate: false,
                 projectId: pid
             });
             setIsSelectionModalOpen(false);
             await loadData();
          }
      } catch (e) { console.error(e); }
  }, [projects, loadData]);

  const displayedTasks = useMemo(() => showOnlyMine && currentUser
    ? tasks.filter(t => t.assignedTo === currentUser.id && !t.isTemplate)
    : tasks.filter(t => !t.isTemplate), [showOnlyMine, currentUser, tasks]);

  const availableTemplates = useMemo(() => tasks.filter(t => t.isTemplate), [tasks]);

  if (isLoading && tasks.length === 0) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
          <p className="text-slate-400 text-sm">Carregando quadro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4 shrink-0 px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Workflow className="hidden md:block" />Fluxo de Trabalho
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerenciamento tático de tarefas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenCreateTarget()}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-colors"
          >
            <Plus size={16} /> Nova Tarefa
          </button>

          <button
            onClick={() => setShowOnlyMine(!showOnlyMine)}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${showOnlyMine
              ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
          >
            <Filter size={16} />
            {showOnlyMine ? 'Minhas Tarefas' : 'Visão da Equipe'}
          </button>
        </div>
      </div>

      {/* Board */}
      <div
        ref={boardContainerRef}
        className={`flex-1 overflow-x-auto pb-4 px-2 ${isPanning ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseLeave={() => setIsPanning(false)}
        onMouseUp={() => setIsPanning(false)}
        onMouseMove={handleMouseMove}
      >
        <div className="flex gap-4 h-full md:min-w-0">
          {COLUMNS.map(col => {
            const colTasks = displayedTasks.filter(t => t.status === col.id);

            return (
              <div
                key={col.id}
                onDrop={(e) => handleDrop(e, col.id)}
                onDragOver={handleDragOver}
                className={`
                  min-w-[85vw] snap-center 
                  md:min-w-[280px] md:flex-1
                  bg-slate-100 dark:bg-slate-900/50 rounded-xl flex flex-col 
                  border-t-4 ${col.color} ${col.darkColor}
                  transition-colors duration-300 relative group/col
                `}
              >
                {/* Column Header */}
                <div className="p-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-lg">
                  {/* UI_DEEP_FIX: Header Alignment gap-x-2 */}
                  <div className="flex items-center gap-x-2">
                    <h3 className={`font-bold text-sm leading-none ${col.id === 'BLOQUEADO' ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                      {col.label}
                    </h3>
                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full font-mono">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenCreateTarget(col.id)}
                    // UI_DEEP_FIX: Center icon perfectly
                    className="p-1 flex items-center justify-center text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Column Body */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[70vh] md:max-h-full custom-scrollbar">
                  {colTasks.length === 0 ? (
                    <div className="h-32 w-full border-2 border-dashed border-slate-300 dark:border-slate-700/60 rounded-lg flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-800/20">
                      <span className="text-xs font-medium uppercase tracking-wider opacity-60">Vazio</span>
                    </div>
                  ) : (
                    colTasks.map(task => { // Defensive Mapping
                      if (!task) return null;

                      const taskIdDisplay = task.id && typeof task.id === 'string' && task.id.includes('-')
                        ? task.id.split('-')[1]
                        : (task.id?.substring(0, 4) || '???');

                      const displayDate = task.endDate || task.dueDate;
                      // Fix -1 Day Timezone Issue by inspecting the ISO string directly or using UTC getters
                      const formatDate = (isoString?: string | Date | null) => {
                          if (!isoString) return 's/ prazo';
                          const date = new Date(isoString);
                          if (isNaN(date.getTime())) return 's/ prazo';
                          // Use UTC methods to avoid local timezone shift (e.g. 2023-10-25T00:00:00Z -> 24/10 in GMT-3)
                          // We want the literal date stored in DB.
                          const day = date.getUTCDate().toString().padStart(2, '0');
                          const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                          const year = date.getUTCFullYear();
                          return `${day}/${month}/${year}`;
                      };
                      
                      const dateDisplay = formatDate(displayDate as string);

                      return (
                        <div
                          key={task.id || Math.random()}
                          draggable={canExecute}
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => {
                              setTargetIsTemplate(task.isTemplate || false);
                              setEditingTask(task);
                              setIsModalOpen(true);
                          }}
                          className={`
                          bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm 
                          border border-slate-200 dark:border-slate-700 
                          cursor-pointer hover:ring-2 hover:ring-purple-500/50 hover:shadow-md 
                          transition-all group relative
                          ${draggingId === task.id ? 'opacity-50 ring-2 ring-purple-400 rotate-2 scale-95' : ''}
                        `}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-1 rounded">
                              {taskIdDisplay}
                            </span>
                            {task.assignedTo ? (
                              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" title="Responsável">
                                {/* UI_DEEP_FIX: UserIcon aligned */}
                                <UserIcon className="w-3 h-3" />
                              </div>
                            ) : null}
                          </div>

                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3 leading-snug flex items-center gap-x-1">
                            {task.status === 'BLOQUEADO' && <Lock className="w-3 h-3 text-red-500 shrink-0" />}
                            <span>{task.title || '(Sem Título)'}</span>
                          </p>

                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-50 dark:border-slate-700 pt-2">
                            <div className="flex items-center gap-x-2">
                                {/* UI_DEEP_FIX: items-center and gap-x-2 for Date */}
                                <Calendar className="w-3 h-3 shrink-0" />
                                <span className="leading-none pt-0.5">{dateDisplay}</span>
                              </div>

                            {(task.completionPercent || 0) > 0 && (
                              <span className={`font-bold ${task.completionPercent === 100 ? 'text-emerald-500' : 'text-blue-500'}`}>
                                {task.completionPercent}%
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTION MODAL */}
      <TemplateSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={useCallback(() => setIsSelectionModalOpen(false), [])}
        templates={availableTemplates}
        onCreateBlank={useCallback(() => {
            setTargetIsTemplate(false);
            setIsSelectionModalOpen(false);
            setEditingTask(null);
            setIsModalOpen(true);
        }, [])}
        onCreateTemplate={useCallback(() => {
            setTargetIsTemplate(true);
            setIsSelectionModalOpen(false);
            setEditingTask(null);
            setIsModalOpen(true);
        }, [])}
        onSelectTemplate={handleSelectTemplate_Action}
        onEditTemplate={useCallback((tpl: OperationalTask) => {
            setTargetIsTemplate(true);
            setIsSelectionModalOpen(false);
            setEditingTask(tpl);
            setIsModalOpen(true);
        }, [])}
        canExecute={canExecute}
      />

      {/* CRUD MODAL */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={useCallback(() => setIsModalOpen(false), [])}
        onSubmit={handleFormSubmit}
        onDelete={handleDeleteTask}
        projects={projects}
        users={users}
        initialData={editingTask}
        initialStatus={targetColumnStatus ? String(targetColumnStatus) : undefined}
        readOnly={!canExecute}
        allTasks={tasks}
      />
    </div>
  );
};
