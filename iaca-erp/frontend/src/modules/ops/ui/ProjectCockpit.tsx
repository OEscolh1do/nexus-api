import { useEffect, useState } from "react";
import { OpsService } from "../ops.service";
import type { Project, OperationalTask } from "../types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, Button, Input, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/mock-components";
import { CheckCircle2, Clock, Plus, AlertCircle, Loader2 } from "lucide-react";

// --- VALIDATION SCHEMA ---
const taskSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres"),
  dueDate: z.string().optional()
});

export function ProjectCockpit() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Task Form
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(taskSchema)
  });

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      try {
        const data = await OpsService.getAllProjects();
        setProjects(data || []);
      } catch (err) {
        console.error("Failed to load projects", err);
      }
      setIsLoading(false);
    };

    loadProjects();
  }, []);

  const selectProject = async (id: string) => {
    setIsLoading(true);
    try {
      const fullProject = await OpsService.getProject(id);
      setSelectedProject(fullProject);
    } catch (error) {
      console.error("Failed to load project details", error);
    }
    setIsLoading(false);
  };

  const onAddTask = async (data: z.infer<typeof taskSchema>) => {
    if (!selectedProject) return;
    try {
      await OpsService.addTask(selectedProject.id, data);
      reset();
      selectProject(selectedProject.id); // Refresh
    } catch {
      alert("Erro ao criar tarefa");
    }
  };

  if (isLoading && projects.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando Projetos...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Cockpit de Projetos 🏗️</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestão de Obras e Instalações</p>
        </div>
        <Button>Novo Projeto</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[600px]">
        {/* SIDEBAR: PROJECT LIST */}
        <div className="md:col-span-1 border-r border-slate-200 dark:border-slate-800 pr-4 space-y-2 overflow-y-auto">
          <h3 className="font-semibold mb-4 text-slate-800 dark:text-white">Projetos Ativos</h3>
          {projects.map(p => (
            <div
              key={p.id}
              onClick={() => selectProject(p.id)}
              className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedProject?.id === p.id ? 'bg-primary/10 border-primary text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}
            >
              <div className="font-medium truncate">{p.title}</div>
              <div className="flex justify-between mt-1">
                <Badge variant="outline">{p.status}</Badge>
                <span className="text-xs text-muted-foreground">{p.progressPercentage}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN AREA: COCKPIT */}
        <div className="md:col-span-3 flex flex-col">
          {selectedProject ? (
            <>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedProject.title}</h2>
                  <div className="flex gap-2 mt-2">
                    <Badge>{selectedProject.type}</Badge>
                    <Badge variant={selectedProject.status === 'CONCLUIDO' ? 'default' : 'outline'}>{selectedProject.status}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Progresso Global</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedProject.progressPercentage}%</p>
                </div>
              </div>

              <Tabs defaultValue="tasks" className="w-full flex-1">
                <TabsList>
                  <TabsTrigger value="tasks">Tarefas</TabsTrigger>
                  <TabsTrigger value="gantt" disabled>Cronograma (Gantt)</TabsTrigger>
                  <TabsTrigger value="financial">Financeiro</TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="mt-4 h-full flex flex-col">
                  {/* ADD TASK BAR */}
                  <form onSubmit={handleSubmit(onAddTask)} className="flex gap-2 mb-4">
                    <Input placeholder="Nova tarefa..." {...register("title")} className="flex-1" />
                    <Input type="date" {...register("dueDate")} className="w-40" />
                    <Button type="submit" size="icon"><Plus size={18} /></Button>
                  </form>

                  {/* TASK LIST */}
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {selectedProject.tasks?.map((task: OperationalTask) => (
                      <Card key={task.id} className="flex items-center p-3 justify-between hover:shadow-sm transition-shadow bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        {/* UI_DEEP_FIX: Container flex items-center gap-x-3 for mathematical alignment */}
                        <div className="flex items-center gap-x-3">
                          <div className={`p-1 rounded-full flex items-center justify-center shrink-0 ${task.status === 'DONE' ? 'text-green-500' : 'text-slate-300'}`}>
                            {/* UI_DEEP_FIX: Icon fixed size w-5 h-5 */}
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            {/* UI_DEEP_FIX: Label leading-none to center optically */}
                            <p className={`font-medium leading-none ${task.status === 'DONE' ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>{task.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ID: {task.id.slice(-4)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-x-4">
                          {task.dueDate && (
                            <div className="flex items-center gap-x-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded">
                              {/* UI_DEEP_FIX: Icon and Label alignment */}
                              <Clock className="w-3 h-3 shrink-0" />
                              <span className="leading-none pt-0.5">{new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          <Badge variant="outline">{task.status}</Badge>
                        </div>
                      </Card>
                    ))}
                    {(!selectedProject.tasks || selectedProject.tasks.length === 0) && (
                      <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
                        <AlertCircle size={32} className="mb-2 opacity-20" />
                        <p>Nenhuma tarefa registrada</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              Selecione um projeto para ver o cockpit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
