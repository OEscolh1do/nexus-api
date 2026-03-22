/**
 * =============================================================================
 * PROJECT EXPLORER — Grelha Visual-First (Fase 1 do UX-001)
 * =============================================================================
 *
 * Porta de entrada do Kurupira. Abandona o paradigma de "Lista de Clientes"
 * em favor de uma grelha de cartões visuais focados no SÍTIO (Site),
 * com thumbnail do mapa de satélite como elemento de destaque.
 *
 * O engenheiro não procura um "Lead"; ele procura visualmente pelo
 * telhado que vai dimensionar.
 *
 * MOCK DATA: Temporário até integração com BFF (GET /api/kurupira/projects)
 * =============================================================================
 */

import React, { useState, useMemo } from 'react';
import {
  Search, Plus, MapPin, Zap, SlidersHorizontal,
  Battery, ArrowUpRight, Clock, Filter
} from 'lucide-react';

// =============================================================================
// TIPOS (Payload Anorético — apenas o necessário para decisão de clique)
// =============================================================================

export interface ProjectCard {
  projectId: string;
  technicalStatus: 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'APPROVED';
  targetPowerKwp: number;
  voltage: string;
  commercialContext: {
    clientName: string;
    city: string;
    state: string;
    averageConsumptionKwh: number;
  };
  thumbnailUrl: string | null;
  createdAt: string;
  lastModified: string;
}

// =============================================================================
// MOCK DATA (substituir por React Query + BFF)
// =============================================================================

const MOCK_PROJECTS: ProjectCard[] = [
  {
    projectId: 'prj-001',
    technicalStatus: 'IN_PROGRESS',
    targetPowerKwp: 75.6,
    voltage: '380V',
    commercialContext: {
      clientName: 'Supermercado Central',
      city: 'Manaus',
      state: 'AM',
      averageConsumptionKwh: 12000,
    },
    thumbnailUrl: null,
    createdAt: '2026-03-10',
    lastModified: '2026-03-19',
  },
  {
    projectId: 'prj-002',
    technicalStatus: 'DRAFT',
    targetPowerKwp: 8.4,
    voltage: '220V',
    commercialContext: {
      clientName: 'Residência Silva',
      city: 'Manaus',
      state: 'AM',
      averageConsumptionKwh: 450,
    },
    thumbnailUrl: null,
    createdAt: '2026-03-15',
    lastModified: '2026-03-18',
  },
  {
    projectId: 'prj-003',
    technicalStatus: 'REVIEW',
    targetPowerKwp: 150.0,
    voltage: '380V',
    commercialContext: {
      clientName: 'Galpão Industrial Norte',
      city: 'Manaus',
      state: 'AM',
      averageConsumptionKwh: 28000,
    },
    thumbnailUrl: null,
    createdAt: '2026-03-01',
    lastModified: '2026-03-20',
  },
  {
    projectId: 'prj-004',
    technicalStatus: 'APPROVED',
    targetPowerKwp: 12.1,
    voltage: '220V',
    commercialContext: {
      clientName: 'Clínica Saúde Vida',
      city: 'Itacoatiara',
      state: 'AM',
      averageConsumptionKwh: 850,
    },
    thumbnailUrl: null,
    createdAt: '2026-02-20',
    lastModified: '2026-03-05',
  },
  {
    projectId: 'prj-005',
    technicalStatus: 'IN_PROGRESS',
    targetPowerKwp: 45.0,
    voltage: '380V',
    commercialContext: {
      clientName: 'Escola Municipal Amazonas',
      city: 'Parintins',
      state: 'AM',
      averageConsumptionKwh: 6200,
    },
    thumbnailUrl: null,
    createdAt: '2026-03-12',
    lastModified: '2026-03-17',
  },
  {
    projectId: 'prj-006',
    technicalStatus: 'DRAFT',
    targetPowerKwp: 5.5,
    voltage: '220V',
    commercialContext: {
      clientName: 'Residência Costa',
      city: 'Tefé',
      state: 'AM',
      averageConsumptionKwh: 320,
    },
    thumbnailUrl: null,
    createdAt: '2026-03-18',
    lastModified: '2026-03-18',
  },
];

// =============================================================================
// STATUS CONFIG
// =============================================================================

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT: { label: 'Rascunho', bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-400' },
  IN_PROGRESS: { label: 'Em Progresso', bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  REVIEW: { label: 'Revisão', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  APPROVED: { label: 'Aprovado', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
};

// =============================================================================
// PROPS
// =============================================================================

interface ProjectExplorerProps {
  onSelectProject: (projectId: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({ onSelectProject }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // Filtragem reativa in-memory (< 100ms)
  const filteredProjects = useMemo(() => {
    let result = MOCK_PROJECTS;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.commercialContext.clientName.toLowerCase().includes(q) ||
        p.commercialContext.city.toLowerCase().includes(q) ||
        p.targetPowerKwp.toString().includes(q)
      );
    }

    if (statusFilter !== 'ALL') {
      result = result.filter(p => p.technicalStatus === statusFilter);
    }

    return result;
  }, [searchQuery, statusFilter]);

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">

      {/* ── HEADER STRIP ── */}
      <div className="shrink-0 border-b border-slate-800 px-5 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">
              Explorador de Projetos
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {filteredProjects.length} projeto{filteredProjects.length !== 1 ? 's' : ''} encontrado{filteredProjects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all border border-emerald-500/20">
            <Plus size={14} />
            Novo Projeto
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, cidade ou potência..."
              className="w-full h-8 pl-9 pr-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-all ${showFilters
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>

        {/* Filter chips (expandável) */}
        {showFilters && (
          <div className="flex flex-wrap gap-1.5 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
            {['ALL', 'DRAFT', 'IN_PROGRESS', 'REVIEW', 'APPROVED'].map(status => {
              const isActive = statusFilter === status;
              const config = STATUS_CONFIG[status];
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${isActive
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                    }`}
                >
                  {status === 'ALL' ? 'Todos' : config?.label || status}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── GRID DE PROJETOS (Visual-First) ── */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Filter size={32} className="text-slate-700 mb-3" />
            <p className="text-sm font-semibold text-slate-500">Nenhum projeto encontrado</p>
            <p className="text-xs text-slate-600 mt-1">Tente ajustar os filtros ou criar um novo projeto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProjects.map(project => (
              <ProjectCardComponent
                key={project.projectId}
                project={project}
                onClick={() => onSelectProject(project.projectId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// PROJECT CARD (Visual-First com thumbnail placeholder)
// =============================================================================

const ProjectCardComponent: React.FC<{
  project: ProjectCard;
  onClick: () => void;
}> = ({ project, onClick }) => {
  const status = STATUS_CONFIG[project.technicalStatus] || STATUS_CONFIG.DRAFT;
  const { commercialContext: ctx } = project;

  return (
    <button
      onClick={onClick}
      className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-left transition-all duration-200 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
    >
      {/* Thumbnail Area (Static Map Tile placeholder) */}
      <div className="relative h-28 bg-gradient-to-br from-slate-800 to-slate-850 overflow-hidden">
        {project.thumbnailUrl ? (
          <img src={project.thumbnailUrl} alt="Site" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {/* Placeholder visual — simula grid de satélite */}
            <div className="absolute inset-0 opacity-10">
              <div className="grid grid-cols-4 grid-rows-3 h-full w-full gap-px">
                {Array(12).fill(0).map((_, i) => (
                  <div key={i} className="bg-emerald-500/30 rounded-sm" />
                ))}
              </div>
            </div>
            <MapPin size={20} className="text-slate-600 relative z-10" />
          </div>
        )}

        {/* Status badge flutuante */}
        <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full ${status.bg} backdrop-blur-sm`}>
          <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          <span className={`text-[9px] font-bold uppercase tracking-wider ${status.text}`}>
            {status.label}
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
            <ArrowUpRight size={12} className="text-white" />
            <span className="text-[10px] font-bold text-white">Abrir Contexto</span>
          </div>
        </div>
      </div>

      {/* Info Area */}
      <div className="p-3">
        <h3 className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
          {ctx.clientName}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          <MapPin size={10} className="text-slate-600 shrink-0" />
          <span className="text-[10px] text-slate-500 truncate">{ctx.city}, {ctx.state}</span>
        </div>

        {/* Parâmetros técnicos */}
        <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-slate-800">
          <div className="flex items-center gap-1">
            <Zap size={10} className="text-orange-400" />
            <span className="text-[10px] font-bold text-slate-300">{project.targetPowerKwp} kWp</span>
          </div>
          <div className="flex items-center gap-1">
            <Battery size={10} className="text-blue-400" />
            <span className="text-[10px] text-slate-500">{ctx.averageConsumptionKwh.toLocaleString('pt-BR')} kWh</span>
          </div>
        </div>

        {/* Last modified */}
        <div className="flex items-center gap-1 mt-2">
          <Clock size={9} className="text-slate-700" />
          <span className="text-[9px] text-slate-600">
            {new Date(project.lastModified).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      </div>
    </button>
  );
};
