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
 * =============================================================================
 */

import React, { useState, useMemo, useEffect } from 'react';
import { NeonorteLoader } from '@/components/ui/NeonorteLoader';
import {
  Search, Plus, MapPin,
  FolderOpen, Archive, Trash2
} from 'lucide-react';
import { KurupiraClient, TechnicalDesignSummary } from '@/services/NexusClient';
import { useUIStore } from '@/core/state/uiStore';
import { ProjectFormModal } from './components/ProjectFormModal';
import { SiteContextModal } from './SiteContextModal';

// =============================================================================
// TIPOS (Payload Anorético — apenas o necessário para decisão de clique)
// =============================================================================

export interface ProjectCard {
  projectId: string;
  technicalStatus: 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'APPROVED';
  targetPowerKwp: number;
  voltage: string;
  moduleCount: number;
  inverterCount: number;
  commercialContext: {
    clientName: string;
    city: string;
    state: string;
    averageConsumptionKwh: number;
  };
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Conecta com a chave do Google Maps injetada via Vite


// Gera URL de imagem satélite estática via Google Static Maps API (Premium Aesthetic)
const buildStaticMapUrl = (lat?: number | null, lng?: number | null) => {
  if (!lat || !lng || lat === 0 || lng === 0) return null;
  
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey.length < 5) {
    console.warn('[ProjectExplorer] Google Maps API Key is missing or invalid.');
    return null;
  }

  // Usaremos um marcador DOM/HTML customizado sobre a imagem renderizada, 
  // permitindo visuais complexos (logo da Neonorte + crosshair) sem as 
  // limitações de URL pública da API do Google Static Maps.
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=400x200&maptype=satellite&key=${apiKey}`;
};

// Extrator do Swagger/API local para ProjectCard
const mapSummaryToCard = (summary: TechnicalDesignSummary): ProjectCard => {
  return {
    projectId: summary.id,
    technicalStatus: (summary.status as any) || 'DRAFT',
    targetPowerKwp: summary.targetPowerKwp || 0,
    voltage: String(summary.voltage || '—'),
    moduleCount: summary.moduleCount || 0,
    inverterCount: summary.inverterCount || 0,
    commercialContext: {
      clientName: summary.clientName || summary.leadContext?.name || summary.name || 'Sem Título',
      city: summary.city || summary.leadContext?.city || 'Desconhecida',
      state: summary.state || summary.leadContext?.state || 'UF',
      averageConsumptionKwh: summary.averageConsumptionKwh || 0,
    },
    thumbnailUrl: buildStaticMapUrl(summary.lat, summary.lng),
    createdAt: summary.updatedAt,
    updatedAt: summary.updatedAt,
  };
};

// =============================================================================
// STATUS CONFIG
// =============================================================================

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT: { label: 'Rascunho', bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-400' },
  IN_PROGRESS: { label: 'Em Progresso', bg: 'bg-neonorte-lightPurple/10', text: 'text-neonorte-lightPurple', dot: 'bg-neonorte-lightPurple' },
  REVIEW: { label: 'Revisão', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  APPROVED: { label: 'Aprovado', bg: 'bg-neonorte-green/10', text: 'text-neonorte-darkGreen', dot: 'bg-neonorte-green' },
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
  const [projects, setProjects] = useState<TechnicalDesignSummary[]>([]);
  
  // Zustand State
  const { setAppLoading, clearAppLoading } = useUIStore(s => ({
    setAppLoading: s.setAppLoading,
    clearAppLoading: s.clearAppLoading
  }));
  
  // Local derived state for UI feedback (labels)
  const isHubLoading = useUIStore(s => s.isAppLoading && s.loadingContext === 'project-hub');

  // Modal States
  const [formProjectId, setFormProjectId] = useState<string | null>(null);
  const [contextProjectId, setContextProjectId] = useState<string | null>(null);

  const fetchProjects = async () => {
    setAppLoading('project-hub', 'Sincronizando projetos...');
    try {
      const data = await KurupiraClient.designs.list();
      setProjects(data);
    } catch (e) {
      console.error('Failed to fetch projects', e);
    } finally {
      clearAppLoading();
    }
  };

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.debug(`[ProjectExplorer] Archive requested for ID: ${id}`);
    
    if (!window.confirm('Deseja arquivar este projeto? Ele será ocultado da lista principal.')) {
      console.debug(`[ProjectExplorer] Archive cancelled for ID: ${id}`);
      return;
    }
    
    try {
      await KurupiraClient.designs.update(id, { status: 'ARCHIVED' });
      fetchProjects();
    } catch (err) {
      console.error('Failed to archive project', err);
      window.alert('Erro ao arquivar projeto. Verifique sua conexão com o banco de dados.');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.debug(`[ProjectExplorer] Delete requested for ID: ${id}`);
    
    if (!window.confirm('ATENÇÃO: Deseja ELIMINAR definitivamente este projeto? Esta ação não pode ser desfeita.')) {
      console.debug(`[ProjectExplorer] Delete cancelled for ID: ${id}`);
      return;
    }
    
    try {
      console.debug(`[ProjectExplorer] Executing DELETE for ID: ${id}`);
      await KurupiraClient.designs.delete(id);
      fetchProjects();
    } catch (err) {
      console.error('Failed to delete project', err);
      window.alert('Erro crítico ao eliminar projeto. O servidor pode estar inacessível.');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Filtragem reativa in-memory (< 100ms)
  const filteredProjects = useMemo(() => {
    let result = projects.map(mapSummaryToCard);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.commercialContext.clientName.toLowerCase().includes(q) ||
        p.commercialContext.city.toLowerCase().includes(q) ||
        p.technicalStatus.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'ALL') {
      result = result.filter(p => p.technicalStatus === statusFilter);
    }

    return result;
  }, [searchQuery, statusFilter, projects]);

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">

      {/* ── COMMAND BAR (Solid / Tool-like) ── */}
      <div className="shrink-0 border-b border-slate-800 bg-slate-900 px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-3 bg-emerald-500" />
              Explorador de Projetos
            </h1>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">
              {isHubLoading ? 'Sincronizando...' : `${filteredProjects.length} Indexados`}
            </p>
          </div>
          <div className="w-px h-8 bg-slate-800 hidden md:block mx-2" />
          
          {/* PERMANENT FILTER TABS (VS Code Style) */}
          <div className="hidden lg:flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-sm border border-slate-800">
             {['ALL', 'DRAFT', 'IN_PROGRESS', 'REVIEW', 'APPROVED'].map(status => {
              const isActive = statusFilter === status;
              const config = STATUS_CONFIG[status];
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-sm ${isActive
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent hover:bg-slate-900/50'
                    }`}
                >
                  {status === 'ALL' ? 'Todos' : config?.label || status}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & CTA (Strict Geometry) */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-64 relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="BUSCAR CLIENTE, CIDADE..."
              className="w-full h-8 pl-9 pr-12 rounded-sm bg-slate-950 border border-slate-800 text-[11px] font-bold text-white placeholder:text-slate-700 focus:border-indigo-500/50 outline-none transition-all uppercase tracking-wider"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center h-4 px-1 rounded-sm bg-slate-800 text-[8px] font-mono text-slate-400 font-bold border border-slate-700">⌘K</kbd>
            </div>
          </div>
          
          <button onClick={() => setFormProjectId('NEW')} className="flex items-center justify-center gap-2 h-8 px-4 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[11px] font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <Plus size={14} />
            <span className="hidden xs:inline">Novo</span>
          </button>
        </div>
      </div>

      {/* ── GRID DE PROJETOS (Industrial) ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 bg-[radial-gradient(square_40px_at_50%_0%,rgba(16,185,129,0.02),transparent)] relative">
        {isHubLoading ? (
          <>
            <NeonorteLoader size="panel" context="project-hub" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 opacity-50">
               {Array(10).fill(0).map((_, i) => <ProjectSkeletonCard key={i} />)}
            </div>
          </>
        ) : filteredProjects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center border border-dashed border-slate-800 rounded-sm p-8 sm:p-12">
            <div className="w-16 h-16 mb-4 relative opacity-40">
              <div className="absolute inset-0 border border-slate-700 rotate-45" />
              <div className="absolute inset-0 border border-slate-700 -rotate-45 flex items-center justify-center">
                 <FolderOpen size={24} className="text-slate-600 rotate-45" />
              </div>
            </div>
            <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em]">Fluxo de Dados Indisponível</p>
            <p className="text-[9px] text-slate-700 mt-2 uppercase tracking-widest">Sincronize ou crie um novo projeto para iniciar a telemetria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-5">
            {filteredProjects.map(project => (
              <ProjectCardComponent
                key={project.projectId}
                project={project}
                onClick={() => setContextProjectId(project.projectId)}
                onArchive={(e) => handleArchive(project.projectId, e)}
                onDelete={(e) => handleDelete(project.projectId, e)}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectFormModal
          isOpen={formProjectId !== null}
          onClose={() => setFormProjectId(null)}
          onSaveSuccess={() => { fetchProjects(); }}
      />

      <SiteContextModal
        projectId={contextProjectId}
        isOpen={!!contextProjectId}
        onClose={() => setContextProjectId(null)}
        onDimensionar={(id) => {
          setContextProjectId(null);
          onSelectProject(id);
        }}
      />
    </div>
  );
};

// Deterministic pattern seed from project name
const getPatternSeed = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

// =============================================================================
// PROJECT SKELETON CARD (Loader Premium)
// =============================================================================

const ProjectSkeletonCard: React.FC = () => {
  return (
    <div className="bg-[#0B0D13] border border-slate-800 rounded-sm overflow-hidden animate-pulse flex flex-col">
      <div className="px-3 py-3 border-b border-slate-800/50 bg-slate-900/30 flex gap-2 items-center">
        <div className="h-2 w-2 bg-slate-800" />
        <div className="h-2 w-1/2 bg-slate-800" />
      </div>
      <div className="h-24 w-full bg-slate-900/20 border-b border-slate-800/50" />
      <div className="grid grid-cols-4 divide-x divide-slate-800/50">
        {[1,2,3,4].map(i => (
          <div key={i} className="p-2 flex flex-col items-center gap-1.5">
            <div className="h-1.5 w-6 bg-slate-800" />
            <div className="h-3 w-8 bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// PROJECT CARD (Premium Dark Glass — Visual-First)
// =============================================================================

const ProjectCardComponent: React.FC<{
  project: ProjectCard;
  onClick: () => void;
  onArchive: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}> = ({ project, onClick, onArchive, onDelete }) => {
  const [mapError, setMapError] = useState(false);
  const status = STATUS_CONFIG[project.technicalStatus] || STATUS_CONFIG.DRAFT;
  const { commercialContext: ctx } = project;
  const seed = getPatternSeed(ctx.clientName);

  // Generate deterministic grid pattern based on project name
  const patternCells = Array(12).fill(0).map((_, i) => {
    const isLit = ((seed >> (i % 16)) & 1) === 1;
    return isLit;
  });

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="group relative bg-[#0B0D13] border border-slate-800 rounded-sm overflow-hidden text-left transition-all duration-200 hover:border-indigo-500/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.05)] cursor-pointer flex flex-col"
    >
      {/* ── HEADER ── */}
      <div className="px-3 py-2.5 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/30">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`shrink-0 w-2 h-2 rounded-none ${status.dot} shadow-[0_0_8px_rgba(var(--tw-color-indigo-500),0.3)]`} />
          <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.1em] truncate group-hover:text-white transition-colors" title={ctx.clientName}>
            {ctx.clientName}
          </h3>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onArchive(e); }}
              title="Arquivar"
              className="w-6 h-6 flex items-center justify-center bg-slate-800/50 rounded-sm hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <Archive size={12} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(e); }}
              title="Eliminar"
              className="w-6 h-6 flex items-center justify-center bg-slate-800/50 rounded-sm hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
            >
              <Trash2 size={12} />
            </button>
        </div>
      </div>

      {/* ── MEDIA (LETTERBOX) ── */}
      <div className="relative h-24 w-full bg-slate-950 overflow-hidden border-b border-slate-800/50">
        {project.thumbnailUrl && !mapError ? (
          <>
            <img 
              src={project.thumbnailUrl} 
              alt="Site" 
              onError={() => setMapError(true)}
              className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-700" 
            />
            {/* ── Marcador Neonorte Personalizado (DOM Overlay) ── */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] flex flex-col items-center pointer-events-none drop-shadow-md z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-500"
            >
              {/* Badge com logo Neonorte */}
              <div
                className="w-6 h-6 flex items-center justify-center overflow-hidden mb-[-1px] relative z-20"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #2D6A4F, #1B4332)',
                  border: '1.5px solid #fff',
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)',
                  boxShadow: '0 0 0 1px #4CAF50, 0 4px 8px rgba(0,0,0,0.4), inset 0 0 4px rgba(0,0,0,0.2)',
                }}
              >
                <img
                  src="/logos/simbolo-branco.png"
                  alt="Neonorte"
                  className="w-3.5 h-3.5 object-contain"
                  style={{
                    transform: 'rotate(45deg)',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                  }}
                />
              </div>
              
              {/* Alvo de Precisão (Ancoragem/Crosshair) */}
              <div className="flex items-center justify-center relative w-3 h-3">
                <div className="absolute inset-0 rounded-full border border-white/50 bg-green-500/20" />
                <div className="absolute w-[1px] h-full bg-white/60" />
                <div className="absolute w-full h-[1px] bg-white/60" />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full border border-white shadow-[0_0_6px_#10B981] z-10" />
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 grid grid-cols-6 gap-px p-2 opacity-30">
            {patternCells.map((isLit, i) => (
              <div key={i} className={`rounded-none ${isLit ? 'bg-indigo-500/30' : 'bg-slate-800/10'}`} />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[7px] font-black text-slate-700 uppercase tracking-widest text-center px-1 bg-slate-950/80 p-1">
                  {mapError ? "MAP_ERROR" : "NO_COORD"}
                </div>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D13] to-transparent opacity-80 pointer-events-none" />
        
        {/* Overlaid ID & Location */}
        <div className="absolute bottom-1.5 left-3 flex items-center gap-1.5 drop-shadow-md">
          <MapPin size={8} className="text-indigo-400" />
          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest truncate max-w-[150px]">
            {ctx.city !== 'Desconhecida' ? `${ctx.city}, ${ctx.state}` : 'LOCAL NÃO ESPECIFICADO'}
          </span>
        </div>
        <div className="absolute bottom-1.5 right-3 text-[8px] font-mono font-black text-slate-500 tracking-widest bg-slate-950/80 px-1 rounded-sm border border-slate-800/50">
          ID:{project.projectId.slice(0, 6)}
        </div>
      </div>

      {/* ── TELEMETRY GRID ── */}
      <div className="grid grid-cols-4 divide-x divide-slate-800/50 bg-[#0B0D13]">
        <div className="p-2 flex flex-col items-center justify-center text-center">
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Potência (kWp)</span>
          <span className="text-[12px] font-mono font-bold text-indigo-400 tabular-nums">
             {project.targetPowerKwp > 0 ? project.targetPowerKwp.toFixed(2) : '0.00'}
          </span>
        </div>
        <div className="p-2 flex flex-col items-center justify-center text-center">
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Consumo (kWh)</span>
          <span className="text-[12px] font-mono font-bold text-sky-400 tabular-nums">
            {ctx.averageConsumptionKwh > 0 ? Math.round(ctx.averageConsumptionKwh) : '0'}
          </span>
        </div>
        <div className="p-2 flex flex-col items-center justify-center text-center bg-slate-900/10">
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Módulos</span>
          <span className="text-[12px] font-mono font-bold text-emerald-400 tabular-nums">
            {project.moduleCount}
          </span>
        </div>
        <div className="p-2 flex flex-col items-center justify-center text-center bg-slate-900/10">
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Inversores</span>
          <span className="text-[12px] font-mono font-bold text-amber-400 tabular-nums">
             {project.inverterCount}
          </span>
        </div>
      </div>
    </div>
  );
};

