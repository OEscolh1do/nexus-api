/**
 * =============================================================================
 * MODAL DE CONTEXTO DO SÍTIO — Contexto 360º (Fase 2 do UX-001)
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

import React, { useState, useEffect, useMemo } from 'react';
import {
  X, MapPin, ArrowRight, Sun, Thermometer
} from 'lucide-react';
import { ProjectSiteMarker } from '../components/ProjectSiteMarker';
import 'leaflet/dist/leaflet.css';
import { MapCore } from '@/modules/engineering/components/MapCore';
import { KurupiraClient } from '@/services/NexusClient';
import { calcKWpAlvo } from '@/core/state/slices/journeySlice';
import { useUIStore } from '@/core/state/uiStore';
import { NeonorteLoader } from '@/components/ui/NeonorteLoader';
import { fetchWeatherAnalysis } from '@/services/weatherService';


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
  hspAvg: number;
  ambientTempAvg: number;
  irradiationSource: string;
}

interface SiteContextModalProps {
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDimensionar: (projectId: string) => void;
}

// =============================================================================
// MONTH LABELS
// =============================================================================

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// =============================================================================
// COMPONENT
// =============================================================================

export const SiteContextModal: React.FC<SiteContextModalProps> = ({
  projectId,
  isOpen,
  onClose,
  onDimensionar,
}) => {
  const setAppLoading = useUIStore(s => s.setAppLoading);
  const clearAppLoading = useUIStore(s => s.clearAppLoading);
  const isSiteLoading = useUIStore(
    s => s.isAppLoading && s.loadingContext === 'site-context'
  );
  const [context, setContext] = useState<SiteContext | null>(null);

  useEffect(() => {
    if (!isOpen || !projectId) {
      setContext(null);
      return;
    }

    let isMounted = true;
    const fetchContext = async () => {
      setAppLoading('site-context', 'Buscando contexto...');
      try {
        const data = await KurupiraClient.designs.get(projectId);
        
        if (isMounted) {
          // Robust parsing: if designData is a string (rare but safe), parse it.
          let dd = data.designData;
          if (typeof dd === 'string') {
            try { dd = JSON.parse(dd); } catch (e) { dd = {}; }
          }
          
          const clientData = dd?.solar?.clientData || dd?.clientData || data?.leadContext || {};
          const invoices = clientData.invoices || dd?.invoices || [];
          const mainInvoice = invoices[0] || {};
          const history = mainInvoice.monthlyHistory || dd?.monthlyHistory || Array(12).fill(0);

          let voltage = '—';
          if (mainInvoice.voltage || clientData.voltage) {
            const v = mainInvoice.voltage || clientData.voltage;
            voltage = String(v).includes('V') ? String(v) : `${v}V`;
          }

          const monthlyIrradiation = clientData.monthlyIrradiation || dd?.weatherData?.monthlyHsp || Array(12).fill(5.0);
          
          const rawHistory = Array.isArray(history) ? history.map(v => Number(v) || 0) : Array(12).fill(0);
          const estimatedPower = data.targetPowerKwp || dd?.solar?.project?.targetPowerKwp || calcKWpAlvo(rawHistory, monthlyIrradiation, 0) || 0;

          const lat = clientData.lat || data.lat || 0;
          const lng = clientData.lng || data.lng || 0;
          const city = clientData.city || data.city || '—';
          const state = clientData.state || data.state || '—';

          // Busca dados meteorológicos reais (CRESESB / NASA)
          let weatherInfo = { hsp_avg: 5.0, ambient_temp_avg: 27.5, irradiation_source: 'Dados Padrão' };
          if (lat !== 0 && lng !== 0) {
            try {
              const res = await fetchWeatherAnalysis(lat, lng, city, state);
              weatherInfo = {
                hsp_avg: res.hsp_avg ?? 5.0,
                ambient_temp_avg: res.ambient_temp_avg ?? 27.5,
                irradiation_source: res.irradiation_source || 'Série Histórica'
              };
            } catch (e) {
              console.warn('Weather fetch failed in context modal', e);
            }
          }

          setContext({
            projectId: data.id,
            clientName: clientData.clientName || data.clientName || data.name || 'Projeto sem título',
            city,
            state,
            street: clientData.street || data.leadContext?.city || 'Endereço não informado',
            lat,
            lng,
            voltage: voltage,
            connectionType: clientData.connectionType || mainInvoice.connectionType || '—',
            averageConsumptionKwh: clientData.averageConsumption || data.averageConsumptionKwh || (rawHistory.reduce((a: number, b: number) => a + b, 0) / 12) || 0,
            monthlyHistory: rawHistory,
            tariffRate: clientData.tariffRate || 0.92,
            targetPowerKwp: estimatedPower,
            technicalStatus: data.status || 'DRAFT',
            hspAvg: weatherInfo.hsp_avg,
            ambientTempAvg: weatherInfo.ambient_temp_avg,
            irradiationSource: weatherInfo.irradiation_source
          });
        }
      } catch (error) {
        console.error('Failed to load project context', error);
      } finally {
        if (isMounted) clearAppLoading();
      }
    };

    fetchContext();

    return () => {
      isMounted = false;
    };
  }, [projectId, isOpen]);

  const maxConsumption = useMemo(() =>
    Math.max(...(context?.monthlyHistory || [1]), 1),
    [context?.monthlyHistory]
  );


  const peakMonth = useMemo(() => {
    if (!context) return '—';
    const maxVal = Math.max(...context.monthlyHistory);
    const idx = context.monthlyHistory.indexOf(maxVal);
    return MONTHS[idx] || '—';
  }, [context?.monthlyHistory]);

  if (!isOpen) return null;

  if (isSiteLoading || !context) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
        <NeonorteLoader
          size="panel"
          message="Buscando contexto..."
          overlay={false}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container (Engineering Terminal Aesthetic) */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#0B0D13] rounded-sm border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col">
        
        {/* LCD Frame Details */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-700 pointer-events-none" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-700 pointer-events-none" />

        {/* ── HEADER (Telemetry Strip) ── */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <MapPin size={16} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="text-[12px] font-black text-slate-200 uppercase tracking-widest">{context.clientName}</h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{context.city}, {context.state} — {context.street}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-sm">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-none animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <span className="text-[9px] uppercase font-black tracking-widest text-slate-400">Contexto Sincronizado</span>
             </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-sm bg-slate-950 border border-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-slate-500 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── BENTO GRID CONTENT ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0B0D13]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[400px]">

            {/* LEFT: Mapa Interativo (Radar Theme) */}
            <div className="lg:col-span-7 bg-[#0B0D13] p-4 sm:p-6 border-r border-slate-800/80 flex flex-col relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black text-emerald-500/70 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-none bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  Visualização Espacial
                </h3>
                <span className="text-[9px] font-mono font-bold text-slate-600 tracking-widest">MAP_API_RDY</span>
              </div>
              
              {/* Map Container */}
              <div className="flex-1 min-h-[260px] border border-slate-800 bg-slate-950 relative overflow-hidden group/map z-0">
                {context.lat !== 0 ? (
                  <MapCore
                    activeTool="SELECT"
                    center={[context.lat, context.lng]}
                    zoom={18}
                    readOnly={true}
                    showLayers={false}
                    forceViewMode="CONTEXT"
                  >
                    <ProjectSiteMarker 
                      lat={context.lat} 
                      lng={context.lng} 
                      label={context.clientName}
                      city={context.city}
                      state={context.state}
                    />
                  </MapCore>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 bg-[radial-gradient(ellipse_at_center,rgba(2,6,23,1)_0%,rgba(2,6,23,0.5)_100%)]">
                     {/* Radar Grid Pattern */}
                     <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(16,185,129,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.3)_1px,transparent_1px)] bg-[size:20px_20px]" />
                    <MapPin size={32} className="mb-2 opacity-20" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-600">Sinal Geográfico Ausente</span>
                  </div>
                )}
                
                {/* Radar/HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none z-10 border border-emerald-500/10 shadow-[inner_0_0_40px_rgba(0,0,0,0.6)] mix-blend-overlay" />
                
                <div className="absolute bottom-3 left-3 z-20 bg-slate-950/90 backdrop-blur-md px-2.5 py-1.5 border border-slate-800">
                  <p className="text-[10px] text-emerald-400 font-mono tracking-wider tabular-nums font-bold leading-none">
                    {context.lat.toFixed(6)}°S, {Math.abs(context.lng).toFixed(6)}°W
                  </p>
                </div>
              </div>

              {/* Dados Estruturais */}
              <div className="grid grid-cols-2 gap-px bg-slate-800 border border-slate-800 mt-4 overflow-hidden">
                <InfoChip label="Tipo de Conexão" value={context.connectionType} />
                <InfoChip label="Tensão Operacional" value={context.voltage} />
              </div>
            </div>

            {/* RIGHT: Histórico de Consumo (SCADA Style) */}
            <div className="lg:col-span-5 bg-[#0B0D13] p-4 sm:p-6 flex flex-col">
              <h3 className="text-[10px] font-black text-sky-500/70 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-none bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                Telemetria de Carga
              </h3>

              {/* SCADA Bar Chart */}
              <div className="flex-1 min-h-[180px] border border-slate-800 bg-slate-950/50 p-4 flex flex-col justify-end relative overflow-hidden">
                {/* Horizontal Scanlines */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%)] z-20 bg-[length:100%_4px]" />
                
                {/* Vertical Grids */}
                <div className="absolute inset-0 z-0 flex flex-col justify-between p-4 opacity-[0.03]">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-px bg-sky-400 w-full" />)}
                </div>

                <div className="flex items-end gap-1 sm:gap-2 h-full relative z-10 w-full">
                  {context.monthlyHistory.map((val, i) => {
                    const height = (val / maxConsumption) * 100;
                    const isMax = val === Math.max(...context.monthlyHistory);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[7px] text-sky-500/50 font-mono tabular-nums leading-none opacity-0 group-hover:opacity-100 transition-opacity">
                          {val > 0 ? (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val).toString()) : '0'}
                        </span>
                        <div
                          className={`w-full max-w-[20px] transition-all duration-500 ${isMax
                            ? 'bg-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                            : 'bg-slate-800 hover:bg-sky-500/50'
                            }`}
                          style={{ height: `${Math.max(height, 4)}%`, minWidth: '4px' }}
                          title={`${MONTHS[i]}: ${val.toLocaleString('pt-BR')} kWh`}
                        />
                        <span className={`text-[8px] font-bold tracking-widest uppercase ${isMax ? 'text-sky-400' : 'text-slate-600'}`}>{MONTHS[i]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <StatChip label="Média Mensal" value={context.averageConsumptionKwh.toLocaleString('pt-BR')} unit="kWh" theme="sky" />
                <StatChip label="HSP Médio" value={context.hspAvg.toFixed(2)} unit="h/dia" theme="amber" icon={<Sun size={10} />} />
                <StatChip label="Temp. Média" value={context.ambientTempAvg.toFixed(1)} unit="°C" theme="sky" icon={<Thermometer size={10} />} />
                <StatChip label="Tarifa Base" value={`R$ ${context.tariffRate.toFixed(2)}`} unit="" theme="emerald" />
                <StatChip label="Potência Alvo" value={context.targetPowerKwp.toFixed(2)} unit="kWp" theme="emerald" />
                <StatChip label="Pico Anual" value={peakMonth} unit="" theme="amber" />
              </div>

              {/* Data Source Badge */}
              <div className="mt-3 flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500">Fonte de Dados:</span>
                <span className="text-[7px] font-bold uppercase tracking-widest text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded-none border border-slate-800">
                  {context.irradiationSource}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ── FOOTER / ACTION BAR ── */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono font-black text-slate-600 tracking-widest uppercase tabular-nums">
              ID: {context.projectId.slice(0, 8)}
            </span>
          </div>

          <button
            onClick={() => onDimensionar(context.projectId)}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[11px] font-black uppercase tracking-wider transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-400/20 group"
          >
            Abrir Engenharia
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const InfoChip: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
  <div className="bg-[#0B0D13] p-3 h-full flex flex-col justify-center">
    <p className={`text-[8px] font-black uppercase tracking-widest mb-1 text-slate-500`}>{label}</p>
    <p className="text-[11px] text-slate-300 font-bold truncate leading-none uppercase tracking-wider">{value}</p>
  </div>
);

const StatChip: React.FC<{ label: string; value: string; unit: string; theme: 'emerald' | 'sky' | 'amber'; icon?: React.ReactNode }> = ({ label, value, unit, theme, icon }) => {
  const colorClass = theme === 'sky' ? 'text-sky-400' : theme === 'amber' ? 'text-amber-400' : 'text-emerald-400';
  
  return (
    <div className="bg-slate-950 border border-slate-800 p-2 sm:p-3 flex flex-col relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${theme === 'sky' ? 'bg-sky-500/20' : theme === 'amber' ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`} />
      <div className="flex items-center justify-between mb-1 ml-1">
        <p className="text-[7.5px] sm:text-[8px] text-slate-500 font-black uppercase tracking-[0.15em] truncate">{label}</p>
        {icon && <div className="text-slate-600 opacity-50 scale-75 sm:scale-100">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1 ml-1">
        <span className={`text-[12px] sm:text-[14px] font-black font-mono tabular-nums leading-none ${colorClass}`}>
          {value}
        </span>
        {unit && <span className="text-[7px] sm:text-[8px] text-slate-600 font-bold uppercase">{unit}</span>}
      </div>
    </div>
  );
};
