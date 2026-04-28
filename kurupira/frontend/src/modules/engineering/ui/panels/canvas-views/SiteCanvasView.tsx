import { 
  FileText, MapPin, Zap, Loader2, Thermometer,
  Navigation, Home, RefreshCw, Snowflake, Flame, Search
} from 'lucide-react';
import { useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSolarStore } from '@/core/state/solarStore';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { MapCore } from '../../../components/MapCore';
import { fetchWeatherAnalysis } from '@/services/weatherService';
import { cn } from '@/lib/utils';
import { useGoogleGeocoding } from '../../../hooks/useGoogleGeocoding';
import { ProjectSiteMarker } from '../../../components/ProjectSiteMarker';
import { Autocomplete } from '@/components/ui/Autocomplete';
import { BRAZILIAN_UTILITIES, STATE_TO_DEFAULT_UTILITY } from '@/core/data/utilities';
import { MapFlyToSync } from '../../../components/MapFlyToSync';

const GeocodeFlyTo: React.FC<{ lat: number, lng: number, isPanning: boolean }> = ({ lat, lng, isPanning }) => {
  const map = useMap();
  useEffect(() => {
    if (isPanning || !lat || !lng || isNaN(lat) || isNaN(lng)) return;
    
    const currentCenter = map.getCenter();
    const target = L.latLng(lat, lng);
    
    // Se a distância for maior que 5 metros (evita micro-tremores de float)
    // E não estamos ativamente movendo o mapa na mão, então voa.
    if (currentCenter.distanceTo(target) > 5) {
      map.flyTo(target, 18, { duration: 1.2 });
    }
  }, [lat, lng, isPanning, map]);
  return null;
};

const MapInteractionHandler: React.FC<{ 
  onLocationSelect: (lat: number, lng: number) => void;
  onPanStart: () => void;
  onPanEnd: (lat: number, lng: number) => void;
}> = ({ onLocationSelect, onPanStart, onPanEnd }) => {
  useMapEvents({ 
    click: (e) => onLocationSelect(e.latlng.lat, e.latlng.lng),
    movestart: () => onPanStart(),
    moveend: (e) => onPanEnd(e.target.getCenter().lat, e.target.getCenter().lng)
  });
  return null;
};

// ── Field primitives (Engineering UI High-Density) ─────────────────────────
const fieldBase = 'w-full bg-slate-900/40 border border-slate-800/80 rounded-sm px-2 py-1 text-[11px] outline-none transition-all placeholder:text-slate-700 hover:border-slate-700/60';
const fieldDefault = `${fieldBase} text-slate-200 focus:border-purple-500/50 focus:bg-slate-900 focus:ring-1 focus:ring-purple-500/10`;
const fieldAccent = `${fieldBase} text-slate-100 font-mono font-medium focus:border-amber-500/50 focus:bg-slate-900 focus:ring-1 focus:ring-amber-500/10`;

const FieldCell: React.FC<{ label: string; children: React.ReactNode; accent?: boolean; className?: string }> = ({
  label, children, accent = false, className
}) => (
  <div className={cn('flex flex-col gap-0.5', className)}>
    <label className={cn(
      'text-[9px] font-bold uppercase tracking-[0.15em] font-sans transition-colors',
      accent ? 'text-amber-500/90' : 'text-slate-400/90'
    )}>
      {label}
    </label>
    {children}
  </div>
);

const SectionHeader: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  color?: string; 
  completed?: boolean;
  secondary?: React.ReactNode;
}> = ({ 
  icon, label, color = 'text-slate-400', completed = false, secondary 
}) => (
  <div className={cn('flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-0.5 group/sec gap-1.5')}>
    <div className={cn('flex items-center gap-1.5 text-[8px] lg:text-[9px] font-bold uppercase tracking-[0.15em] font-sans transition-colors shrink-0', color)}>
      {icon && (
        <div className="p-1.5 bg-slate-950 rounded-sm border border-slate-800 shadow-inner group-hover/sec:border-slate-700 transition-colors">
      {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { size: 10 })}
        </div>
      )}
      {label}
    </div>
    
    <div className="flex items-center gap-2 overflow-hidden">
      {secondary}
      {completed && (
        <div className="flex items-center gap-1.5 text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-in fade-in zoom-in duration-300 shrink-0">
          <div className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]" />
          <span className="hidden sm:inline">Preenchido</span>
        </div>
      )}
    </div>
  </div>
);

const PanelHeader: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  secondary?: React.ReactNode;
}> = ({ icon, label, secondary }) => (
  <div className="shrink-0 h-10 px-4 border-b border-l-[3px] border-l-purple-600 border-b-slate-800/80 bg-slate-950/80 backdrop-blur-2xl flex items-center justify-between gap-3 shadow-xl z-20 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5" />
    <div className="flex items-center gap-3 relative z-10">
      <div className="text-purple-400/80">{icon}</div>
      <span className="text-[10px] lg:text-[11px] text-slate-200 font-black uppercase tracking-[0.25em] font-sans drop-shadow-sm">{label}</span>
    </div>
    <div className="relative z-10">{secondary}</div>
  </div>
);

const ROOF_TYPES = [
  { value: 'ceramica',     label: 'Cerâmico' },
  { value: 'metalico',     label: 'Metálico' },
  { value: 'fibrocimento', label: 'Fibrocimento' },
  { value: 'laje',         label: 'Laje' },
  { value: 'outro',        label: 'Outro / Solo' },
] as const;

const AZIMUTH_OPTIONS = [
  { value: 0, label: 'Norte (0°)' },
  { value: 45, label: 'Nordeste (45°)' },
  { value: 90, label: 'Leste (90°)' },
  { value: 135, label: 'Sudeste (135°)' },
  { value: 180, label: 'Sul (180°)' },
  { value: 225, label: 'Sudoeste (225°)' },
  { value: 270, label: 'Oeste (270°)' },
  { value: 315, label: 'Noroeste (315°)' }
] as const;

// ─────────────────────────────────────────────────────────────────────────────────
// MELHORIA — HEATMAP PANEL (Otimizado para Rodapé 2-Colunas)
// ─────────────────────────────────────────────────────────────────────────────────

const HeatmapPanel: React.FC<{ hspMonthly: number[]; irradiationSource?: string }> = ({ hspMonthly, irradiationSource }) => {
  const maxVal = Math.max(...hspMonthly, 0.1);
  const rankMap = useMemo(() => {
    const sorted = [...hspMonthly].sort((a, b) => b - a);
    return hspMonthly.map(v => sorted.indexOf(v) + 1);
  }, [hspMonthly]);

  return (
    <div className="flex-1 flex flex-col p-2 pb-4 @3xl:p-3 @3xl:pb-6 gap-1.5 @3xl:gap-2 bg-yellow-900/5 transition-colors hover:bg-yellow-900/10 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Base de Irradiância</span>
          {irradiationSource && (
            <span className="text-[7px] text-yellow-500/40 font-black uppercase tracking-widest ml-2">[{irradiationSource}]</span>
          )}
        </div>
        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest px-2 py-0.5 border border-slate-800/60 rounded-sm bg-slate-950/60 backdrop-blur-md">Série Histórica Contínua</span>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-[1px] @3xl:gap-0.5 w-full min-h-0">
        {hspMonthly.map((hsp, idx) => {
          const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
          const intensity = Math.max(0, Math.min(1, (hsp - 3.5) / (6.5 - 3.5)));
          const isPeak = hsp === Math.max(...hspMonthly) && hsp > 0;
          const heightPercent = hsp > 0 ? (hsp / maxVal) * 100 : 0;
          
          const barColor = isPeak 
            ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] border-t-2 border-yellow-300'
            : intensity < 0.25 ? 'bg-slate-800/60 border-t border-slate-700' 
            : intensity < 0.55 ? 'bg-yellow-900/40 border-t border-yellow-700/50'
            : 'bg-yellow-600/60 border-t border-yellow-500/50';

          return (
            <div 
              key={months[idx]} 
              className="group/month relative flex flex-col h-full bg-slate-950/40 border border-slate-800/30 rounded-sm cursor-help transition-colors hover:border-yellow-500/50 hover:bg-slate-900/60"
            >
              {/* Valor (Topo) */}
              <div className="h-4 @3xl:h-5 flex items-center justify-center shrink-0 z-10 border-b border-slate-800/50 bg-slate-950/40">
                <span className={cn(
                  "text-[7px] @3xl:text-[8.5px] font-mono font-bold tabular-nums leading-none",
                  isPeak ? "text-yellow-400 drop-shadow-[0_0_2px_rgba(234,179,8,0.5)]" : hsp > 0 ? "text-slate-300" : "text-slate-600"
                )}>
                  {hsp > 0 ? hsp.toFixed(1) : '—'}
                </span>
              </div>

              {/* Área do Gráfico */}
              <div className="flex-1 relative w-full flex items-end bg-slate-950/20">
                <div 
                  className={cn("w-full transition-all duration-1000 ease-out", barColor)} 
                  style={{ height: `${heightPercent}%` }} 
                />
              </div>

              {/* Mês (Base) */}
              <div className="h-3 @3xl:h-4 flex items-center justify-center shrink-0 z-10 border-t border-slate-800/50 bg-slate-950/80">
                <span className={cn(
                  "text-[5px] @3xl:text-[5.5px] uppercase tracking-widest font-sans font-black",
                  isPeak ? "text-yellow-500" : "text-slate-500"
                )}>
                  {months[idx]}
                </span>
              </div>
              
              {/* Tooltip de Ranking */}
              <div className="absolute opacity-0 group-hover/month:opacity-100 top-[-22px] left-1/2 -translate-x-1/2 pointer-events-none z-50 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded shadow-xl text-[7px] font-black text-amber-500 uppercase whitespace-nowrap transition-opacity">
                #{rankMap[idx]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export const SiteCanvasView: React.FC = () => {
  const clientData    = useSolarStore(s => s.clientData);
  const updateClientData = useSolarStore(s => s.updateClientData);
  const weatherData      = useSolarStore(s => s.weatherData);
  const setWeatherData   = useSolarStore(s => s.setWeatherData);
  const setIrradiationData = useSolarStore(s => s.setIrradiationData);

  // ── Geocoding & Reverse Geocoding (Hookified) ──────────────────────────
  const { isGeocoding, geocodeStatus, geocodeAddress, reverseGeocode, detectedAddress, setDetectedAddress } = useGoogleGeocoding();
  const [mobileView, setMobileView] = useState<'form' | 'map'>('form');
  const [isMapPanning, setIsMapPanning] = useState(false);


  // ── Climate Sync ───────────────────────────────────────────────────────
  const syncClimateData = useCallback(async () => {
    if (!clientData.lat || !clientData.lng || !clientData.city || isNaN(clientData.lat) || isNaN(clientData.lng)) return;
    try {
      const data = await fetchWeatherAnalysis(clientData.lat, clientData.lng, clientData.city, clientData.state);
      setWeatherData(data);
      setIrradiationData(data.hsp_monthly, data.irradiation_source);
    } catch (err) { console.error('Erro na sincronização climática:', err); }
  }, [clientData.lat, clientData.lng, clientData.city, clientData.state, setWeatherData, setIrradiationData]);

  useEffect(() => {
    const t = setTimeout(syncClimateData, 800);
    return () => clearTimeout(t);
  }, [clientData.lat, clientData.lng, clientData.city, clientData.state, syncClimateData]);

  useEffect(() => {
    if (clientData.lat && clientData.lng && !isNaN(clientData.lat) && !isNaN(clientData.lng)) {
      setDetectedAddress(null);
      const t = setTimeout(() => {
        reverseGeocode(clientData.lat!, clientData.lng!, true);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [clientData.lat, clientData.lng, reverseGeocode, setDetectedAddress]);

  // ── ViaCEP ─────────────────────────────────────────────────────────────
  // ── ViaCEP & Auto-Fill ─────────────────────────────────────────────────
  const handleZipCodeChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    updateClientData({ zipCode: cleanCep });
    if (cleanCep.length === 8) {
      try {
        const resp = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await resp.json();
        if (!data.erro) {
          const newState = (data.uf || clientData.state).toUpperCase();
          const defaultUtility = STATE_TO_DEFAULT_UTILITY[newState];
          
          updateClientData({ 
            street: data.logradouro || clientData.street, 
            city: data.localidade || clientData.city, 
            state: newState,
            concessionaire: defaultUtility || clientData.concessionaire
          });
        }
      } catch (e) { console.error('ViaCEP Error:', e); }
    }
  };

  const handleStateChange = (val: string) => {
    const newState = val.toUpperCase();
    const defaultUtility = STATE_TO_DEFAULT_UTILITY[newState];
    
    updateClientData({ 
      state: newState,
      concessionaire: defaultUtility || clientData.concessionaire
    });
  };

  const handleMapClick = useCallback((newLat: number, newLng: number) => {
    updateClientData({ lat: parseFloat(newLat.toFixed(6)), lng: parseFloat(newLng.toFixed(6)) });
  }, [updateClientData]);

  const handlePanStart = useCallback(() => {
    setIsMapPanning(true);
  }, []);

  const handlePanEnd = useCallback((newLat: number, newLng: number) => {
    setIsMapPanning(false);
    updateClientData({ lat: parseFloat(newLat.toFixed(6)), lng: parseFloat(newLng.toFixed(6)) });
  }, [updateClientData]);

  const activeLat = Number(clientData.lat) || -3.1316;
  const activeLng = Number(clientData.lng) || -60.0233;
  const hspMonthly = clientData.monthlyIrradiation ?? Array(12).fill(0);
  const geocodeStatusLabel = { searching: 'Buscando...', success: 'OK', partial: 'Aprox.', error: 'Erro', idle: '' }[geocodeStatus as string] || '';


  return (
    <div className="w-full h-full bg-slate-950 font-sans flex flex-col lg:flex-row overflow-hidden relative">

      {/* ── MOBILE TOGGLE TABS ── */}
      <div className="lg:hidden shrink-0 flex p-1.5 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md z-[2000]">
        <button 
          onClick={() => setMobileView('form')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 h-9 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all",
            mobileView === 'form' ? "bg-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <FileText size={12} />
          Dossiê
        </button>
        <button 
          onClick={() => setMobileView('map')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 h-9 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all",
            mobileView === 'map' ? "bg-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Navigation size={12} />
          Mapa
        </button>
      </div>

      {/* ── PAINEL ESQUERDO — Dossiê (280px) ── */}
      <div className={cn(
        "w-full lg:w-[280px] 2xl:w-[300px] shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden transition-all duration-500",
        mobileView === 'map' ? "hidden lg:flex" : "flex-1 lg:flex-none lg:h-full"
      )}>
        <PanelHeader icon={<FileText size={13} />} label="Dossiê Técnico do Projeto" />

        <div className="flex-1 p-2 lg:p-2.5 pb-4 lg:pb-8 flex flex-col gap-3 lg:gap-3.5 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-2">
            <SectionHeader 
              icon={null} 
              label="Identificação" 
              completed={!!clientData.clientName}
            />
            <div className="grid grid-cols-12 gap-2">
              <FieldCell label="Cliente *" className="col-span-12 lg:col-span-7">
                <input type="text" value={clientData.clientName || ''} onChange={e => updateClientData({ clientName: e.target.value })} className={fieldDefault} placeholder="Nome do titular" />
              </FieldCell>
              <FieldCell label="Projeto" className="col-span-12 lg:col-span-5">
                <input type="text" value={clientData.projectName || ''} onChange={e => updateClientData({ projectName: e.target.value })} className={fieldDefault} placeholder="Ex: Fase 1" />
              </FieldCell>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <SectionHeader 
                icon={<MapPin size={10} />} 
                label="Endereço" 
                completed={!!(clientData.zipCode && clientData.city)}
              />
            </div>
            <div className="grid grid-cols-12 gap-2">
              <FieldCell label="CEP *" className="col-span-7" accent>
                <input type="text" value={clientData.zipCode || ''} onChange={e => handleZipCodeChange(e.target.value)} className={fieldAccent} placeholder="00000-000" maxLength={9} />
              </FieldCell>
              <FieldCell label="UF" className="col-span-5">
                <input 
                  type="text" 
                  value={clientData.state || ''} 
                  onChange={e => handleStateChange(e.target.value)} 
                  maxLength={2} 
                  className={`${fieldBase} text-slate-100 font-bold text-center focus:border-slate-600 px-1`} 
                />
              </FieldCell>
              <FieldCell label="Cidade *" className="col-span-12">
                <input type="text" value={clientData.city || ''} onChange={e => updateClientData({ city: e.target.value })} className={fieldDefault} />
              </FieldCell>
              <FieldCell label="Logradouro" className="col-span-9">
                <input type="text" value={clientData.street || ''} onChange={e => updateClientData({ street: e.target.value })} className={fieldDefault} />
              </FieldCell>
              <FieldCell label="Nº" className="col-span-3">
                <input type="text" value={clientData.number || ''} onChange={e => updateClientData({ number: e.target.value })} className={`${fieldBase} text-slate-100 text-center focus:border-slate-700 px-1`} />
              </FieldCell>
            </div>
            
            {/* CTA: Buscar Endereço (Full Width Action) */}
            <button
              onClick={() => geocodeAddress()}
              disabled={isGeocoding || (!clientData.street && (!clientData.zipCode || clientData.zipCode.length < 8))}
              className="mt-1 flex items-center justify-center gap-2 w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm transition-all disabled:opacity-30 disabled:grayscale text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/20 active:scale-[0.98]"
            >
              {isGeocoding ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              <span>Buscar Endereço no Mapa</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <SectionHeader 
              icon={<Zap size={10} />} 
              label="Rede Elétrica" 
              color="text-amber-500/80" 
              completed={!!(clientData.concessionaire && clientData.tariffRate && clientData.tariffRate > 0)}
            />
            <div className="grid grid-cols-12 gap-2">
              <FieldCell label="Concessionária" className="col-span-12">
                <Autocomplete 
                  value={clientData.concessionaire || ''} 
                  onChange={val => updateClientData({ concessionaire: val })} 
                  options={BRAZILIAN_UTILITIES.map(u => u.name)}
                  placeholder="Ex: CEMIG..."
                />
              </FieldCell>
              <FieldCell label="Tarifa (R$/kWh)" className="col-span-12" accent>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-amber-500/40 font-mono font-bold text-[9px]">R$</span>
                  <input type="number" step="0.01" value={clientData.tariffRate || 0} onChange={e => updateClientData({ tariffRate: Number(e.target.value) })} className={`${fieldAccent} pl-7 text-right`} />
                </div>
              </FieldCell>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <SectionHeader 
              icon={<Home size={10} />} 
              label="Premissas" 
              completed={!!clientData.roofType}
            />
            <div className="grid grid-cols-12 gap-2">
              <FieldCell label="Telhado" className="col-span-12">
                <select value={clientData.roofType || ''} onChange={e => updateClientData({ roofType: (e.target.value || undefined) as any })} className={`${fieldAccent} bg-slate-900`}>
                  <option value="" className="bg-slate-900 text-slate-500">— Selecionar —</option>
                  {ROOF_TYPES.map(r => <option key={r.value} value={r.value} className="bg-slate-900 text-slate-100">{r.label}</option>)}
                </select>
              </FieldCell>
              <FieldCell label="Azimute" className="col-span-12">
                <select value={clientData.azimuth ?? 0} onChange={e => updateClientData({ azimuth: Number(e.target.value) })} className={`${fieldAccent} bg-slate-900`}>
                  {AZIMUTH_OPTIONS.map(a => <option key={a.value} value={a.value} className="bg-slate-900 text-slate-100">{a.label}</option>)}
                </select>
              </FieldCell>
            </div>
          </div>
        </div>
      </div>

      {/* ── PAINEL DIREITO: Mapa + Viewport ── */}
      <div className={cn(
        "flex-1 lg:h-full flex flex-col overflow-hidden transition-all duration-500",
        mobileView === 'form' ? "hidden lg:flex" : "flex"
      )}>
        <PanelHeader 
          icon={<Navigation size={13} />} 
          label="Área de Projeto e Simulação" 
          secondary={
            geocodeStatus !== 'idle' && (
              <div className={cn('flex items-center gap-2 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest', 
                geocodeStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              )}>
                <div className={cn("w-1 h-1 rounded-full", geocodeStatus === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400')} />
                {geocodeStatusLabel}
              </div>
            )
          }
        />

        <div className="flex-1 min-h-[300px] relative group select-none">
          <MapCore activeTool="SELECT" showLayers={false} variant="EXPLORATION">
            <GeocodeFlyTo lat={activeLat} lng={activeLng} isPanning={isMapPanning} />
            <MapInteractionHandler onLocationSelect={handleMapClick} onPanStart={handlePanStart} onPanEnd={handlePanEnd} />
            <ProjectSiteMarker />
            <MapFlyToSync />
          </MapCore>

          {/* ── FIXED CROSSHAIR (Rank 1 - Engineering UI) ── */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1000] flex items-center justify-center transition-all duration-300">
            <div className={cn(
              "relative flex items-center justify-center transition-all duration-300",
              isMapPanning ? "scale-90 opacity-60" : "scale-100 opacity-100"
            )}>
              {/* Outer Ring */}
              <div className={cn("absolute w-10 h-10 rounded-full border border-indigo-500/50 transition-all duration-500", isMapPanning && "w-8 h-8 border-indigo-400")} />
              {/* Center Dot */}
              <div className="w-1 h-1 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
              {/* Reticles */}
              <div className="absolute w-14 h-[1px] bg-indigo-500/50" />
              <div className="absolute h-14 w-[1px] bg-indigo-500/50" />
            </div>
            
            {/* Label Tooltip */}
            <div className={cn(
              "absolute top-8 px-2 py-0.5 bg-slate-950/90 border border-indigo-500/30 rounded-sm text-[8px] font-black uppercase tracking-widest text-indigo-400 whitespace-nowrap transition-all duration-300 shadow-xl backdrop-blur-md",
              isMapPanning ? "opacity-100 translate-y-2 scale-100" : "opacity-0 translate-y-0 scale-95"
            )}>
              Ajustando Posição...
            </div>
          </div>

          {/* ── GEOLOCATING SCAN OVERLAY ── */}
          {isGeocoding && (
            <div className="absolute inset-0 z-[1001] pointer-events-none flex items-center justify-center bg-slate-950/20 backdrop-blur-[1px]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(147,51,234,0.05)_2px,transparent_2px)] bg-[length:100%_40px] animate-[scan_2s_linear_infinite]" />
              <div className="px-4 py-2 bg-slate-900/90 border border-purple-500/30 rounded-sm shadow-2xl flex items-center gap-3 animate-pulse">
                <Loader2 size={12} className="animate-spin text-purple-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-200">Sincronizando Coordenadas...</span>
              </div>
            </div>
          )}

          {/* ── GEOLOCATING SCAN OVERLAY ── */}
          {isGeocoding && (
            <div className="absolute inset-0 z-[1001] pointer-events-none flex items-center justify-center bg-slate-950/20 backdrop-blur-[1px]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(147,51,234,0.05)_2px,transparent_2px)] bg-[length:100%_40px] animate-[scan_2s_linear_infinite]" />
              <div className="px-4 py-2 bg-slate-900/90 border border-purple-500/30 rounded-sm shadow-2xl flex items-center gap-3 animate-pulse">
                <Loader2 size={12} className="animate-spin text-purple-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-200">Sincronizando Coordenadas...</span>
              </div>
            </div>
          )}

          {/* ── HUDs SUPERIORES (Coordenadas) ── */}
          <div className="absolute top-2 left-0 right-0 px-2 lg:top-4 lg:px-4 z-[1000] flex items-start pointer-events-none gap-1.5 lg:gap-3">
            <div className="shrink-0 pointer-events-auto h-9 lg:h-11">
              <div className="h-full bg-slate-950/40 backdrop-blur-xl border border-white/10 p-1 lg:p-1.5 rounded-sm flex items-center gap-2 lg:gap-4 shadow-2xl">
                <div className="flex flex-col px-0.5 lg:px-1">
                  <span className="text-[6px] lg:text-[7px] text-purple-400/80 font-black uppercase tracking-tighter hidden 2xl:block">LATITUDE</span>
                  <span className="text-[10px] lg:text-[12px] font-mono font-bold text-slate-200">{clientData.lat?.toFixed(5) || '—'}</span>
                </div>
                <div className="w-px h-4 lg:h-5 bg-white/10" />
                <div className="flex flex-col px-0.5 lg:px-1">
                  <span className="text-[6px] lg:text-[7px] text-purple-400/80 font-black uppercase tracking-tighter hidden 2xl:block">LONGITUDE</span>
                  <span className="text-[10px] lg:text-[12px] font-mono font-bold text-slate-200">{clientData.lng?.toFixed(5) || '—'}</span>
                </div>
              </div>
            </div>
            <div className="flex-1" />
          </div>
          
          {/* ── HUD INFERIOR ESQUERDO: Endereço ── */}
          {detectedAddress && (
            <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto max-w-[calc(100vw-32px)] sm:max-w-[420px] h-9 lg:h-11">
              <div className="h-full bg-slate-950/60 backdrop-blur-xl border border-purple-500/30 p-1 lg:p-1.5 rounded-sm flex items-center gap-2 lg:gap-3 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <button 
                  onClick={() => reverseGeocode(clientData.lat!, clientData.lng!, false)}
                  className="flex flex-col flex-1 min-w-0 pl-1 lg:pl-2 text-left hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full bg-purple-500", isGeocoding && "animate-pulse")} />
                    <span className="text-[7px] lg:text-[8px] text-purple-400 font-black uppercase tracking-[0.2em]">Sítio Identificado</span>
                  </div>
                  <p className="text-[9px] lg:text-[11px] text-slate-200 font-bold leading-tight truncate italic opacity-90">{detectedAddress}</p>
                </button>
                <div className="w-px h-5 lg:h-6 bg-white/10 shrink-0" />
                <button onClick={() => reverseGeocode(clientData.lat!, clientData.lng!, true)} className="group relative flex items-center justify-center w-7 h-7 lg:w-8 lg:h-8 bg-purple-600/90 hover:bg-purple-500 text-white rounded-full transition-all shrink-0 shadow-lg">
                  <RefreshCw size={11} className={cn("transition-transform duration-700", isGeocoding ? "animate-spin" : "group-hover:rotate-180")} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── BARRA DE TELEMETRIA (Rodapé) ── */}
        <div className="@container shrink-0 bg-slate-950 border-t border-slate-800">
          <div className="flex flex-row h-32 @3xl:h-36 relative overflow-visible">
            
            {/* 1. Cockpit Térmico (Esquerda) */}
            {/* 1. Cockpit Térmico (Esquerda) */}
            {(() => {
              const tAvg = weatherData?.ambient_temp_avg || 27.5;
              const tMonthly = weatherData?.temp_monthly?.length === 12 ? weatherData.temp_monthly : Array(12).fill(tAvg);
              
              const tMinRaw = Math.min(...tMonthly);
              const tMaxRaw = Math.max(...tMonthly);
              const tMin = tMinRaw === tMaxRaw ? tAvg - 3 : tMinRaw;
              const tMax = tMinRaw === tMaxRaw ? tAvg + 3 : tMaxRaw;
              
              const avgPct = Math.max(0, Math.min(100, ((tAvg - tMin) / (tMax - tMin)) * 100));
              
              // Glow color based on relative thermal severity
              const glowColor = avgPct > 70 ? 'bg-rose-500' : avgPct < 30 ? 'bg-sky-500' : 'bg-emerald-500';

              return (
                <div className="w-[210px] @3xl:w-[260px] flex flex-col border-r border-slate-800/80 bg-slate-950/40 shrink-0 group/kpi relative overflow-visible">
                  
                  {/* Glow Radial Dinâmico de Fundo */}
                  <div 
                    className={cn(
                      "absolute -top-12 -right-12 w-32 h-32 rounded-full mix-blend-screen opacity-[0.07] blur-2xl pointer-events-none transition-colors duration-1000",
                      glowColor
                    )}
                  />

                  <div className="flex-1 p-3 pb-5 @3xl:p-4 @3xl:pb-7 flex flex-col relative z-10 gap-2 overflow-visible">
                    
                    {/* Título & Ícone (Topo) */}
                    <div className="flex items-center justify-between w-full shrink-0">
                      <span className="text-[8px] @3xl:text-[9px] font-bold text-slate-500 uppercase tracking-widest">Perfil Térmico</span>
                      <Thermometer size={10} className="text-rose-500/40" />
                    </div>
                    
                    {/* Foco Central: Tavg */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="flex items-start gap-1">
                        <span className="text-2xl @3xl:text-3xl font-mono font-black text-slate-100 tabular-nums leading-none tracking-tight">
                          {tAvg.toFixed(1)}
                        </span>
                        <span className="text-[8px] @3xl:text-[9px] font-bold text-slate-500 uppercase mt-0.5">°C</span>
                      </div>
                      <span className="text-[7px] @3xl:text-[8px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-1 opacity-80">
                        Média Histórica
                      </span>
                    </div>

                    {/* Escala HMI (Rodapé) */}
                    <div className="flex items-center gap-2.5 @3xl:gap-3 w-full shrink-0 mt-auto overflow-visible">
                      
                      {/* T. Mín Limit (Frio) */}
                      <div className="flex flex-col items-end shrink-0 w-9 @3xl:w-10">
                        <div className="flex items-center gap-0.5">
                          <Snowflake size={8} className="text-sky-400" />
                          <span className="text-[10px] @3xl:text-[11px] font-bold text-sky-100 tabular-nums">{tMin.toFixed(0)}°</span>
                        </div>
                        <span className="text-[6px] @3xl:text-[6.5px] text-slate-500 uppercase font-bold tracking-[0.1em] mt-0.5 pr-0.5">T. Mín</span>
                      </div>
                      
                      {/* Track Full-Width SCADA */}
                      <div className="flex-1 h-2.5 @3xl:h-3 bg-slate-950 rounded-sm border border-slate-900 shadow-[inset_0_1px_3px_rgba(0,0,0,1)] relative overflow-visible">
                        
                        {/* Gradiente Local da Amplitude Térmica */}
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/90 via-emerald-500/90 to-rose-500/90 opacity-85 rounded-[inherit]" />
                        
                        {/* Régua de Marcação (Ticks a cada 10%) */}
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_calc(10%-1px),rgba(0,0,0,0.8)_calc(10%-1px),rgba(0,0,0,0.8)_10%)] mix-blend-multiply rounded-[inherit]" />
                        
                        {/* Agulha SCADA de Precisão */}
                        <div 
                          className="absolute top-1/2 w-[1.5px] h-3.5 @3xl:h-4.5 bg-white shadow-[0_0_10px_rgba(255,255,255,1)] z-10 transition-all duration-1000 ease-out"
                          style={{ left: `${avgPct}%`, transform: 'translate(-50%, -50%)' }}
                        >
                          {/* Retículas superior e inferior */}
                          <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 border-x-[2.5px] border-x-transparent border-t-[2.5px] border-t-white" />
                          <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 border-x-[2.5px] border-x-transparent border-b-[2.5px] border-b-white" />
                        </div>
                      </div>

                      {/* T. Máx Limit (Calor) */}
                      <div className="flex flex-col items-start shrink-0 w-9 @3xl:w-10">
                        <div className="flex items-center gap-0.5">
                          <span className="text-[10px] @3xl:text-[11px] font-bold text-rose-100 tabular-nums">{tMax.toFixed(0)}°</span>
                          <Flame size={8} className="text-rose-400" />
                        </div>
                        <span className="text-[6px] @3xl:text-[6.5px] text-slate-500 uppercase font-bold tracking-[0.1em] mt-0.5 pl-0.5">T. Máx</span>
                      </div>
                    </div>
                    
                  </div>
                </div>
              );
            })()}

            {/* 2. Heatmap Panel (Direita) */}
            <HeatmapPanel hspMonthly={hspMonthly} irradiationSource={weatherData?.irradiation_source} />

        </div>
      </div>
    </div>
  </div>
);
};
