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
  Search, Plus, MapPin, Zap, SlidersHorizontal,
  Battery, ArrowUpRight, Clock, Edit2, Loader2, FolderOpen
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
    voltage: '220V',
    commercialContext: {
      // Single Source of Truth: designData.solar.clientData (via extractDesignMetrics)
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
          <button onClick={() => setFormProjectId('NEW')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all border border-emerald-500/20">
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
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 gap-3">
             <Loader2 size={32} className="animate-spin text-emerald-500/50" />
             <p className="text-sm font-semibold">Carregando Projetos...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FolderOpen size={48} className="text-slate-700/50 mb-3" />
            <p className="text-sm font-semibold text-slate-500">Nenhum projeto encontrado</p>
            <p className="text-xs text-slate-600 mt-1">Tente ajustar os filtros ou criar um novo projeto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProjects.map(project => (
              <ProjectCardComponent
                key={project.projectId}
                project={project}
                onClick={() => setContextProjectId(project.projectId)}
                onEdit={(e) => { e.stopPropagation(); setFormProjectId(project.projectId); }}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectFormModal
          isOpen={formProjectId !== null}
          projectId={formProjectId === 'NEW' ? null : formProjectId}
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

// =============================================================================
// STATUS GRADIENTS (Dynamic background per status)
// =============================================================================

const STATUS_GRADIENTS: Record<string, string> = {
  DRAFT: 'from-slate-700/40 via-slate-800/30 to-slate-900/60',
  IN_PROGRESS: 'from-blue-900/30 via-slate-800/30 to-slate-900/60',
  REVIEW: 'from-amber-900/20 via-slate-800/30 to-slate-900/60',
  APPROVED: 'from-emerald-900/20 via-slate-800/30 to-slate-900/60',
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
// PROJECT CARD (Premium Dark Glass — Visual-First)
// =============================================================================

const ProjectCardComponent: React.FC<{
  project: ProjectCard;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
}> = ({ project, onClick, onEdit }) => {
  const status = STATUS_CONFIG[project.technicalStatus] || STATUS_CONFIG.DRAFT;
  const { commercialContext: ctx } = project;
  const gradient = STATUS_GRADIENTS[project.technicalStatus] || STATUS_GRADIENTS.DRAFT;
  const seed = getPatternSeed(ctx.clientName);

  // Generate deterministic grid pattern based on project name
  const patternCells = Array(20).fill(0).map((_, i) => {
    const isLit = ((seed >> (i % 16)) & 1) === 1;
    return isLit;
  });

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="group relative bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 rounded-xl overflow-hidden text-left transition-all duration-300 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
    >
      {/* ── THUMBNAIL AREA (Generative Pattern) ── */}
      <div className={`relative h-32 bg-gradient-to-br ${gradient} overflow-hidden`}>
        {project.thumbnailUrl ? (
          <img src={project.thumbnailUrl} alt="Site" loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <>
            {/* Generative architectural pattern — simulates city/roof blocks */}
            <div className="absolute inset-0">
              <div className="grid grid-cols-5 grid-rows-4 h-full w-full gap-[2px] p-3">
                {patternCells.map((isLit, i) => (
                  <div
                    key={i}
                    className={`rounded-sm transition-all duration-500 ${
                      isLit
                        ? 'bg-emerald-500/15 group-hover:bg-emerald-400/25'
                        : 'bg-slate-700/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Radial glow overlay */}
            <div className="absolute inset-0 bg-radial-gradient opacity-30 group-hover:opacity-40 transition-opacity" />
          </>
        )}

        {/* Gradient floor overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        {/* Status badge — Top Right */}
        <div className={`absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2 py-1 rounded-full ${status.bg} backdrop-blur-sm border border-white/5 z-10`}>
          <div className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
          <span className={`text-[9px] font-bold uppercase tracking-wider ${status.text}`}>
            {status.label}
          </span>
        </div>

        {/* Location badge — Bottom Left (moved from center) */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 z-10">
          <MapPin size={10} className="text-slate-500 shrink-0" />
          <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
            {ctx.city !== 'Desconhecida' ? `${ctx.city}, ${ctx.state}` : 'Local não definido'}
          </span>
        </div>

        {/* Hover CTA — "Abrir Dimensionamento" (centered, above MapPin) */}
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
          <div className="bg-emerald-500/90 backdrop-blur-md px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-500/30 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <ArrowUpRight size={14} className="text-white" />
            <span className="text-xs font-bold text-white">Abrir Dimensionamento</span>
          </div>
        </div>
      </div>

      {/* ── PROJECT INFO ── */}
      <div className="p-3 pt-2.5">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors flex-1" title={ctx.clientName}>
            {ctx.clientName}
          </h3>

          {/* Edit Button */}
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-500 hover:text-white hover:bg-emerald-600 transition-all opacity-0 group-hover:opacity-100 shrink-0"
            title="Editar Contexto Rápido"
          >
            <Edit2 size={11} />
          </button>
        </div>

        {/* Technical Specs Grid */}
        <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-700/40">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-orange-500/10 flex items-center justify-center">
              <Zap size={10} className="text-orange-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-200">
              {project.targetPowerKwp > 0 ? `${project.targetPowerKwp} kWp` : '— kWp'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center">
              <Battery size={10} className="text-blue-400" />
            </div>
            <span className="text-[11px] text-slate-400">
              {ctx.averageConsumptionKwh > 0 ? `${ctx.averageConsumptionKwh.toLocaleString('pt-BR')} kWh` : '— kWh'}
            </span>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1 mt-2">
          <Clock size={9} className="text-slate-700" />
          <span className="text-[9px] text-slate-600">
            {new Date(project.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
};

