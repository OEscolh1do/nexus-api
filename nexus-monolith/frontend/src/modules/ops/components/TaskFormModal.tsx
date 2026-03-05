
import React, { useState, useEffect, useCallback } from 'react';
import { FormSelect } from '@/components/ui/FormSelect';
import { X, Calendar, Trash2, Sliders, CheckSquare } from 'lucide-react';

import type { OperationalTask, Project } from '../types';

// Types (Mocked to match Monolith structure)
interface ChecklistItem {
    id: string;
    title: string;
    isCompleted: boolean;
}

interface Checklist {
    id: string;
    title: string;
    items: ChecklistItem[];
}

interface UserOption {
    id: string;
    username: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<OperationalTask>) => Promise<void>;
    onDelete?: (id: string) => void;
    projects: Project[];
    users: UserOption[];
    initialData?: OperationalTask | null;
    initialStatus?: string;
    readOnly?: boolean;
    allTasks?: OperationalTask[];
}

export const TaskFormModal: React.FC<Props> = ({
    isOpen, onClose, onSubmit, onDelete, projects, users, initialData, initialStatus, readOnly = false, allTasks = []
}) => {
    const [formData, setFormData] = useState<Partial<OperationalTask>>({});
    const [checklists, setChecklists] = useState<Checklist[]>([]);
    const [newChecklistTitle, setNewChecklistTitle] = useState('');
    const [newItemTitles, setNewItemTitles] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    
    
    const [activeTab, setActiveTab] = useState<'DETAILS' | 'DEPENDENCIES'>('DETAILS');

    // --- API HELPERS (Inlined for Monolith Migration) ---
    const apiCall = async (url: string, method: string = 'GET', body?: unknown) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api${url}`, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: body ? JSON.stringify(body) : undefined
        });
        return res.json();
    };

    const loadChecklists = useCallback(async (taskId: string) => {
        
        try {
            // Check if endpoint exists, otherwise fail silently
            // Correct V2 Endpoint
            const res = await apiCall(`/v2/checklists?taskId=${taskId}`);
            if (res.success) setChecklists(res.data);
        } catch (e) {
            console.warn("Checklist fetch failed (backend might need update)", e);
        } finally {
            // Loading state removed
        }
    }, []);

    useEffect(() => {
        if (initialData) {
            const existingDeps = initialData.predecessors
                ? initialData.predecessors.map(p => p.predecessorId)
                : (initialData.dependencies || []);

            setFormData({ ...initialData, dependencies: existingDeps });
            loadChecklists(initialData.id);
        } else {
            setFormData({
                title: '',
                projectId: projects.length > 0 ? projects[0].id : '',
                status: initialStatus || 'BACKLOG',
                assignedTo: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                completionPercent: 0,
                isRecurring: false,
                isMilestone: false,
                recurrencePattern: 'WEEKLY',
                dependencies: []
            });
            setChecklists([]);
        }
        setActiveTab('DETAILS');
    }, [initialData, projects, initialStatus, isOpen, loadChecklists]);

    const handleCreateChecklist = async () => {
        if (!newChecklistTitle.trim() || !initialData || readOnly) return;
        try {
            await apiCall('/checklists', 'POST', { taskId: initialData.id, title: newChecklistTitle });
            setNewChecklistTitle('');
            loadChecklists(initialData.id);
        } catch (e) { console.error(e); }
    };

    const handleDeleteChecklist = async (id: string) => {
        if (readOnly || !initialData) return;
        if (window.confirm("Excluir lista?")) {
            await apiCall(`/checklists/${id}`, 'DELETE');
            loadChecklists(initialData.id);
        }
    };

    const handleAddItem = async (checklistId: string) => {
        const title = newItemTitles[checklistId];
        if (!title?.trim() || readOnly) return;
        await apiCall(`/checklists/${checklistId}/items`, 'POST', { title });
        setNewItemTitles({ ...newItemTitles, [checklistId]: '' });
        loadChecklists(initialData?.id || '');
    };

    const toggleBinaryCompletion = () => {
        if (readOnly) return;
        const isCurrentlyComplete = formData.status === 'CONCLUIDO' || formData.completionPercent === 100;
        setFormData(prev => ({ 
            ...prev, 
            completionPercent: isCurrentlyComplete ? 0 : 100, 
            status: isCurrentlyComplete ? 'EM_ANALISE' : 'CONCLUIDO' 
        }));
    };

    
    
    
    
    

    


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        setIsSubmitting(true);
        await onSubmit({ ...formData });
        setIsSubmitting(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {initialData ? <Sliders size={18} className="text-indigo-500" /> : <Calendar size={18} className="text-emerald-500" />}
                        {initialData ? 'Detalhes da Tarefa' : 'Nova Tarefa'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 dark:border-slate-800">
                    <button onClick={() => setActiveTab('DETAILS')} className={`flex-1 py-3 text-xs font-bold uppercase ${activeTab === 'DETAILS' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500'}`}>Detalhes</button>
                    <button onClick={() => setActiveTab('DEPENDENCIES')} className={`flex-1 py-3 text-xs font-bold uppercase ${activeTab === 'DEPENDENCIES' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500'}`}>Bloqueios</button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    {activeTab === 'DETAILS' && (
                        <>
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título</label>
                                <input
                                    type="text" required disabled={readOnly}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm dark:bg-slate-950 dark:border-slate-700"
                                    value={formData.title || ''}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            {/* Project & Assignee */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormSelect label="Projeto" value={formData.projectId} onChange={e => setFormData({ ...formData, projectId: e.target.value })} required disabled={readOnly}>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </FormSelect>
                                <FormSelect label="Responsável" value={formData.assignedTo || ''} onChange={e => setFormData({ ...formData, assignedTo: e.target.value })} disabled={readOnly}>
                                    <option value="">-- Sem Dono --</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                                </FormSelect>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Início</label>
                                    <input type="date" required disabled={readOnly} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm dark:bg-slate-950 dark:border-slate-700" value={formData.startDate ? formData.startDate.split('T')[0] : ''} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fim</label>
                                    <input type="date" required disabled={readOnly} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm dark:bg-slate-950 dark:border-slate-700" value={formData.endDate ? formData.endDate.split('T')[0] : ''} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                </div>
                            </div>

                            
                            <button type="button" disabled={readOnly} onClick={toggleBinaryCompletion} className={`w-full py-3 px-4 rounded-lg border-2 flex items-center justify-center gap-3 ${formData.status === 'CONCLUIDO' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                                {formData.status === 'CONCLUIDO' ? <span>Tarefa Concluída</span> : <span>Marcar como Concluída</span>}
                            </button>

                            {/* Checklist Section (Simplified) */}
                            {initialData && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><CheckSquare size={14} /> Checklists</h4>
                                        <div className="flex gap-2">
                                            <input type="text" className="bg-transparent border-b text-xs px-2 py-1 outline-none" placeholder="Nova Lista..." value={newChecklistTitle} onChange={e => setNewChecklistTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateChecklist()} />
                                            <button type="button" onClick={handleCreateChecklist} disabled={!newChecklistTitle.trim()} className="text-indigo-600 text-xs font-bold">+ Criar</button>
                                        </div>
                                    </div>
                                    {checklists.map(list => (
                                        <div key={list.id} className="bg-slate-50 p-2 rounded border">
                                            <div className="flex justify-between font-bold text-xs uppercase mb-2">
                                                {list.title}
                                                <Trash2 size={12} className="cursor-pointer text-red-400" onClick={() => handleDeleteChecklist(list.id)} />
                                            </div>
                                            {list.items.map(item => (
                                                <div key={item.id} className="text-sm pl-2">{item.title}</div>
                                            ))}
                                            <input type="text" className="w-full bg-transparent border-b text-xs mt-1" placeholder="Add item..." value={newItemTitles[list.id] || ''} onChange={e => setNewItemTitles({ ...newItemTitles, [list.id]: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleAddItem(list.id)} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'DEPENDENCIES' && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-500 mb-4">Selecione as tarefas que devem ser concluídas <strong>antes</strong> desta iniciar. Isso criará uma seta no gráfico de Gantt.</p>
                            
                            {projects.map(project => {
                                const projectTasks = (allTasks || []).filter(t => t.projectId === project.id && t.id !== initialData?.id);
                                if (projectTasks.length === 0) return null;

                                return (
                                    <div key={project.id} className="mb-4">
                                        <h5 className="text-xs font-bold text-slate-400 uppercase mb-2 border-b pb-1">{project.title}</h5>
                                        <div className="space-y-2">
                                            {projectTasks.map(task => {
                                                const isSelected = (formData.dependencies || []).includes(task.id);
                                                return (
                                                    <label key={task.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border border-transparent hover:border-slate-200">
                                                        <input 
                                                            type="checkbox" 
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                const current = formData.dependencies || [];
                                                                let next = [];
                                                                if (checked) {
                                                                    next = [...current, task.id];
                                                                } else {
                                                                    next = current.filter(id => id !== task.id);
                                                                }
                                                                setFormData({ ...formData, dependencies: next });
                                                            }}
                                                            disabled={readOnly}
                                                        />
                                                        <span className="text-sm text-slate-700 dark:text-slate-300">{task.title}</span>
                                                        <span className="ml-auto text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">{task.status}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {(allTasks || []).length === 0 && <div className="text-center text-slate-400 py-8">Nenhuma outra tarefa disponível para vínculo.</div>}
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                    {initialData && !readOnly && onDelete && (
                        <button type="button" onClick={() => { if(window.confirm('Excluir?')) { onDelete(initialData.id); onClose(); } }} className="mr-auto text-red-500 text-sm font-bold flex items-center gap-1"><Trash2 size={14} /> Excluir</button>
                    )}
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
                    {!readOnly && (
                        <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg">Salvar</button>
                    )}
                </div>
            </div>
        </div>
    );
};
