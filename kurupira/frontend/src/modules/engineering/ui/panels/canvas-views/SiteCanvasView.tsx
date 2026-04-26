import { 
  FileText, Navigation, MapPin, Loader2, Search, 
  Plus, Minus, Zap, Home, Edit2, RefreshCw
} from 'lucide-react';
import { useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useSolarStore } from '@/core/state/solarStore';
import { useCallback, useEffect, useState } from 'react';
import { MapCore, globalLeafletMapRef } from '../../../components/MapCore';
import { fetchWeatherAnalysis } from '@/services/weatherService';
import { cn } from '@/lib/utils';
import { useGoogleGeocoding } from '../../../hooks/useGoogleGeocoding';
import { ProjectSiteMarker } from '../../../components/ProjectSiteMarker';

const MapClickHandler: React.FC<{ onLocationSelect: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
  useMapEvents({ click: (e) => onLocationSelect(e.latlng.lat, e.latlng.lng) });
  return null;
};

// ── Field primitives (Engineering UI High-Density) ─────────────────────────
const fieldBase = 'w-full bg-slate-900/50 border border-slate-800 rounded-sm px-2.5 py-1.5 text-[13px] outline-none transition-all placeholder:text-slate-600 hover:border-slate-700';
const fieldDefault = `${fieldBase} text-slate-200 focus:border-purple-500/50 focus:bg-slate-900 focus:ring-1 focus:ring-purple-500/20`;
const fieldAccent = `${fieldBase} text-emerald-400 font-bold font-mono focus:border-emerald-500/50 focus:bg-slate-900`;

const FieldCell: React.FC<{ label: string; children: React.ReactNode; accent?: boolean; className?: string }> = ({
  label, children, accent = false, className
}) => (
  <div className={cn('flex flex-col gap-1', className)}>
    <label className={cn('text-[10px] font-black uppercase tracking-[0.15em] font-sans', accent ? 'text-emerald-500' : 'text-slate-500')}>
      {label}
    </label>
    {children}
  </div>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; label: string; color?: string }> = ({ icon, label, color = 'text-slate-400' }) => (
  <div className={cn('flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800/80 pb-1.5 font-sans', color)}>
    <div className="p-1 bg-slate-900 rounded-sm border border-slate-800">
      {icon || <div className="w-2 h-2 rounded-full bg-current opacity-50" />}
    </div>
    {label}
  </div>
);

const PanelHeader: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  secondary?: React.ReactNode;
}> = ({ icon, label, secondary }) => (
  <div className="shrink-0 h-10 px-4 border-b border-l-[3px] border-l-purple-600 border-b-slate-800/80 bg-slate-950/40 backdrop-blur-xl flex items-center justify-between gap-3 shadow-lg z-10">
    <div className="flex items-center gap-3">
      <div className="text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">{icon}</div>
      <span className="text-[11px] text-slate-200 font-black uppercase tracking-[0.2em] font-sans">{label}</span>
    </div>
    {secondary}
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

/**
 * SITE CANVAS VIEW — Cockpit 460/flex — spec-view-site-2026-04-26
 */
export const SiteCanvasView: React.FC = () => {
  const clientData    = useSolarStore(s => s.clientData);
  const updateClientData = useSolarStore(s => s.updateClientData);
  const weatherData      = useSolarStore(s => s.weatherData);
  const setWeatherData   = useSolarStore(s => s.setWeatherData);
  const setIrradiationData = useSolarStore(s => s.setIrradiationData);

  // ── Geocoding & Reverse Geocoding (Hookified) ──────────────────────────
  const { isGeocoding, geocodeStatus, geocodeAddress, reverseGeocode, detectedAddress, setDetectedAddress } = useGoogleGeocoding();
  const [isEditingGeo, setIsEditingGeo] = useState(false);

  // ── Climate Sync ───────────────────────────────────────────────────────
  const syncClimateData = useCallback(async () => {
    if (!clientData.lat || !clientData.lng || !clientData.city) return;
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
    if (clientData.lat && clientData.lng) {
      setDetectedAddress(null);
      const t = setTimeout(() => {
        reverseGeocode(clientData.lat!, clientData.lng!, true);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [clientData.lat, clientData.lng, reverseGeocode, setDetectedAddress]);

  // ── ViaCEP ─────────────────────────────────────────────────────────────
  const handleZipCodeChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    updateClientData({ zipCode: cleanCep });
    if (cleanCep.length === 8) {
      try {
        const resp = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await resp.json();
        if (!data.erro) updateClientData({ street: data.logradouro || clientData.street, city: data.localidade || clientData.city, state: data.uf || clientData.state });
      } catch (e) { console.error('ViaCEP Error:', e); }
    }
  };

  const handleMapClick = useCallback((newLat: number, newLng: number) => {
    updateClientData({ lat: parseFloat(newLat.toFixed(6)), lng: parseFloat(newLng.toFixed(6)) });
  }, [updateClientData]);

  // ── Derived values ─────────────────────────────────────────────────────
  const activeLat = (clientData.lat !== undefined && !isNaN(clientData.lat)) ? clientData.lat : -3.1316;
  const activeLng = (clientData.lng !== undefined && !isNaN(clientData.lng)) ? clientData.lng : -60.0233;
  const mapCenter: [number, number] = [activeLat, activeLng];

  const hspMonthly = clientData.monthlyIrradiation ?? Array(12).fill(0);
  const totalHsp = hspMonthly.reduce((a, b) => a + b, 0);

  const geocodeStatusLabel = { searching: 'Buscando...', success: 'Localização exata', partial: 'Aproximação', error: 'Não encontrado', idle: '' }[geocodeStatus as string] || '';

  // ── Solar Analysis (Suggested PR) ───────────────────────────────────
  const isSulSudeste = ['RS', 'SC', 'PR', 'SP', 'RJ', 'MG', 'ES'].includes(clientData.state || '');
  let prSugerido = isSulSudeste ? 0.82 : 0.80;
  
  const azimuth = clientData.azimuth ?? 0;
  if (azimuth >= 135 && azimuth <= 225) prSugerido -= 0.15;
  else if ((azimuth > 90 && azimuth < 135) || (azimuth > 225 && azimuth < 270)) prSugerido -= 0.05;
  else if (azimuth > 45 && azimuth <= 90) prSugerido -= 0.02;
  else if (azimuth >= 270 && azimuth <= 315) prSugerido -= 0.02;

  return (
    <div className="w-full h-full bg-slate-950 font-sans flex flex-col lg:flex-row lg:overflow-hidden overflow-y-auto">

      {/* ── PAINEL ESQUERDO — Dossiê (460px) ── */}
      <div className="w-full lg:w-[460px] shrink-0 lg:h-full flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 lg:overflow-hidden overflow-y-auto custom-scrollbar">
        <PanelHeader icon={<FileText size={13} />} label="Dossiê Técnico do Projeto" />

        <div className="flex-1 p-3.5 lg:p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <SectionHeader icon={null} label="Identificação do Projeto" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldCell label="Cliente *">
                <input type="text" value={clientData.clientName || ''} onChange={e => updateClientData({ clientName: e.target.value })} className={fieldDefault} placeholder="Nome do titular" />
              </FieldCell>
              <FieldCell label="Título do Projeto">
                <input type="text" value={clientData.projectName || ''} onChange={e => updateClientData({ projectName: e.target.value })} className={fieldDefault} placeholder="Fase 1" />
              </FieldCell>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <SectionHeader icon={<MapPin size={9} />} label="Endereço de Instalação" />
              <button
                onClick={() => geocodeAddress()}
                disabled={isGeocoding || (!clientData.street && (!clientData.zipCode || clientData.zipCode.length < 8))}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-sm transition-all disabled:opacity-20 text-[9px] font-black uppercase tracking-[0.15em] shadow-lg shadow-purple-500/20 active:scale-95"
              >
                {isGeocoding ? <Loader2 size={10} className="animate-spin" /> : <Search size={10} />}
                Localizar
              </button>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <FieldCell label="CEP *" className="col-span-5" accent>
                <input type="text" value={clientData.zipCode || ''} onChange={e => handleZipCodeChange(e.target.value)} className={fieldAccent} placeholder="00000-000" maxLength={9} />
              </FieldCell>
              <FieldCell label="UF" className="col-span-3">
                <input type="text" value={clientData.state || ''} onChange={e => updateClientData({ state: e.target.value.toUpperCase() })} maxLength={2} className={`${fieldBase} text-purple-200 font-black text-center focus:border-purple-500/50`} />
              </FieldCell>
              <FieldCell label="Cidade *" className="col-span-12 sm:col-span-4">
                <input type="text" value={clientData.city || ''} onChange={e => updateClientData({ city: e.target.value })} className={fieldDefault} />
              </FieldCell>
              <FieldCell label="Logradouro" className="col-span-12 sm:col-span-9">
                <input type="text" value={clientData.street || ''} onChange={e => updateClientData({ street: e.target.value })} className={fieldDefault} />
              </FieldCell>
              <FieldCell label="Nº" className="col-span-12 sm:col-span-3">
                <input type="text" value={clientData.number || ''} onChange={e => updateClientData({ number: e.target.value })} className={`${fieldBase} text-slate-100 text-center focus:border-slate-700`} />
              </FieldCell>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <SectionHeader icon={<Zap size={9} />} label="Rede Elétrica" color="text-amber-500/80" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldCell label="Concessionária">
                <input type="text" value={clientData.concessionaire || ''} onChange={e => updateClientData({ concessionaire: e.target.value })} className={`${fieldBase} text-slate-300 focus:border-amber-500/40`} placeholder="Ex: CEMIG..." />
              </FieldCell>
              <FieldCell label="Tarifa (R$/kWh)" accent>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-700 font-mono font-black text-[10px]">R$</span>
                  <input type="number" step="0.01" value={clientData.tariffRate || 0} onChange={e => updateClientData({ tariffRate: Number(e.target.value) })} className={`${fieldAccent} pl-8 text-right`} />
                </div>
              </FieldCell>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <SectionHeader icon={<Home size={9} />} label="Premissas Estruturais" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldCell label="Tipo de Telhado">
                <select value={clientData.roofType || ''} onChange={e => updateClientData({ roofType: (e.target.value || undefined) as any })} className={`${fieldBase} text-slate-300 focus:border-slate-700 bg-slate-900`}>
                  <option value="">— Selecionar —</option>
                  {ROOF_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </FieldCell>
              <FieldCell label="Azimute">
                <select value={clientData.azimuth ?? 0} onChange={e => updateClientData({ azimuth: Number(e.target.value) })} className={`${fieldBase} text-emerald-400 font-bold focus:border-emerald-500 bg-slate-900`}>
                  {AZIMUTH_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </FieldCell>
            </div>
          </div>
        </div>
      </div>

      {/* ── PAINEL DIREITO: Mapa + Viewport ── */}
      <div className="flex-1 lg:h-full flex flex-col min-h-[400px]">
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
          <MapCore activeTool="SELECT" center={mapCenter} zoom={clientData.lat ? 17 : 12} showLayers={false} variant="EXPLORATION">
            <MapClickHandler onLocationSelect={handleMapClick} />
            <ProjectSiteMarker />
          </MapCore>

          {/* ── HUDs SUPERIORES ── */}
          <div className="absolute top-3 left-3 right-3 lg:top-4 lg:left-4 lg:right-4 z-[1000] flex items-start pointer-events-none gap-2 lg:gap-3">
            <div className="shrink-0 pointer-events-auto h-9 lg:h-11">
              <div className="h-full bg-slate-950/40 backdrop-blur-xl border border-white/10 p-1 lg:p-1.5 rounded-sm flex items-center gap-2 lg:gap-4 shadow-2xl">
                <div className="flex flex-col px-1">
                  <span className="text-[6px] lg:text-[7px] text-purple-400/80 font-black uppercase tracking-tighter hidden md:block">LATITUDE</span>
                  <span className="text-[10px] lg:text-[12px] font-mono font-bold text-slate-200">{clientData.lat?.toFixed(5) || '—'}</span>
                </div>
                <div className="w-px h-4 lg:h-5 bg-white/10" />
                <div className="flex flex-col px-1">
                  <span className="text-[6px] lg:text-[7px] text-purple-400/80 font-black uppercase tracking-tighter hidden md:block">LONGITUDE</span>
                  <span className="text-[10px] lg:text-[12px] font-mono font-bold text-slate-200">{clientData.lng?.toFixed(5) || '—'}</span>
                </div>
                <button onClick={() => setIsEditingGeo(!isEditingGeo)} className="p-1.5 lg:p-2 rounded-sm bg-white/5 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition-all">
                  <Edit2 size={10} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex justify-center h-9 lg:h-11 overflow-hidden">
              {detectedAddress && (
                <div className="pointer-events-auto min-w-0 max-w-[640px] h-full">
                  <div className="h-full bg-slate-950/40 backdrop-blur-xl border border-purple-500/20 p-1 lg:p-1.5 rounded-sm flex items-center gap-2 lg:gap-4 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex flex-col flex-1 min-w-0 pl-1 lg:pl-2">
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                        <span className="text-[7px] lg:text-[8px] text-purple-400 font-black uppercase tracking-[0.2em]">Detectada</span>
                      </div>
                      <p className="text-[9px] lg:text-[11px] text-slate-200 font-bold leading-tight truncate italic opacity-90">{detectedAddress}</p>
                    </div>
                    <div className="w-px h-5 lg:h-6 bg-white/10 shrink-0" />
                    <button onClick={() => reverseGeocode(clientData.lat!, clientData.lng!, false)} className="group relative flex items-center justify-center w-7 h-7 lg:w-8 lg:h-8 bg-purple-600/90 hover:bg-purple-500 text-white rounded-full transition-all shrink-0">
                      <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-700" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 pointer-events-auto h-auto">
              <div className="flex flex-col lg:flex-row bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-sm shadow-2xl p-0.5">
                <button className="w-8 h-8 lg:w-9 lg:h-9 hover:bg-white/5 text-slate-400 hover:text-purple-400 transition-all flex items-center justify-center rounded-sm" onClick={() => globalLeafletMapRef.current?.zoomIn()}>
                  <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </button>
                <div className="hidden lg:block w-px h-6 bg-white/10 self-center" />
                <button className="w-8 h-8 lg:w-9 lg:h-9 hover:bg-white/5 text-slate-400 hover:text-purple-400 transition-all flex items-center justify-center rounded-sm" onClick={() => globalLeafletMapRef.current?.zoomOut()}>
                  <Minus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── BARRA DE TELEMETRIA METROLÓGICA (Rodapé SCADA/Heatmap) ── */}
        <div className="shrink-0 bg-slate-950 border-t border-slate-800 flex flex-col lg:flex-row h-auto lg:h-24 relative">
          
          {/* Métricas de Performance (SCADA Displays) */}
          <div className="w-full lg:w-[420px] flex border-b lg:border-b-0 lg:border-r border-slate-800/80">
            {/* HSP Média (Yellow) */}
            <div className="flex-1 p-3 lg:p-4 border-r border-yellow-500/20 bg-yellow-900/10 flex flex-col justify-center gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">HSP Médio</span>
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-sm" />
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-mono font-black text-slate-100 tracking-tighter tabular-nums">
                  {(totalHsp / 12).toFixed(2)}
                </span>
                <span className="text-[9px] font-bold text-yellow-400/70 uppercase">kWh/m².dia</span>
              </div>
            </div>

            {/* Temperatura Média (Rose) */}
            <div className="flex-1 p-3 lg:p-4 flex flex-col justify-center gap-1 bg-rose-900/10">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Temperatura Média</span>
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-sm" />
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-mono font-black text-slate-100 tracking-tighter tabular-nums">
                  {weatherData?.ambient_temp_avg?.toFixed(1) || '27.5'}
                </span>
                <span className="text-[9px] font-bold text-rose-400/70 uppercase">°C</span>
              </div>
            </div>
          </div>

          {/* Heatmap Linear de Irradiância (Yellow) */}
          <div className="flex-1 p-3 lg:p-4 flex flex-col justify-center min-w-0 bg-yellow-900/5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-yellow-500 rounded-[1px]" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-400">Série Histórica Climatológica</span>
              </div>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 border border-slate-700 rounded-sm bg-slate-900">Base de Irradiância</span>
            </div>
            
            <div className="flex-1 grid grid-cols-6 md:grid-cols-12 gap-1.5 w-full max-h-[32px] min-h-[32px]">
              {hspMonthly.map((hsp, idx) => {
                const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
                const intensity = Math.max(0, Math.min(1, (hsp - 3.5) / (6.5 - 3.5)));
                
                // Color ramp baseada na escala Yellow do context.md
                const bgColor = intensity < 0.25 ? 'bg-slate-900 text-slate-500 border-slate-800' 
                              : intensity < 0.55 ? 'bg-yellow-900/30 text-yellow-500 border-yellow-500/20'
                              : intensity < 0.85 ? 'bg-yellow-600/50 text-yellow-100 border-yellow-500/40'
                              : 'bg-yellow-500 text-yellow-950 font-black border-yellow-400';

                return (
                  <div 
                    key={months[idx]} 
                    className={cn(
                      "flex flex-col items-center justify-center rounded-sm transition-colors cursor-default select-none border",
                      bgColor
                    )}
                    title={`${months[idx]}: ${hsp.toFixed(2)} kWh/m².dia`}
                  >
                    <span className="text-[10px] font-mono tabular-nums leading-none mb-[1px]">{hsp.toFixed(1)}</span>
                    <span className="text-[6.5px] uppercase tracking-widest opacity-80 font-sans font-black">{months[idx]}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
