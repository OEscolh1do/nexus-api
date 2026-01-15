// /frontend/src/components/Layout/MainLayout.jsx
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import api from '../../lib/axios';
import { Menu } from 'lucide-react'; // Ícone do menu hambúrguer
import Sidebar from './Sidebar';
import ProjectModal from '../../features/kanban-board/components/ProjectModal';



function MainLayout() {
  // --- LÓGICA EXISTENTE DO MODAL E DADOS ---
  const [selectedProject, setSelectedProject] = useState(null);
  const location = useLocation(); 
  const [dataKey, setDataKey] = useState(Date.now());

  // --- LÓGICA DE RESPONSIVIDADE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const reloadData = () => setDataKey(Date.now());

  const openProjectModal = async (projectOrId) => {
    if (typeof projectOrId === 'string') {
      try {
        const response = await api.get(`/projects/${projectOrId}`); 
        setSelectedProject(response.data);
      } catch (err) {
        console.error("Erro ao buscar projeto por ID:", err);
      }
    } else {
      setSelectedProject(projectOrId);
    }
  };

  const closeModal = () => {
    setSelectedProject(null);
    if (location.pathname === '/kanban' || location.pathname === '/clients') {
      reloadData();
    }
  };

  return (
    <div className="flex h-screen bg-neo-bg-main overflow-hidden">
      
      {/* SIDEBAR */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* WRAPPER DO CONTEÚDO */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* HEADER MOBILE */}
        <header className="md:hidden bg-neo-bg-main border-b border-neo-surface-2 p-4 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 -ml-2 rounded-lg text-neo-text-primary hover:bg-neo-surface-1 active:bg-neo-surface-2 transition-colors"
                >
                    <Menu size={24} />
                </button>
                <span className="font-bold text-neo-text-primary">Nexus Norte</span>
            </div>
        </header>

        {/* ÁREA DE ROLAGEM PRINCIPAL */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-neo-bg-main relative custom-scrollbar">
          <Outlet key={dataKey} context={{ openProjectModal }} />
        </main>

      </div>

      {/* MODAL GLOBAL */}
      <ProjectModal 
        project={selectedProject} 
        onClose={closeModal}
        onSaveSuccess={reloadData} 
      />
    </div>
  );
}

export default MainLayout;