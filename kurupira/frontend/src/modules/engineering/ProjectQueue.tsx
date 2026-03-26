import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ProjectService } from '@/services/ProjectService';
import { Loader2, FolderOpen, AlertCircle, FileText, Calendar, Search, MoreVertical, Trash2, Copy } from 'lucide-react';

export interface ProjectMetadata {
    id: string;
    project_name: string;
    status: string;
    client_crm_data?: { clientName?: string };
    updated_at: string;
}

export const ProjectQueue: React.FC<{ onProjectLoaded: () => void }> = ({ onProjectLoaded }) => {
    const [projects, setProjects] = useState<ProjectMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Filtros e Pesquisa
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string | 'ALL'>('ALL');

    // Menu 3 Pontos
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Fechar menu ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await ProjectService.listProjects();
            setProjects(data || []);
        } catch (err: any) {
            setError(err.message || "Failed to load projects");
        } finally {
            setLoading(false);
        }
    };

    const handleLoadProject = async (id: string) => {
        try {
            setLoadingId(id);
            await ProjectService.loadProjectAndHydrate(id);
            onProjectLoaded();
        } catch (err) {
            console.error(err);
            alert("Erro ao carregar projeto");
        } finally {
            setLoadingId(null);
        }
    };

    const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenMenuId(null);

        if (!window.confirm("Tem certeza que deseja apagar este projeto PERMANENTEMENTE?")) return;

        try {
            setLoadingId(id); // Reusing loadingId for visual feedback (loading state on the whole card)
            await ProjectService.deleteProject(id);
            await fetchProjects();
        } catch (err) {
            console.error(err);
            alert("Erro ao deletar projeto");
        } finally {
            setLoadingId(null);
        }
    };

    const handleDuplicateProject = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenMenuId(null);

        try {
            setLoadingId(id);
            await ProjectService.duplicateProject(id);
            await fetchProjects();
        } catch (err) {
            console.error(err);
            alert("Erro ao duplicar projeto");
        } finally {
            setLoadingId(null);
        }
    };

    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const matchesSearch =
                (project.project_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (project.client_crm_data?.clientName?.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = filterStatus === 'ALL' || project.status === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [projects, searchTerm, filterStatus]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 text-slate-400">
                <Loader2 className="animate-spin mr-2" /> Carregando lista de projetos...
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 m-4">
                <AlertCircle size={20} />
                <div>
                    <p className="font-bold text-sm">Erro de conexão</p>
                    <p className="text-xs">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Fila de Projetos</h2>
                    <p className="text-sm text-slate-500">Selecione um projeto salvo para continuar o workflow.</p>
                </div>
                <button onClick={fetchProjects} className="text-sm text-neonorte-green font-bold hover:underline">
                    Atualizar Fila
                </button>
            </div>

            {/* Barra de Filtros e Pesquisa */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 relative z-10">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por Projeto ou Cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-neonorte-purple focus:ring-2 focus:ring-neonorte-purple/20 transition-all shadow-sm"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    <button
                        onClick={() => setFilterStatus('ALL')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${filterStatus === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterStatus('DRAFT')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${filterStatus === 'DRAFT' ? 'bg-slate-200 text-slate-800 shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        Rascunhos
                    </button>
                    <button
                        onClick={() => setFilterStatus('WAITING_ENGINEERING')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${filterStatus === 'WAITING_ENGINEERING' ? 'bg-orange-100 text-orange-700 border-orange-200 shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-orange-50'}`}
                    >
                        Aguardando Eng.
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-0">
                {filteredProjects.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl">
                        <FolderOpen size={48} className="mx-auto mb-3 text-slate-300" />
                        <p>Nenhum projeto encontrado.</p>
                    </div>
                ) : (
                    filteredProjects.map(project => (
                        <div key={project.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-neonorte-green hover:shadow-lg transition-all group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-slate-400" />
                                    <span className="text-xs font-mono text-slate-500">{project.id.split('-')[0]}</span>
                                </div>
                                <div className="flex items-center gap-2 relative">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${project.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' :
                                        project.status === 'WAITING_ENGINEERING' ? 'bg-orange-100 text-orange-600' :
                                            'bg-green-100 text-green-600'
                                        }`}>
                                        {project.status.replace('_', ' ')}
                                    </span>

                                    {/* 3-Dot Menu */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === project.id ? null : project.id);
                                        }}
                                        className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
                                    >
                                        <MoreVertical size={16} />
                                    </button>

                                    {openMenuId === project.id && (
                                        <div
                                            ref={menuRef}
                                            className="absolute top-8 right-0 w-40 bg-white shadow-xl border border-slate-100 rounded-lg py-1 z-20"
                                        >
                                            <button
                                                onClick={(e) => handleDuplicateProject(project.id, e)}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-neonorte-purple flex items-center gap-2"
                                            >
                                                <Copy size={14} /> Duplicar
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteProject(project.id, e)}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            >
                                                <Trash2 size={14} /> Apagar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <h3 className="font-bold text-slate-800 mb-0.5 truncate" title={project.project_name || 'Projeto sem Título'}>
                                {project.project_name || 'Projeto sem Título'}
                            </h3>
                            {project.client_crm_data?.clientName && (
                                <p className="text-[10px] text-slate-400 truncate mb-1">
                                    Cliente: {project.client_crm_data.clientName}
                                </p>
                            )}

                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                                <Calendar size={12} />
                                {new Date(project.updated_at).toLocaleDateString('pt-BR')}
                            </div>

                            <button
                                onClick={() => handleLoadProject(project.id)}
                                disabled={loadingId === project.id}
                                className="w-full bg-slate-50 hover:bg-neonorte-green hover:text-white border border-slate-200 hover:border-neonorte-green text-slate-600 font-semibold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                {loadingId === project.id ? (
                                    <><Loader2 size={16} className="animate-spin" /> Carregando </>
                                ) : (
                                    <><FolderOpen size={16} /> Abrir Projeto</>
                                )}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
