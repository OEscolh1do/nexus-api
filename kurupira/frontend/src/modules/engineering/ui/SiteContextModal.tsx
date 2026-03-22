/**
 * =============================================================================
 * SITE CONTEXT MODAL — Contexto 360º (Fase 2 do UX-001)
 * =============================================================================
 *
 * Vista sobreposta (Overlay) que atua como ponte entre o Explorador
 * e o Workspace de Engenharia.
 *
 * Split View: Mapa interativo à esquerda + Gráfico de consumo à direita.
 * Ecrã de LEITURA TÉCNICA — blindado contra edições comerciais.
 *
 * Enquanto o engenheiro analisa os dados, o sistema pré-carrega
 * as bibliotecas pesadas em background (ilusão de rapidez).
 *
 * =============================================================================
 */

import React, { useMemo } from 'react';
import {
  X, MapPin, Zap, BarChart3, ArrowRight,
  Thermometer, Calendar, Building2, User
} from 'lucide-react';

// =============================================================================
// TIPOS
// =============================================================================

export interface SiteContext {
  projectId: string;
  clientName: string;
  city: string;
  state: string;
  street: string;
  lat: number;
  lng: number;
  voltage: string;
  connectionType: string;
  averageConsumptionKwh: number;
  monthlyHistory: number[];
  tariffRate: number;
  targetPowerKwp: number;
  technicalStatus: string;
}

interface SiteContextModalProps {
  context: SiteContext;
  isOpen: boolean;
  onClose: () => void;
  onDimensionar: (projectId: string) => void;
}

// =============================================================================
// MOCK CONTEXT (até integração com BFF: GET /api/kurupira/projects/:id/context)
// =============================================================================

export const MOCK_SITE_CONTEXTS: Record<string, SiteContext> = {
  'prj-001': {
    projectId: 'prj-001',
    clientName: 'Supermercado Central',
    city: 'Manaus',
    state: 'AM',
    street: 'Av. Eduardo Ribeiro, 420',
    lat: -3.1316,
    lng: -60.0233,
    voltage: '380V',
    connectionType: 'Trifásico',
    averageConsumptionKwh: 12000,
    monthlyHistory: [11200, 11800, 12500, 13000, 12800, 11500, 10800, 11000, 12200, 13500, 14000, 12000],
    tariffRate: 0.92,
    targetPowerKwp: 75.6,
    technicalStatus: 'IN_PROGRESS',
  },
  'prj-002': {
    projectId: 'prj-002',
    clientName: 'Residência Silva',
    city: 'Manaus',
    state: 'AM',
    street: 'Rua das Flores, 88',
    lat: -3.1190,
    lng: -60.0217,
    voltage: '220V',
    connectionType: 'Bifásico',
    averageConsumptionKwh: 450,
    monthlyHistory: [400, 420, 480, 500, 490, 410, 380, 390, 450, 520, 540, 480],
    tariffRate: 0.92,
    targetPowerKwp: 8.4,
    technicalStatus: 'DRAFT',
  },
  'prj-003': {
    projectId: 'prj-003',
    clientName: 'Galpão Industrial Norte',
    city: 'Manaus',
    state: 'AM',
    street: 'Distrito Industrial, Lote 45',
    lat: -3.0800,
    lng: -59.9700,
    voltage: '380V',
    connectionType: 'Trifásico',
    averageConsumptionKwh: 28000,
    monthlyHistory: [26000, 27000, 29000, 30000, 31000, 28000, 25000, 26500, 28500, 30500, 31500, 29000],
    tariffRate: 0.85,
    targetPowerKwp: 150.0,
    technicalStatus: 'REVIEW',
  },
};

// Fallback para projetos sem contexto detalhado
const DEFAULT_CONTEXT: SiteContext = {
  projectId: '',
  clientName: 'Projeto sem contexto',
  city: '—',
  state: '—',
  street: '—',
  lat: 0,
  lng: 0,
  voltage: '—',
  connectionType: '—',
  averageConsumptionKwh: 0,
  monthlyHistory: Array(12).fill(0),
  tariffRate: 0,
  targetPowerKwp: 0,
  technicalStatus: 'DRAFT',
};

export const getSiteContext = (projectId: string): SiteContext =>
  MOCK_SITE_CONTEXTS[projectId] || { ...DEFAULT_CONTEXT, projectId };

// =============================================================================
// MONTH LABELS
// =============================================================================

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// =============================================================================
// COMPONENT
// =============================================================================

export const SiteContextModal: React.FC<SiteContextModalProps> = ({
  context,
  isOpen,
  onClose,
  onDimensionar,
}) => {
  const maxConsumption = useMemo(() =>
    Math.max(...context.monthlyHistory, 1),
    [context.monthlyHistory]
  );

  const avgConsumption = useMemo(() =>
    Math.round(context.monthlyHistory.reduce((a, b) => a + b, 0) / 12),
    [context.monthlyHistory]
  );

  const peakMonth = useMemo(() => {
    const maxVal = Math.max(...context.monthlyHistory);
    const idx = context.monthlyHistory.indexOf(maxVal);
    return MONTHS[idx] || '—';
  }, [context.monthlyHistory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl max-h-[85vh] bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col">

        {/* ── HEADER ── */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <MapPin size={16} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{context.clientName}</h2>
              <p className="text-[10px] text-slate-500">{context.street} — {context.city}, {context.state}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── SPLIT VIEW CONTENT ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[400px]">

            {/* LEFT: Mapa / Geolocalização */}
            <div className="bg-slate-950 p-5 border-r border-slate-800/50 flex flex-col">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin size={10} />
                Localização do Sítio
              </h3>

              {/* Map Placeholder (será substituído por Leaflet instance) */}
              <div className="flex-1 min-h-[220px] rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                  <div className="grid grid-cols-8 grid-rows-6 h-full w-full gap-px">
                    {Array(48).fill(0).map((_, i) => (
                      <div key={i} className="bg-emerald-400" />
                    ))}
                  </div>
                </div>
                <div className="text-center relative z-10">
                  <MapPin size={24} className="text-emerald-500/40 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-600 font-mono">
                    {context.lat.toFixed(4)}°S, {Math.abs(context.lng).toFixed(4)}°W
                  </p>
                </div>
              </div>

              {/* Dados do Sítio */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <InfoChip icon={<Building2 size={10} />} label="Endereço" value={context.street} />
                <InfoChip icon={<User size={10} />} label="Cliente" value={context.clientName} />
                <InfoChip icon={<Zap size={10} />} label="Tensão" value={context.voltage} />
                <InfoChip icon={<Thermometer size={10} />} label="Ligação" value={context.connectionType} />
              </div>
            </div>

            {/* RIGHT: Histórico de Consumo */}
            <div className="bg-slate-950 p-5 flex flex-col">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BarChart3 size={10} />
                Perfil de Carga (12 Meses)
              </h3>

              {/* Bar Chart */}
              <div className="flex-1 min-h-[220px] rounded-xl bg-slate-800/30 border border-slate-800 p-4 flex flex-col justify-end">
                <div className="flex items-end gap-1.5 h-full">
                  {context.monthlyHistory.map((val, i) => {
                    const height = (val / maxConsumption) * 100;
                    const isMax = val === Math.max(...context.monthlyHistory);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[8px] text-slate-600 font-mono">
                          {(val / 1000).toFixed(1)}k
                        </span>
                        <div
                          className={`w-full rounded-t-sm transition-all duration-500 ${isMax
                            ? 'bg-gradient-to-t from-orange-500 to-amber-400'
                            : 'bg-gradient-to-t from-emerald-600/60 to-emerald-400/60 hover:from-emerald-500 hover:to-emerald-300'
                            }`}
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${MONTHS[i]}: ${val.toLocaleString('pt-BR')} kWh`}
                        />
                        <span className="text-[8px] text-slate-600 font-medium">{MONTHS[i]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <StatChip label="Consumo Médio" value={`${avgConsumption.toLocaleString('pt-BR')}`} unit="kWh/mês" accent />
                <StatChip label="Mês Pico" value={peakMonth} unit="" />
                <StatChip label="Tarifa" value={`R$ ${context.tariffRate.toFixed(2)}`} unit="/kWh" />
              </div>
            </div>

          </div>
        </div>

        {/* ── FOOTER / ACTION BAR ── */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar size={11} className="text-slate-600" />
              <span className="text-[10px] text-slate-500">Potência Alvo:</span>
              <span className="text-xs font-bold text-white">{context.targetPowerKwp} kWp</span>
            </div>
          </div>

          <button
            onClick={() => onDimensionar(context.projectId)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
            Dimensionar Projeto
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const InfoChip: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-slate-900 rounded-lg p-2 border border-slate-800">
    <div className="flex items-center gap-1 mb-0.5">
      <span className="text-slate-600">{icon}</span>
      <span className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">{label}</span>
    </div>
    <p className="text-[11px] text-slate-300 font-medium truncate">{value}</p>
  </div>
);

const StatChip: React.FC<{ label: string; value: string; unit: string; accent?: boolean }> = ({ label, value, unit, accent }) => (
  <div className={`rounded-lg p-2.5 border ${accent ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900 border-slate-800'}`}>
    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">{label}</p>
    <p className={`text-sm font-bold ${accent ? 'text-emerald-400' : 'text-white'}`}>
      {value}
      {unit && <span className="text-[10px] text-slate-500 font-normal ml-0.5">{unit}</span>}
    </p>
  </div>
);
