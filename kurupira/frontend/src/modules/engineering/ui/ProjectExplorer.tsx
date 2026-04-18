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
import {
  Search, Plus, MapPin, SlidersHorizontal,
  FolderOpen, Archive, Trash2
} from 'lucide-react';
import { KurupiraClient, TechnicalDesignSummary } from '@/services/NexusClient';
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

// Gera URL de tile satélite estático via OpenStreetMap tile server (grátis, sem API key)
function buildStaticMapUrl(lat: number | null | undefined, lng: number | null | undefined): string | null {
  if (!lat || !lng) return null;
  // Calcula tile x/y no zoom 17 (nível de telhado) e retorna tile individual 256x256
  const zoom = 17;
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2 * n);
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

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
  const [showFilters, setShowFilters] = useState(false);
  const [projects, setProjects] = useState<TechnicalDesignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [formProjectId, setFormProjectId] = useState<string | null>(null);
  const [contextProjectId, setContextProjectId] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await KurupiraClient.designs.list();
      setProjects(data);
    } catch (e) {
      console.error('Failed to fetch projects', e);
    } finally {
      setLoading(false);
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
            <h1 className="text-[13px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
              <FolderOpen size={14} className="text-emerald-500" />
              Explorador de Projetos
            </h1>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">
              {loading ? 'Sincronizando...' : `${filteredProjects.length} Indexados`}
            </p>
          </div>
          <div className="w-px h-8 bg-slate-800 hidden md:block mx-2" />
        </div>

        {/* Search, Filters + CTA (Strict Geometry) */}
        <div className="flex items-center gap-2 flex-1 md:max-w-xl justify-end">
          <div className="flex-1 relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="BUSCAR CLIENTE, CIDADE..."
              className="w-full h-8 pl-9 pr-3 rounded-sm bg-slate-950 border border-slate-800 text-[11px] font-bold text-white placeholder:text-slate-700 focus:border-indigo-500/50 outline-none transition-all uppercase tracking-wider"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-8 w-8 flex items-center justify-center rounded-sm border transition-all ${showFilters
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
              : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-300'
              }`}
          >
            <SlidersHorizontal size={14} />
          </button>
          
          <button onClick={() => setFormProjectId('NEW')} className="flex items-center justify-center gap-2 h-8 px-3 sm:px-4 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[11px] font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]">
            <Plus size={14} />
            <span className="hidden xs:inline">Novo Projeto</span>
          </button>
        </div>
        {/* Filter Bar (Integrated) */}
        {showFilters && (
          <div className="flex flex-wrap gap-px mt-2 overflow-hidden border border-slate-800 animate-in fade-in slide-in-from-top-1 duration-200">
            {['ALL', 'DRAFT', 'IN_PROGRESS', 'REVIEW', 'APPROVED'].map(status => {
              const isActive = statusFilter === status;
              const config = STATUS_CONFIG[status];
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all border-r last:border-r-0 border-slate-800 ${isActive
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'bg-slate-950 text-slate-600 hover:text-slate-400 hover:bg-slate-900'
                    }`}
                >
                  {status === 'ALL' ? 'Todos' : config?.label || status}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── GRID DE PROJETOS (Industrial) ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 bg-[radial-gradient(square_40px_at_50%_0%,rgba(16,185,129,0.02),transparent)]">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
             {Array(8).fill(0).map((_, i) => <ProjectSkeletonCard key={i} />)}
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
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
    <div className="relative bg-slate-950 border border-slate-900 rounded-sm overflow-hidden animate-pulse flex flex-col">
      <div className="flex flex-1">
        {/* Left HUD skeleton */}
        <div className="flex-1 p-3.5 border-r border-slate-900 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-2 w-16 bg-slate-900 rounded-none" />
            <div className="space-y-2">
              <div className="h-2 w-10 bg-slate-900 rounded-none" />
              <div className="h-10 w-24 bg-slate-900/60 rounded-none" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-6 w-12 bg-slate-900/40 rounded-none" />
            <div className="h-6 w-12 bg-slate-900/40 rounded-none" />
          </div>
        </div>
        {/* Right Media skeleton */}
        <div className="w-[120px] bg-slate-900/20" />
      </div>
      
      {/* Footer skeleton */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="h-3 w-3/4 bg-slate-800 rounded-none" />
            <div className="h-2 w-1/4 bg-slate-800 rounded-none" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-slate-800 rounded-none" />
            <div className="h-8 w-8 bg-slate-800 rounded-none" />
          </div>
        </div>
        <div className="h-px bg-slate-800/40" />
        <div className="flex justify-between items-center opacity-40">
          <div className="h-2 w-12 bg-slate-800 rounded-none" />
          <div className="h-2 w-12 bg-slate-800 rounded-none" />
        </div>
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
      className="group relative bg-slate-950 border border-slate-800 rounded-sm overflow-hidden text-left transition-all duration-200 hover:outline hover:outline-1 hover:outline-indigo-500/30 hover:bg-slate-900/40 cursor-pointer shadow-lg shadow-black/20"
    >
      <div className="flex">
        {/* ── LEFT COLUMN: HUD TELEMETRY (SCADA LCD Style) ── */}
        <div className="flex-1 p-3.5 flex flex-col justify-between border-r border-slate-900 relative">
          {/* LCD Frame Details */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-800" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-800" />
          
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-none ${status.dot} shadow-[0_0_8px_rgba(var(--tw-color-indigo-500),0.3)]`} />
              <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${status.text} opacity-90`}>
                {status.label}
              </span>
            </div>
            
            <div className="space-y-1 relative group/hud p-2 bg-black/30 rounded-sm border border-slate-900/50 overflow-hidden">
               {/* Scanline Effect Overlay */}
               <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
               
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] block mb-1">Potência Nominal</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-mono font-black text-indigo-400 tabular-nums leading-none tracking-tighter drop-shadow-[0_0_8px_rgba(129,140,248,0.2)]">
                  {project.targetPowerKwp > 0 ? project.targetPowerKwp.toFixed(2) : '0.00'}
                </span>
                <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">kWp</span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="border-l border-slate-800 pl-2">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em] block mb-0.5">Consumo</span>
              <span className="text-[12px] font-mono font-bold text-sky-500/90 tabular-nums">
                {ctx.averageConsumptionKwh > 0 ? Math.round(ctx.averageConsumptionKwh) : '0'}<span className="text-[8px] ml-1 text-slate-700 font-black">kWh</span>
              </span>
            </div>
            <div className="border-l border-slate-800 pl-2">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em] block mb-0.5">Rede AC</span>
              <span className="text-[12px] font-mono font-bold text-amber-500/90 uppercase">
                {project.voltage !== '—' ? project.voltage : '---'}
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: SITE VISUAL ── */}
        <div className="w-[120px] flex flex-col border-l border-slate-900 bg-black/20">
          <div className="relative aspect-square w-full overflow-hidden bg-slate-950 border-b border-slate-900">
            {project.thumbnailUrl ? (
              <img 
                src={project.thumbnailUrl} 
                alt="Site" 
                className="w-full h-full object-cover grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-110 group-hover:scale-100" 
              />
            ) : (
              <div className="absolute inset-0 grid grid-cols-4 gap-px bg-slate-950/40 p-2 opacity-30">
                {patternCells.map((isLit, i) => (
                  <div key={i} className={`rounded-none ${isLit ? 'bg-indigo-500/30' : 'bg-slate-800/10'}`} />
                ))}
              </div>
            )}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.8)_100%)] pointer-events-none" />
          </div>

          <div className="flex-1 p-3 flex flex-col justify-center gap-2 bg-slate-900/20">
            <div className="flex justify-between items-center border-b border-slate-800/50 pb-1">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">MOD</span>
              <span className="text-[11px] text-slate-400 font-mono font-black">{project.moduleCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">INV</span>
              <span className="text-[11px] text-slate-400 font-mono font-black">{project.inverterCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER: IDENTITY STRIP & QUICK ACTIONS ── */}
      <div className="bg-slate-900 border-t border-slate-800 flex flex-col">
        <div className="px-4 py-2.5 flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] truncate group-hover:text-white transition-colors" title={ctx.clientName}>
              {ctx.clientName}
            </h3>
            
            <div className="flex items-center gap-1.5 opacity-60 mt-1">
              <MapPin size={8} className="text-indigo-500" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[120px]">
                {ctx.city !== 'Desconhecida' ? `${ctx.city}, ${ctx.state}` : 'LOCAL NÃO ESPECIFICADO'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onArchive(e);
              }}
              title="Arquivar Projeto"
              className="w-8 h-8 flex items-center justify-center bg-slate-950/50 border border-slate-800 rounded-sm hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-400 text-slate-500 transition-all"
            >
              <Archive size={14} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete(e);
              }}
              title="Eliminar Projeto"
              className="w-8 h-8 flex items-center justify-center bg-slate-950/50 border border-slate-800 rounded-sm hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-slate-500 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* BOTTOM METADATA BAR */}
        <div className="px-4 py-1.5 bg-black/20 border-t border-slate-800/40 flex justify-between items-center">
          <div className="text-[9px] font-mono font-black text-slate-700 uppercase tabular-nums tracking-widest">
            ID:{project.projectId.slice(0, 8)}
          </div>
          <div className="text-[9px] font-mono font-black text-slate-700 uppercase tabular-nums tracking-widest">
            ATU:{new Date(project.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

