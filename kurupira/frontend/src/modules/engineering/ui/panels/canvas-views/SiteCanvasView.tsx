import { 
  FileText, Navigation, MapPin, Loader2, Search, 
  Plus, Minus, Zap, Home, Edit2, RefreshCw
} from 'lucide-react';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSolarStore } from '@/core/state/solarStore';
import React, { useCallback, useEffect, useState } from 'react';
import { MapCore, globalLeafletMapRef } from '../../../components/MapCore';
import { fetchWeatherAnalysis } from '@/services/weatherService';
import { cn } from '@/lib/utils';
import { useGoogleGeocoding } from '../../../hooks/useGoogleGeocoding';
import { ProjectSiteMarker } from '../../../components/ProjectSiteMarker';
import { Autocomplete } from '@/components/ui/Autocomplete';
import { BRAZILIAN_UTILITIES, STATE_TO_DEFAULT_UTILITY } from '@/core/data/utilities';

const MapClickHandler: React.FC<{ onLocationSelect: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
  useMapEvents({ click: (e) => onLocationSelect(e.latlng.lat, e.latlng.lng) });
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
  const [mobileView, setMobileView] = useState<'form' | 'map'>('form');

  // ── Auto-Pan: Fly to location when coords change ───────────────────────
  useEffect(() => {
    const lat = Number(clientData.lat);
    const lng = Number(clientData.lng);
    
    if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0) && globalLeafletMapRef.current) {
      globalLeafletMapRef.current.flyTo(L.latLng(lat, lng), 18, {
        animate: true,
        duration: 1.5
      });
    }
  }, [clientData.lat, clientData.lng]);

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

  // ── Derived values (Defensive Lat/Lng) ──────────────────────────────────
  const activeLat = (clientData.lat !== undefined && clientData.lat !== null && !isNaN(clientData.lat)) ? clientData.lat : -3.1316;
  const activeLng = (clientData.lng !== undefined && clientData.lng !== null && !isNaN(clientData.lng)) ? clientData.lng : -60.0233;
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
                secondary={
                  <button
                    onClick={() => geocodeAddress()}
                    disabled={isGeocoding || (!clientData.street && (!clientData.zipCode || clientData.zipCode.length < 8))}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-sm transition-all disabled:opacity-20 text-[7px] font-black uppercase tracking-widest border border-slate-800/60 active:scale-95 shrink-0"
                    title="Localizar no Mapa"
                  >
                    {isGeocoding ? <Loader2 size={9} className="animate-spin text-purple-400" /> : <Search size={9} className="text-slate-500" />}
                    <span className="hidden 2xl:inline">Localizar</span>
                  </button>
                }
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
          <MapCore activeTool="SELECT" center={mapCenter} zoom={clientData.lat ? 17 : 12} showLayers={false} variant="EXPLORATION">
            <MapClickHandler onLocationSelect={handleMapClick} />
            <ProjectSiteMarker />
          </MapCore>

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

          {/* ── HUDs SUPERIORES ── */}
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
                <button onClick={() => setIsEditingGeo(!isEditingGeo)} className="p-1.5 lg:p-2 rounded-sm bg-white/5 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition-all">
                  <Edit2 size={10} />
                </button>
              </div>
            </div>

            <div className="flex-1" />

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

        {/* ── BARRA DE TELEMETRIA METROLÓGICA (Rodapé SCADA/Heatmap) ── */}
        <div className="shrink-0 bg-slate-950 border-t border-slate-800 flex flex-row h-auto lg:h-24 relative overflow-hidden">
          
          {/* Métricas de Performance (SCADA Displays) */}
          <div className="w-[100px] lg:w-[420px] grid grid-cols-1 lg:grid-cols-2 border-r border-slate-800/80 bg-slate-950/20 shrink-0">
            {/* HSP Médio (☀️ Yellow) */}
            <div className="flex-1 p-2 lg:p-4 border-r lg:border-r border-slate-800/60 lg:border-b-0 border-b bg-gradient-to-br from-yellow-500/10 to-transparent flex flex-col justify-center gap-0 lg:gap-1 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-yellow-500/20" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-[7.5px] lg:text-[9px] font-bold text-slate-500 lg:text-slate-400 uppercase tracking-widest">
                  <span className="lg:inline hidden">HSP Médio</span>
                  <span className="lg:hidden">HSP</span>
                </span>
                <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-yellow-500 rounded-sm shadow-[0_0_8px_rgba(234,179,8,0.5)] group-hover:scale-125 transition-transform" />
              </div>
              <div className="flex items-baseline gap-0.5 mt-0.5 lg:mt-1 relative z-10">
                <span className="text-sm xs:text-base lg:text-2xl font-mono font-black text-yellow-400 tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                  {(totalHsp / 12).toFixed(2)}
                </span>
                <span className="text-[6px] lg:text-[9px] font-bold text-slate-600 uppercase">
                  <span className="lg:inline hidden">kWh/m².dia</span>
                  <span className="lg:hidden">kWh</span>
                </span>
              </div>
            </div>

            {/* Temperatura Médio (🌡️ Rose) */}
            <div className="flex-1 p-2 lg:p-4 bg-gradient-to-br from-rose-500/10 to-transparent flex flex-col justify-center gap-0 lg:gap-1 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-rose-500/20" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-[7.5px] lg:text-[9px] font-bold text-slate-500 lg:text-slate-400 uppercase tracking-widest">
                  <span className="lg:inline hidden">Temp. Média</span>
                  <span className="lg:hidden">Temp.</span>
                </span>
                <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-rose-500 rounded-sm shadow-[0_0_8px_rgba(244,63,94,0.5)] group-hover:scale-125 transition-transform" />
              </div>
              <div className="flex items-baseline gap-0.5 mt-0.5 lg:mt-1 relative z-10">
                <span className="text-sm xs:text-base lg:text-2xl font-mono font-black text-rose-400 tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                  {weatherData?.ambient_temp_avg?.toFixed(1) || '27.5'}
                </span>
                <span className="text-[6px] lg:text-[9px] font-bold text-slate-600 uppercase">°C</span>
              </div>
            </div>
          </div>

          {/* Heatmap Linear de Irradiância (☀️ Yellow) */}
          <div className="flex-1 p-3 lg:p-4 flex flex-col justify-center min-w-0 bg-yellow-900/5 transition-colors hover:bg-yellow-900/10">
            <div className="flex items-center justify-between mb-2 lg:mb-2.5 relative z-10">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-1 h-3 bg-yellow-500 rounded-[1px] shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
                <div className="flex flex-col lg:flex-row lg:items-center lg:gap-2">
                  <span className="text-[8px] lg:text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    <span className="lg:inline hidden">Base de Irradiância</span>
                    <span className="lg:hidden">Base Irrad.</span>
                  </span>
                  {weatherData?.irradiation_source && (
                    <span className="text-[6px] lg:text-[7px] text-yellow-500/60 font-black uppercase tracking-widest hidden xs:block">
                      [{weatherData.irradiation_source}]
                    </span>
                  )}
                </div>
              </div>
              <span className="hidden sm:block text-[7px] lg:text-[8px] font-bold text-slate-500 lg:text-slate-600 uppercase tracking-widest px-2 py-0.5 border border-slate-800/60 rounded-sm bg-slate-950/60 backdrop-blur-md">Série Histórica</span>
            </div>
            
            <div className="flex-1 grid grid-cols-6 md:grid-cols-12 gap-0.5 sm:gap-1 lg:gap-1.5 w-full min-h-[36px] lg:min-h-[32px]">
              {hspMonthly.map((hsp, idx) => {
                const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
                const intensity = Math.max(0, Math.min(1, (hsp - 3.5) / (6.5 - 3.5)));
                
                const bgColor = intensity < 0.25 ? 'bg-slate-950/80 text-slate-600 border-slate-800/40' 
                              : intensity < 0.55 ? 'bg-yellow-900/20 text-yellow-500/70 border-yellow-500/10'
                              : intensity < 0.85 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              : 'bg-yellow-500 text-slate-950 font-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.25)]';

                return (
                  <div 
                    key={months[idx]} 
                    className={cn(
                      "flex flex-col items-center justify-center rounded-sm transition-all cursor-default select-none border group/month",
                      "hover:scale-105 lg:hover:scale-110 hover:z-20 hover:shadow-xl",
                      bgColor
                    )}
                    title={`${months[idx]}: ${hsp.toFixed(2)} kWh/m².dia`}
                  >
                    <span className="text-[8px] xs:text-[9px] lg:text-[10px] font-mono font-bold tabular-nums leading-none mb-[1px] group-hover/month:scale-110 transition-transform">{hsp.toFixed(1)}</span>
                    <span className="text-[5px] xs:text-[6px] lg:text-[6.5px] uppercase tracking-widest opacity-80 font-sans font-black">{months[idx]}</span>
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
