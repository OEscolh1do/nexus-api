import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../../../lib/axios';
import { Plus, Search, Users, HardHat, ArrowRightCircle, RotateCcw } from 'lucide-react';
import ProjectModal from './ProjectModal';
import DraggableCard from './DraggableCard';
import useAuthStore from '../../../store/useAuthStore';

// IMPORTAÇÃO DO MODAL DE LEAD
import CreateLeadModal from '../../client-list/components/CreateLeadModal';

// Cores das Colunas (Borda Superior Colorida - Ajustadas para Neon)
const COLUMN_THEMES = {
  'CONTACT': 'border-t-blue-600 dark:border-t-blue-400',
  'PROPOSAL': 'border-t-pink-500 dark:border-t-pink-400',
  'BUDGET': 'border-t-purple-600 dark:border-t-purple-400',
  'WAITING': 'border-t-yellow-500 dark:border-t-yellow-400',
  'APPROVED': 'border-t-green-600 dark:border-t-green-400',
  'REJECTED': 'border-t-red-600 dark:border-t-red-400',
  'READY': 'border-t-cyan-600 dark:border-t-cyan-400',
  'EXECUTION': 'border-t-orange-500 dark:border-t-orange-400',
  'REVIEW': 'border-t-indigo-500 dark:border-t-indigo-400',
  'DONE': 'border-t-emerald-600 dark:border-t-emerald-400'
};

const PIPELINES = {
  SALES: {
    id: 'SALES',
    label: 'Comercial',
    icon: <Users size={16} />,
    columns: {
      'CONTACT': 'Qualificação',
      'PROPOSAL': 'Proposta Enviada', 
      'BUDGET': 'Negociação',
      'WAITING': 'Aprovação',
      'APPROVED': 'Fechamento ➡️',
      'REJECTED': 'Arquivados'
    }
  },
  ENGINEERING: {
    id: 'ENGINEERING',
    label: 'Engenharia',
    icon: <HardHat size={16} />,
    columns: {
      'CONTACT': '⬅️ Devolver',
      'READY': 'Fila de Obra',
      'EXECUTION': 'Em Execução',
      'REVIEW': 'Vistoria',
      'DONE': 'Concluído'
    }
  }
};

function KanbanBoard() {
  const { token } = useAuthStore(); // <--- PEGA O TOKEN AQUI
  const [projects, setProjects] = useState([]);
  const [currentPipeline, setCurrentPipeline] = useState('SALES'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados dos Modais
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); 
  const [selectedProject, setSelectedProject] = useState(null);

  // Carrega ao iniciar ou mudar o token
  useEffect(() => { 
      if (token) fetchProjects(); 
  }, [token]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) { 
        console.error("Erro ao buscar projetos:", error); 
    }
  };

  const getProjectPipeline = (project) => {
      if (project.pipeline) return project.pipeline;
      const engStatus = ['READY', 'EXECUTION', 'REVIEW', 'DONE'];
      if (engStatus.includes(project.status)) return 'ENGINEERING';
      return 'SALES'; 
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const actualPipeline = getProjectPipeline(p);
    return matchesSearch && actualPipeline === currentPipeline;
  });

  const onDragEnd = async (result) => {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const project = projects.find(p => String(p.id) === String(draggableId));
    if (!project) return;

    // 1. REORDENAÇÃO NA MESMA COLUNA
    if (source.droppableId === destination.droppableId) {
        const columnId = source.droppableId;
        const columnProjects = filteredProjects
            .filter(p => {
                if (columnId === 'CONTACT' && p.status === 'LEAD') return true;
                if (columnId === 'BUDGET' && p.status === 'VISIT') return true; 
                return p.status === columnId;
            })
            .sort((a, b) => (a.rank || 0) - (b.rank || 0));

        const newOrder = Array.from(columnProjects);
        const [movedItem] = newOrder.splice(source.index, 1);
        newOrder.splice(destination.index, 0, movedItem);

        let newRank;
        const prevItem = newOrder[destination.index - 1];
        const nextItem = newOrder[destination.index + 1];

        if (!prevItem && !nextItem) newRank = 1000;
        else if (!prevItem) newRank = (nextItem.rank || 0) / 2;
        else if (!nextItem) newRank = (prevItem.rank || 0) + 1000;
        else newRank = ((prevItem.rank || 0) + (nextItem.rank || 0)) / 2;

        const updatedProjects = projects.map(p => String(p.id) === String(draggableId) ? { ...p, rank: newRank } : p);
        setProjects(updatedProjects);
        
        try { 
            await api.put(`/projects/${project.id}`, 
                { rank: newRank }
            ); 
        } catch (e) { fetchProjects(); }
        return;
    }

    // 2. MOVIMENTAÇÃO ENTRE COLUNAS
    let newPipeline = currentPipeline;
    let finalStatus = destination.droppableId;

    if (currentPipeline === 'SALES' && finalStatus === 'APPROVED') {
        if (window.confirm("✅ Venda realizada!\nEnviar para Engenharia?")) { newPipeline = 'ENGINEERING'; finalStatus = 'READY'; } else return;
    }
    if (currentPipeline === 'ENGINEERING' && finalStatus === 'CONTACT') {
        if (window.confirm("⚠️ Devolver para Comercial?")) { newPipeline = 'SALES'; finalStatus = 'CONTACT'; } else return;
    }

    const updatedProjects = projects.map((p) => {
      if (String(p.id) === String(draggableId)) return { ...p, status: finalStatus, pipeline: newPipeline };
      return p;
    });
    setProjects(updatedProjects);

    try {
      await api.put(`/projects/${project.id}`, 
          { status: finalStatus, pipeline: newPipeline }
      );
      if (newPipeline !== currentPipeline) setTimeout(fetchProjects, 500);
    } catch (error) { fetchProjects(); }
  };

  const handleCardClick = (project) => { setSelectedProject(project); setIsModalOpen(true); };
  const currentColumns = PIPELINES[currentPipeline].columns;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-neo-bg-main text-gray-800 dark:text-neo-white font-sans transition-colors duration-300 animate-fade-in-up">
      
      {/* TOPO */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-neo-surface-2 bg-white dark:bg-neo-bg-main shrink-0">
        <div><h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Fluxo de Trabalho</h1></div>
        <div className="flex gap-3">
            <div className="relative group">
                <Search className="absolute left-2.5 top-2 text-gray-400 dark:text-neo-text-sec w-3.5 h-3.5" />
                <input 
                    type="text" 
                    placeholder="Filtrar projetos..." 
                    className="pl-8 pr-3 py-1.5 bg-gray-100 dark:bg-neo-surface-1 border border-gray-200 dark:border-neo-surface-2 rounded-md text-xs focus:ring-1 focus:ring-blue-500 dark:focus:ring-neo-purple-light outline-none w-56 transition-all text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-neo-text-sec"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {currentPipeline === 'SALES' && (
                <button 
                    onClick={() => setIsCreateModalOpen(true)} 
                    className="bg-neo-green-main hover:bg-neo-green-light text-neo-bg-main font-bold px-4 py-1.5 rounded-md flex items-center gap-1.5 text-xs transition-all shadow-md"
                >
                    <Plus size={14} /> Novo
                </button>
            )}
        </div>
      </div>

      {/* ABAS */}
      <div className="flex gap-1 px-6 pt-3 bg-gray-50 dark:bg-neo-bg-main border-b border-gray-200 dark:border-neo-surface-2 shrink-0">
          {Object.entries(PIPELINES).map(([key, val]) => (
              <button 
                key={key} 
                onClick={() => setCurrentPipeline(key)} 
                className={`
                    flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all duration-300 rounded-t-lg
                    ${currentPipeline === key 
                        ? 'border-neo-purple-light text-neo-purple-light bg-white dark:bg-neo-surface-1 shadow-sm' 
                        : 'border-transparent text-gray-500 dark:text-neo-text-sec hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 hover:border-neo-green-main'
                    }
                `}
              >
                  {val.icon} {val.label}
                  <span 
                    className={`
                        px-1.5 py-0.5 rounded text-[10px] ml-1 transition-colors
                        ${currentPipeline === key 
                            ? 'bg-gray-100 dark:bg-neo-surface-2 text-gray-700 dark:text-white' 
                            : 'bg-gray-200 dark:bg-neo-surface-1 text-gray-500 dark:text-neo-text-sec group-hover:text-white'
                        }
                    `}
                  >
                      {projects.filter(p => getProjectPipeline(p) === key).length}
                  </span>
              </button>
          ))}
      </div>

      {/* KANBAN */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-5 h-full min-w-max pb-2">
            {Object.entries(currentColumns).map(([columnId, columnTitle]) => {
              
              const columnProjects = filteredProjects
                .filter((p) => {
                    if (columnId === 'CONTACT' && p.status === 'LEAD') return true;
                    if (columnId === 'BUDGET' && p.status === 'VISIT') return true;
                    return p.status === columnId;
                })
                .sort((a, b) => (a.rank || 0) - (b.rank || 0));

              const isApproval = columnId === 'APPROVED' && currentPipeline === 'SALES';
              const isReturn = columnId === 'CONTACT' && currentPipeline === 'ENGINEERING';
              
              let accentClass = COLUMN_THEMES[columnId] || 'border-t-gray-400';
              if (isReturn) accentClass = 'border-t-red-500 dark:border-t-red-400';

              return (
                <div key={columnId} className={`flex flex-col w-72 rounded-xl h-full border border-gray-200 dark:border-neo-surface-2 bg-gray-100 dark:bg-neo-surface-1 shadow-sm transition-colors border-t-4 ${accentClass}`}>
                  
                  <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-neo-surface-2/50">
                    <h2 className={`font-bold text-[11px] uppercase tracking-widest truncate max-w-[180px] ${isReturn ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-neo-text-sec'}`}>
                        {columnTitle}
                    </h2>
                    <span className="bg-white dark:bg-neo-bg-main text-gray-600 dark:text-white px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-sm">{columnProjects.length}</span>
                  </div>

                  <Droppable droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className={`flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar transition-colors rounded-b-xl ${snapshot.isDraggingOver ? 'bg-gray-200 dark:bg-neo-surface-2 ring-2 ring-inset ring-neo-purple-light/20' : ''}`}>
                        {columnProjects.map((project, index) => (
                          <Draggable key={project.id} draggableId={String(project.id)} index={index}>
                            {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{...provided.draggableProps.style}}>
                                    <DraggableCard project={project} isOverlay={false} onClick={() => handleCardClick(project)} isDragging={snapshot.isDragging} />
                                </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {isApproval && columnProjects.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-green-300 dark:border-neo-green-main/30 rounded-lg text-center opacity-50 m-1 bg-green-50 dark:bg-neo-green-main/5 hover:opacity-100 transition-opacity">
                                <ArrowRightCircle size={24} className="text-green-500 dark:text-neo-green-main mb-2" />
                                <span className="text-[10px] font-bold text-green-600 dark:text-neo-green-main">Solte para Aprovar</span>
                            </div>
                        )}

                        {isReturn && columnProjects.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-red-300 dark:border-red-500/30 rounded-lg text-center opacity-60 m-1 bg-red-50 dark:bg-red-500/10 hover:opacity-100 transition-opacity">
                                <RotateCcw size={24} className="text-red-500 mb-2" />
                                <span className="text-[10px] font-bold text-red-600 dark:text-red-400">Solte para Devolver</span>
                            </div>
                        )}

                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* --- RENDERIZAÇÃO DOS MODAIS --- */}
      {isModalOpen && selectedProject && (
        <ProjectModal project={selectedProject} onClose={() => setIsModalOpen(false)} onSaveSuccess={fetchProjects} />
      )}

      {isCreateModalOpen && (
        <CreateLeadModal 
            onClose={() => setIsCreateModalOpen(false)} 
            onSuccess={fetchProjects} 
        />
      )}
    </div>
  );
}

export default KanbanBoard;