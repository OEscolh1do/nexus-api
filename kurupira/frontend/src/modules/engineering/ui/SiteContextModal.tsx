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
  X, MapPin, ArrowRight, Loader2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { KurupiraClient } from '@/services/NexusClient';
import { calcKWpAlvo } from '@/core/state/slices/journeySlice';

// Fix default marker icon (Leaflet + bundler issue)
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

const tileUrl = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

/** Syncs map center when lat/lng change */
const MapViewUpdater: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat !== 0 && lng !== 0) {
      map.flyTo([lat, lng], 18, { duration: 1.5 });
    }
  }, [lat, lng, map]);
  return null;
};

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
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<SiteContext | null>(null);

  useEffect(() => {
    if (!isOpen || !projectId) {
      setContext(null);
      return;
    }

    let isMounted = true;
    const fetchContext = async () => {
      setLoading(true);
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

          setContext({
            projectId: data.id,
            clientName: clientData.clientName || data.clientName || data.name || 'Projeto sem título',
            city: clientData.city || data.city || '—',
            state: clientData.state || data.state || '—',
            street: clientData.street || data.leadContext?.city || 'Endereço não informado',
            lat: clientData.lat || data.lat || 0,
            lng: clientData.lng || data.lng || 0,
            voltage: voltage,
            connectionType: clientData.connectionType || mainInvoice.connectionType || '—',
            averageConsumptionKwh: clientData.averageConsumption || data.averageConsumptionKwh || (rawHistory.reduce((a: number, b: number) => a + b, 0) / 12) || 0,
            monthlyHistory: rawHistory,
            tariffRate: clientData.tariffRate || 0.92,
            targetPowerKwp: estimatedPower,
            technicalStatus: data.status || 'DRAFT',
          });
        }
      } catch (error) {
        console.error('Failed to load project context', error);
      } finally {
        if (isMounted) setLoading(false);
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

  const avgConsumption = useMemo(() =>
    Math.round((context?.monthlyHistory || []).reduce((a, b) => a + b, 0) / 12) || 0,
    [context?.monthlyHistory]
  );

  const peakMonth = useMemo(() => {
    if (!context) return '—';
    const maxVal = Math.max(...context.monthlyHistory);
    const idx = context.monthlyHistory.indexOf(maxVal);
    return MONTHS[idx] || '—';
  }, [context?.monthlyHistory]);

  if (!isOpen) return null;

  if (loading || !context) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 size={32} className="animate-spin text-emerald-500/50" />
          <span className="text-xs font-semibold">Buscando contexto...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl max-h-[85vh] bg-slate-900 rounded-md border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col">

        {/* ── HEADER ── */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
              <MapPin size={16} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">{context.clientName}</h2>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{context.city}, {context.state} — {context.street}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── SPLIT VIEW CONTENT ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[400px]">

            {/* LEFT: Mapa / Geolocalização (Indigo Theme) */}
            <div className="bg-slate-950 p-5 border-r border-slate-800/80 flex flex-col">
              <h3 className="text-[10px] font-black text-indigo-500/70 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                Localização do Sítio
              </h3>
              
              {/* Map Container (Leaflet Restored) */}
              <div className="flex-1 min-h-[220px] rounded border border-slate-800 bg-slate-900/50 relative overflow-hidden group/map z-0">
                {context.lat !== 0 ? (
                  <MapContainer
                    center={[context.lat, context.lng]}
                    zoom={18}
                    className="w-full h-full"
                    zoomControl={false}
                    attributionControl={false}
                  >
                    <TileLayer url={tileUrl} />
                    <Marker position={[context.lat, context.lng]} />
                    <MapViewUpdater lat={context.lat} lng={context.lng} />
                  </MapContainer>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 bg-slate-900/50">
                    <MapPin size={32} className="mb-2 opacity-20" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Coordenadas Ausentes</span>
                  </div>
                )}
                
                {/* Radar/HUD Overlay (Design Only) */}
                <div className="absolute inset-0 pointer-events-none z-10 border border-indigo-500/10 shadow-[inner_0_0_40px_rgba(0,0,0,0.5)]" />
                
                <div className="absolute bottom-3 left-3 z-20 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded border border-slate-800 shadow-xl">
                  <p className="text-[10px] text-indigo-400 font-mono tracking-wider tabular-nums font-bold leading-none">
                    {context.lat.toFixed(6)}°S, {Math.abs(context.lng).toFixed(6)}°W
                  </p>
                </div>
              </div>

              {/* Dados do Sítio */}
              <div className="grid grid-cols-2 gap-px bg-slate-800 border border-slate-800 rounded mt-4 overflow-hidden shadow-lg">
                <InfoChip label="Tipo Ligação" value={context.connectionType} theme="indigo" />
                <InfoChip label="Tensão Operação" value={context.voltage} theme="indigo" />
              </div>
            </div>

            {/* RIGHT: Histórico de Consumo (Sky Theme) */}
            <div className="bg-slate-950 p-5 flex flex-col">
              <h3 className="text-[10px] font-black text-sky-500/70 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                Perfil de Carga (12 Meses)
              </h3>

              {/* Bar Chart */}
              <div className="flex-1 min-h-[220px] rounded border border-slate-800 bg-slate-900/30 p-4 flex flex-col justify-end relative overflow-hidden">
                {/* Vertical Grids */}
                <div className="absolute inset-0 z-0 flex flex-col justify-between p-4 opacity-5">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-px bg-sky-400 w-full" />)}
                </div>

                <div className="flex items-end gap-1.5 h-full relative z-10">
                  {context.monthlyHistory.map((val, i) => {
                    const height = (val / maxConsumption) * 100;
                    const isMax = val === Math.max(...context.monthlyHistory);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[7px] text-sky-500/70 font-mono tabular-nums leading-none">
                          {val > 0 ? `${(val / 1000).toFixed(1)}k` : '0'}
                        </span>
                        <div
                          className={`w-full transition-all duration-500 ${isMax
                            ? 'bg-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.4)]'
                            : 'bg-sky-500/50 hover:bg-sky-400/80'
                            }`}
                          style={{ height: `${Math.max(height, 4)}%`, minWidth: '4px' }}
                          title={`${MONTHS[i]}: ${val.toLocaleString('pt-BR')} kWh`}
                        />
                        <span className={`text-[8px] font-bold tracking-tighter ${isMax ? 'text-sky-400' : 'text-slate-600'}`}>{MONTHS[i]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <StatChip label="Média Mensal" value={avgConsumption.toLocaleString('pt-BR')} unit="kWh" theme="sky" />
                <StatChip label="Pico Anual" value={peakMonth} unit="" theme="sky" />
                <StatChip label="Tarifa Base" value={`R$ ${context.tariffRate.toFixed(2)}`} unit="" theme="sky" />
              </div>
            </div>

          </div>
        </div>

        {/* ── FOOTER / ACTION BAR ── */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-900">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Pronto para Engenharia</span>
            </div>
            <div className="mt-1 flex items-center gap-3">
               <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-600 uppercase">Potência Estimada:</span>
                <span className="text-xs font-mono font-bold text-amber-500 tabular-nums">{context.targetPowerKwp.toFixed(2)} kWp</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onDimensionar(context.projectId)}
            className="flex items-center gap-2 px-6 py-2.5 rounded bg-white text-slate-950 text-xs font-black uppercase tracking-tight hover:bg-emerald-400 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] group"
          >
            Abrir Área de Engenharia
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

const InfoChip: React.FC<{ label: string; value: string; theme: 'indigo' | 'sky' }> = ({ label, value, theme }) => (
  <div className="bg-slate-900 p-3 h-full flex flex-col justify-center">
    <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${theme === 'indigo' ? 'text-indigo-500/70' : 'text-sky-500/70'}`}>{label}</p>
    <p className="text-[11px] text-slate-200 font-bold truncate leading-none uppercase">{value}</p>
  </div>
);

const StatChip: React.FC<{ label: string; value: string; unit: string; theme: 'indigo' | 'sky' }> = ({ label, value, unit, theme }) => (
  <div className="bg-slate-900/50 border border-slate-800 p-3 flex flex-col">
    <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.15em] mb-1.5">{label}</p>
    <div className="flex items-baseline gap-1">
      <span className={`text-sm font-black font-mono tabular-nums leading-none ${theme === 'sky' ? 'text-sky-400' : 'text-indigo-400'}`}>
        {value}
      </span>
      {unit && <span className="text-[8px] text-slate-700 font-bold uppercase">{unit}</span>}
    </div>
  </div>
);
