import { 
  FileText, Navigation, ThermometerSun, MapPin, Loader2, Search, 
  Plus, Minus, Calendar, Sun, Lightbulb, Zap, Home 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSolarStore } from '@/core/state/solarStore';
import { useCallback, useEffect, useState } from 'react';
import { fetchWeatherAnalysis } from '@/services/weatherService';
import { cn } from '@/lib/utils';

// ── Leaflet marker fix ─────────────────────────────────────────────────────
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MapClickHandler: React.FC<{ onLocationSelect: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
  useMapEvents({ click: (e) => onLocationSelect(e.latlng.lat, e.latlng.lng) });
  return null;
};

const MapViewUpdater: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat !== 0 && lng !== 0) map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.8 });
  }, [lat, lng, map]);
  return null;
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const tileUrl = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// ── Field primitives ───────────────────────────────────────────────────────
const fieldBase = 'w-full bg-slate-950 border border-slate-800 rounded-sm px-2.5 py-1 text-[11px] font-mono outline-none transition-all';
const fieldDefault = `${fieldBase} text-slate-200 focus:border-slate-700`;
const fieldAccent = `${fieldBase} text-indigo-400 font-bold focus:border-indigo-500`;

const FieldCell: React.FC<{ label: string; children: React.ReactNode; accent?: boolean; className?: string }> = ({
  label, children, accent = false, className
}) => (
  <div className={cn('flex flex-col gap-0.5', className)}>
    <label className={cn('text-[11px] font-black uppercase tracking-widest font-mono', accent ? 'text-indigo-400/60' : 'text-slate-600')}>
      {label}
    </label>
    {children}
  </div>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; label: string; color?: string }> = ({ icon, label, color = 'text-slate-500/50' }) => (
  <div className={cn('flex items-center gap-1 text-[11px] font-black uppercase tracking-widest border-b border-slate-800/80 pb-1 font-mono', color)}>
    {icon}{label}
  </div>
);

const PanelHeader: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  secondary?: React.ReactNode;
}> = ({ icon, label, secondary }) => (
  <div className="shrink-0 h-8 px-3 border-b border-l-2 border-l-indigo-500/80 border-b-slate-800 bg-[#0a0f1a]/90 backdrop-blur-md flex items-center justify-between gap-3 shadow-sm">
    <div className="flex items-center gap-2">
      <div className="text-indigo-400 opacity-90">{icon}</div>
      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-mono">{label}</span>
    </div>
    {secondary}
  </div>
);

// ── Roof type options ──────────────────────────────────────────────────────
const ROOF_TYPES = [
  { value: 'ceramica',     label: 'Cerâmico' },
  { value: 'metalico',     label: 'Metálico' },
  { value: 'fibrocimento', label: 'Fibrocimento' },
  { value: 'laje',         label: 'Laje' },
  { value: 'outro',        label: 'Outro / Solo' },
] as const;

const RATE_GROUPS = [
  { value: 'B1', label: 'B1 — Residencial' },
  { value: 'B2', label: 'B2 — Rural' },
  { value: 'B3', label: 'B3 — Comercial BT' },
  { value: 'A4', label: 'A4 — Média Tensão' },
] as const;

// ── Sazonalidade Labels ────────────────────────────────────────────────────
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * SITE CANVAS VIEW — Cockpit 40/60 — spec-view-site-2026-04-15
 * Esquerda (40%): Blocos A-D (Identificação, Endereço, Rede Elétrica, Estrutural)
 * Direita  (60%): Mapa Satelital + Instrumentação + Metrologia Mensal
 */
export const SiteCanvasView: React.FC = () => {
  const clientData    = useSolarStore(s => s.clientData);
  const weatherData   = useSolarStore(s => s.weatherData);
  const updateClientData = useSolarStore(s => s.updateClientData);
  const setWeatherData   = useSolarStore(s => s.setWeatherData);
  const setIrradiationData = useSolarStore(s => s.setIrradiationData);

  // ── Geocoding ──────────────────────────────────────────────────────────
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'searching' | 'success' | 'partial' | 'error'>('idle');

  const handleGeocodeAddress = async () => {
    const { street, number, neighborhood, city, state, zipCode } = clientData;
    const hasMinAddress = (street && city) || (zipCode && zipCode.length >= 8);
    if (!hasMinAddress) return;
    setIsGeocoding(true);
    setGeocodeStatus('searching');
    try {
      const variants = [
        { type: 'success', query: [street, number, neighborhood, city, state, 'Brasil'].filter(Boolean).join(', ') },
        { type: 'partial', query: [street, city, state, 'Brasil'].filter(Boolean).join(', ') },
        { type: 'partial', query: [zipCode, 'Brasil'].filter(Boolean).join(', ') },
        { type: 'partial', query: [city, state, 'Brasil'].filter(Boolean).join(', ') },
      ].filter(v => v.query.length > 8);

      let finalCoords: { lat: number; lng: number } | null = null;
      let finalType: typeof geocodeStatus = 'error';

      for (const variant of variants) {
        const query = variant.query.replace(/\s+/g, ' ').trim();
        let coords: { lat: number; lng: number } | null = null;
        if (MAPBOX_TOKEN) {
          const resp = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=BR&limit=1&types=address,postcode,place`);
          const data = await resp.json();
          if (data.features?.length > 0) { const [lng, lat] = data.features[0].center; coords = { lat, lng }; }
        } else {
          const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, { headers: { 'Accept-Language': 'pt-BR' } });
          const data = await resp.json();
          if (data?.length > 0) coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
        if (coords) { finalCoords = coords; finalType = variant.type as any; break; }
      }
      if (finalCoords) {
        updateClientData({ lat: parseFloat(finalCoords.lat.toFixed(6)), lng: parseFloat(finalCoords.lng.toFixed(6)) });
        setGeocodeStatus(finalType);
      } else { setGeocodeStatus('error'); }
    } catch (err) { console.error('SITE_GEOC_ERROR:', err); setGeocodeStatus('error'); }
    finally { setIsGeocoding(false); setTimeout(() => setGeocodeStatus('idle'), 4000); }
  };

  // ── Climate Sync ───────────────────────────────────────────────────────
  const [isSyncing, setIsSyncing] = useState(false);
  const syncClimateData = useCallback(async () => {
    if (!clientData.lat || !clientData.lng || !clientData.city) return;
    setIsSyncing(true);
    try {
      const data = await fetchWeatherAnalysis(clientData.lat, clientData.lng, clientData.city, clientData.state);
      setWeatherData(data);
      setIrradiationData(data.hsp_monthly, data.irradiation_source);
    } catch (err) { console.error('Erro na sincronização climática:', err); }
    finally { setIsSyncing(false); }
  }, [clientData.lat, clientData.lng, clientData.city, clientData.state, setWeatherData, setIrradiationData]);

  useEffect(() => {
    const t = setTimeout(syncClimateData, 800);
    return () => clearTimeout(t);
  }, [clientData.lat, clientData.lng, clientData.city, clientData.state, syncClimateData]);

  // ── ViaCEP ─────────────────────────────────────────────────────────────
  const handleZipCodeChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    updateClientData({ zipCode: cleanCep });
    if (cleanCep.length === 8) {
      try {
        const resp = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await resp.json();
        if (!data.erro) updateClientData({ street: data.logradouro || clientData.street, neighborhood: data.bairro || clientData.neighborhood, city: data.localidade || clientData.city, state: data.uf || clientData.state });
      } catch (e) { console.error('ViaCEP Error:', e); }
    }
  };

  const handleMapClick = useCallback((newLat: number, newLng: number) => {
    updateClientData({ lat: parseFloat(newLat.toFixed(6)), lng: parseFloat(newLng.toFixed(6)) });
  }, [updateClientData]);

  // ── Derived values ─────────────────────────────────────────────────────
  const activeLat = clientData.lat ?? -3.1316;
  const activeLng = clientData.lng ?? -60.0233;
  const mapCenter: [number, number] = [activeLat, activeLng];

  const hspMonthly = clientData.monthlyIrradiation ?? Array(12).fill(0);

  const geocodeStatusColor = { searching: 'text-slate-400 animate-pulse', success: 'text-emerald-400', partial: 'text-amber-400', error: 'text-rose-400', idle: 'text-transparent' }[geocodeStatus];
  const geocodeStatusLabel = { searching: 'Buscando...', success: 'Localização exata', partial: 'Aproximação', error: 'Não encontrado', idle: '' }[geocodeStatus];

  // ── Solar Tech Insight ─────────────────────────────────────────────────
  const hspAnual = hspMonthly.reduce((a, b) => a + b, 0);
  const hspMed   = hspAnual / 12;
  const isSulSudeste = ['RS', 'SC', 'PR', 'SP', 'RJ', 'MG', 'ES'].includes(clientData.state || '');
  const prSugerido = isSulSudeste ? 0.82 : 0.80;
  
  const notaTecnica = hspMed > 5.0 
    ? "Irradiância alta (>5.0). Priorizar inversores de alta eficiência."
    : "Fluxo solar moderado. Dimensionamento padrão recomendado.";

  const showInsights = weatherData !== null && hspAnual > 0;

  return (
    <div className="w-full h-full bg-slate-950 font-sans flex flex-col lg:flex-row lg:overflow-hidden overflow-y-auto">

      {/* ══════════════════════════════════════════════════════
          PAINEL ESQUERDO — Premissas de Engenharia (40%)
      ══════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-[400px] shrink-0 lg:h-full flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 lg:overflow-hidden overflow-y-auto custom-scrollbar">
        
        {/* Header HUD do Painel de Premissas */}
        <PanelHeader icon={<FileText size={13} />} label="Dossiê Técnico do Projeto" />

        <div className="flex-1 p-3.5 lg:p-4 flex flex-col gap-3.5">

          {/* ── Seção A: Identificação ──────────────────────── */}
          <div className="flex flex-col gap-3">
            <SectionHeader icon={null} label="Identificação do Projeto" />
            <div className="grid grid-cols-12 gap-2.5">
              <FieldCell label="Cliente *" className="col-span-6">
                <input type="text" value={clientData.clientName || ''} onChange={e => updateClientData({ clientName: e.target.value })} className={fieldDefault} placeholder="Nome do titular" />
              </FieldCell>
              <FieldCell label="Título do Projeto" className="col-span-6">
                <input type="text" value={clientData.projectName || ''} onChange={e => updateClientData({ projectName: e.target.value })} className={`${fieldBase} text-slate-400 focus:border-slate-700`} placeholder="Fase 1" />
              </FieldCell>
            </div>
          </div>

          {/* ── Seção B: Endereço ───────────────────────────── */}
          <div className="flex flex-col gap-3">
            <SectionHeader icon={null} label="Endereço de Instalação" />
            <div className="grid grid-cols-12 gap-2.5">
              <FieldCell label="CEP *" className="col-span-5" accent>
                <input type="text" value={clientData.zipCode || ''} onChange={e => handleZipCodeChange(e.target.value)} className={fieldAccent} placeholder="00000-000" maxLength={9} />
              </FieldCell>
              <FieldCell label="UF" className="col-span-2">
                <input type="text" value={clientData.state || ''} onChange={e => updateClientData({ state: e.target.value.toUpperCase() })} maxLength={2} className={`${fieldBase} text-indigo-300 font-black text-center focus:border-indigo-500/50`} />
              </FieldCell>
              <FieldCell label="Cidade *" className="col-span-5">
                <input type="text" value={clientData.city || ''} onChange={e => updateClientData({ city: e.target.value })} className={`${fieldBase} text-slate-300 focus:border-slate-700`} />
              </FieldCell>
              <FieldCell label="Logradouro" className="col-span-9">
                <input type="text" value={clientData.street || ''} onChange={e => updateClientData({ street: e.target.value })} className={fieldDefault} />
              </FieldCell>
              <FieldCell label="Nº" className="col-span-3">
                <input type="text" value={clientData.number || ''} onChange={e => updateClientData({ number: e.target.value })} className={`${fieldBase} text-slate-200 text-center focus:border-slate-700`} />
              </FieldCell>
              <FieldCell label="Bairro" className="col-span-12">
                <input type="text" value={clientData.neighborhood || ''} onChange={e => updateClientData({ neighborhood: e.target.value })} className={`${fieldBase} text-slate-500 focus:border-slate-800`} />
              </FieldCell>
            </div>
          </div>

          {/* ── Seção C: Rede Elétrica ─────────────────────── */}
          <div className="flex flex-col gap-3">
            <SectionHeader icon={<Zap size={9} />} label="Rede Elétrica" color="text-amber-500/50" />
            <div className="grid grid-cols-12 gap-2.5">
              <FieldCell label="Concessionária" className="col-span-7">
                <input type="text" value={clientData.concessionaire || ''} onChange={e => updateClientData({ concessionaire: e.target.value })} className={`${fieldBase} text-slate-300 focus:border-amber-500/40`} placeholder="Ex: CEMIG..." />
              </FieldCell>
              <FieldCell label="Tarifa (R$/kWh)" accent className="col-span-5">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-700 font-mono font-black text-[10px]">R$</span>
                  <input type="number" step="0.01" value={clientData.tariffRate || 0} onChange={e => updateClientData({ tariffRate: Number(e.target.value) })} className={`${fieldAccent} pl-8 text-right`} />
                </div>
              </FieldCell>
              <FieldCell label="Grupo de Consumo" className="col-span-6">
                <select value={clientData.rateGroup || ''} onChange={e => updateClientData({ rateGroup: (e.target.value || undefined) as any })} className={`${fieldBase} text-slate-300 focus:border-amber-500/40 text-[10px]`}>
                  <option value="">— Selecionar —</option>
                  {RATE_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </FieldCell>
              <FieldCell label="Ligação" className="col-span-6">
                <select value={clientData.connectionType || 'monofasico'} onChange={e => updateClientData({ connectionType: e.target.value as any })} className={`${fieldBase} text-white focus:border-amber-500/40 text-[10px]`}>
                  <option value="monofasico">MONOFÁSICO</option>
                  <option value="bifasico">BIFÁSICO</option>
                  <option value="trifasico">TRIFÁSICO</option>
                </select>
              </FieldCell>
            </div>
          </div>

          {/* ── Seção D: Premissas Estruturais ─────────────── */}
          <div className="flex flex-col gap-3">
            <SectionHeader icon={<Home size={9} />} label="Premissas Estruturais" color="text-slate-500/50" />
            <div className="grid grid-cols-12 gap-2.5">
              <FieldCell label="Tipo de Telhado" className="col-span-7">
                <select value={clientData.roofType || ''} onChange={e => updateClientData({ roofType: (e.target.value || undefined) as any })} className={`${fieldBase} text-slate-300 focus:border-slate-700`}>
                  <option value="">— Selecionar —</option>
                  {ROOF_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </FieldCell>
              <FieldCell label="Inclinação" className="col-span-5">
                <div className="relative">
                  <input type="number" min={0} max={60} step={1} value={clientData.roofInclination ?? 15} onChange={e => updateClientData({ roofInclination: Number(e.target.value) })} className={`${fieldBase} text-slate-300 pr-8 focus:border-slate-700`} />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 font-mono font-black text-[10px]">°</span>
                </div>
              </FieldCell>
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PAINEL DIREITO — Mapa + Instrumentação (60%)
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 lg:h-full flex flex-col min-h-[400px]">

        {/* ── Header do Mapa ─────────────────────────────── */}
        <PanelHeader 
          icon={<Navigation size={13} />} 
          label="Satélite" 
          secondary={
            <div className="flex items-center gap-3">
              {geocodeStatus !== 'idle' && (
                <span className={cn('text-[8px] font-black uppercase tracking-widest transition-colors', geocodeStatusColor)}>
                  · {geocodeStatusLabel}
                </span>
              )}
              <button
                onClick={handleGeocodeAddress}
                disabled={isGeocoding || (!clientData.street && (!clientData.zipCode || clientData.zipCode.length < 8))}
                className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-sm transition-all disabled:opacity-30 text-[10px] font-black uppercase tracking-widest font-mono"
              >
                {isGeocoding ? <Loader2 size={9} className="animate-spin" /> : <Search size={9} />}
                Localizar
              </button>
            </div>
          }
        />

        {/* ── Mapa Satelital ─────────────────────────────── */}
        <div className="flex-1 min-h-[260px] relative group select-none">
          <MapContainer center={mapCenter} zoom={clientData.lat ? 17 : 12} className="w-full h-full" zoomControl={false} attributionControl={false}>
            <TileLayer url={tileUrl} maxZoom={22} />
            <MapClickHandler onLocationSelect={handleMapClick} />
            <MapViewUpdater lat={activeLat} lng={activeLng} />
            {clientData.lat !== undefined && clientData.lat !== 0 && (
              <Marker position={[activeLat, activeLng]} icon={defaultIcon} />
            )}
          </MapContainer>

          {/* HUD de Telemetria (Geolocalização) */}
          <div className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-1 pointer-events-none">
            <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 px-2 py-1 rounded-sm flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[7px] text-slate-500 font-black uppercase tracking-tighter">Latitude</span>
                <span className="text-[10px] font-black text-slate-300 font-mono tabular-nums">{clientData.lat ? clientData.lat.toFixed(6) : '—'}</span>
              </div>
              <div className="w-px h-4 bg-slate-800" />
              <div className="flex flex-col">
                <span className="text-[7px] text-slate-500 font-black uppercase tracking-tighter">Longitude</span>
                <span className="text-[10px] font-black text-slate-300 font-mono tabular-nums">{clientData.lng ? clientData.lng.toFixed(6) : '—'}</span>
              </div>
            </div>
            {!clientData.lat && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-sm flex items-center gap-1.5 animate-pulse">
                <MapPin size={9} className="text-indigo-400" />
                <span className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">Aguardando Posição GNSS</span>
              </div>
            )}
          </div>

          {/* Controles de Zoom Customizados */}
          <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
            <button className="w-7 h-7 bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:bg-indigo-500/20 hover:border-indigo-500/40 text-slate-400 hover:text-indigo-400 transition-all flex items-center justify-center rounded-sm shadow-xl" onClick={() => {/* Map logic handled by leaflet internal state if bound or via ref */}}>
              <Plus size={14} />
            </button>
            <button className="w-7 h-7 bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:bg-indigo-500/20 hover:border-indigo-500/40 text-slate-400 hover:text-indigo-400 transition-all flex items-center justify-center rounded-sm shadow-xl" onClick={() => {/* Map logic */}}>
              <Minus size={14} />
            </button>
          </div>
        </div>

        <div className="shrink-0 flex flex-col lg:overflow-hidden overflow-y-auto">
          {/* ── Dashboard Metrológico ──────────────────────── */}
          <div className="p-3.5 flex flex-col gap-3.5">
            
            <div className="flex flex-col gap-3">
              <SectionHeader icon={<ThermometerSun size={11} />} label="Condições Climáticas e HSP" color="text-slate-400" />
              
              <div className="grid grid-cols-4 gap-2.5">
                <div className="flex flex-col items-center bg-slate-900/40 border-l-2 border-l-rose-500/40 border border-slate-800/80 rounded-sm py-2 px-1">
                  <span className={cn('text-[7px] font-black uppercase tracking-widest mb-0.5 flex items-center gap-0.5', isSyncing ? 'text-rose-500 animate-pulse' : 'text-slate-600')}>
                    T. Ambiente
                  </span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[13px] font-black text-white font-mono tabular-nums">{weatherData?.ambient_temp_avg ? weatherData.ambient_temp_avg.toFixed(1) : '—'}</span>
                    {weatherData?.ambient_temp_avg && <span className="text-[8px] text-slate-600">°C</span>}
                  </div>
                </div>

                <div className="flex flex-col items-center bg-slate-900/40 border-l-2 border-l-amber-500/40 border border-slate-800/80 rounded-sm py-2 px-1">
                  <span className={cn('text-[7px] font-black uppercase tracking-widest mb-0.5 flex items-center gap-0.5', isSyncing ? 'text-amber-500 animate-pulse' : 'text-slate-600')}>
                    HSP Méd. (DIA)
                  </span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[13px] font-black text-amber-400 font-mono tabular-nums">{weatherData?.hsp_avg ? weatherData.hsp_avg.toFixed(2) : '—'}</span>
                    {weatherData?.hsp_avg && <span className="text-[8px] text-slate-600 italic">HSP</span>}
                  </div>
                </div>

                <div className="flex flex-col items-center bg-slate-900/40 border border-slate-800/80 rounded-sm py-2 px-1">
                  <span className="text-[7px] text-slate-600 font-black uppercase tracking-widest mb-0.5">HSP ANUAL</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[13px] font-black text-slate-300 font-mono tabular-nums">{(hspAnual / 1000).toFixed(1)}</span>
                    <span className="text-[8px] text-slate-600">MWh</span>
                  </div>
                </div>

                <div className="flex flex-col items-center bg-slate-900/40 border-l-2 border-l-indigo-500/40 border border-slate-800/80 rounded-sm py-2 px-1">
                  <span className="text-[7px] text-indigo-400/70 font-black uppercase tracking-widest mb-0.5">PR Sugerido</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[13px] font-black text-indigo-400 font-mono tabular-nums">{(prSugerido * 100).toFixed(0)}</span>
                    <span className="text-[8px] text-slate-600">%</span>
                  </div>
                </div>
              </div>
            </div>

            {showInsights && (
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-sm p-3 flex flex-col gap-2 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-1 opacity-20">
                  <Lightbulb size={24} className="text-indigo-400" />
                </div>
                <div className="flex items-center gap-1.5 relative z-10">
                  <Sun size={10} className="text-indigo-400" />
                  <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Solar Tech Insight</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold leading-snug italic tracking-tight relative z-10 max-w-[90%]">
                  "{notaTecnica}"
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <SectionHeader icon={<Calendar size={11} />} label="Irradiância Mensal (Daily Avg)" color="text-slate-400" />
              <div className="grid grid-cols-6 gap-x-2 gap-y-3 bg-slate-950/40 p-2.5 rounded-sm border border-slate-800/50">
                {MONTH_LABELS.map((label, i) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[7px] text-slate-600 font-black uppercase tracking-tighter">{label}</span>
                    <span className={cn(
                      "text-[10px] font-mono font-black tabular-nums transition-colors",
                      hspMonthly[i] > 0 ? "text-amber-500/80" : "text-slate-800"
                    )}>
                      {hspMonthly[i] > 0 ? hspMonthly[i].toFixed(2) : "0.00"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
