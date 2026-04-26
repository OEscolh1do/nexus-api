import { 
  FileText, Navigation, ThermometerSun, MapPin, Loader2, Search, 
  Plus, Minus, Calendar, Sun, Lightbulb, Zap, Home, Edit2, Check
} from 'lucide-react';
import { useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useSolarStore } from '@/core/state/solarStore';
import { useCallback, useEffect, useState } from 'react';
import { MapCore } from '../../../components/MapCore';
import { fetchWeatherAnalysis } from '@/services/weatherService';
import { cn } from '@/lib/utils';
import { useGoogleGeocoding } from '../../../hooks/useGoogleGeocoding';
import { ProjectSiteMarker } from '../../../components/ProjectSiteMarker';

const MapClickHandler: React.FC<{ onLocationSelect: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
  useMapEvents({ click: (e) => onLocationSelect(e.latlng.lat, e.latlng.lng) });
  return null;
};

// ── Field primitives (Engineering UI High-Density) ─────────────────────────
const fieldBase = 'w-full bg-slate-950 border border-slate-800 rounded-sm px-2.5 py-1.5 text-[13px] font-mono outline-none transition-all placeholder:text-slate-600';
const fieldDefault = `${fieldBase} text-slate-200 focus:border-slate-700`;
const fieldAccent = `${fieldBase} text-indigo-300 font-bold focus:border-indigo-500/50`;

const FieldCell: React.FC<{ label: string; children: React.ReactNode; accent?: boolean; className?: string }> = ({
  label, children, accent = false, className
}) => (
  <div className={cn('flex flex-col gap-1', className)}>
    <label className={cn('text-[12px] font-black uppercase tracking-widest font-mono', accent ? 'text-indigo-400' : 'text-slate-400')}>
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

  // ── Geocoding & Reverse Geocoding (Hookified) ──────────────────────────
  const { isGeocoding, geocodeStatus, geocodeAddress, reverseGeocode, detectedAddress, setDetectedAddress } = useGoogleGeocoding();
  const [isEditingGeo, setIsEditingGeo] = useState(false);


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
        if (!data.erro) updateClientData({ street: data.logradouro || clientData.street, neighborhood: data.bairro || clientData.neighborhood, city: data.localidade || clientData.city, state: data.uf || clientData.state });
      } catch (e) { console.error('ViaCEP Error:', e); }
    }
  };

  const handleMapClick = useCallback((newLat: number, newLng: number) => {
    updateClientData({ lat: parseFloat(newLat.toFixed(6)), lng: parseFloat(newLng.toFixed(6)) });
    // Removido reverseGeocode automático a pedido do usuário
  }, [updateClientData]);

  // ── Derived values ─────────────────────────────────────────────────────
  const activeLat = (clientData.lat !== undefined && !isNaN(clientData.lat)) ? clientData.lat : -3.1316;
  const activeLng = (clientData.lng !== undefined && !isNaN(clientData.lng)) ? clientData.lng : -60.0233;
  const mapCenter: [number, number] = [activeLat, activeLng];

  const hspMonthly = clientData.monthlyIrradiation ?? Array(12).fill(0);

  const geocodeStatusColor = { searching: 'text-slate-400 animate-pulse', success: 'text-emerald-400', partial: 'text-amber-400', error: 'text-rose-400', idle: 'text-transparent' }[geocodeStatus as string] || 'text-transparent';
  const geocodeStatusLabel = { searching: 'Buscando...', success: 'Localização exata', partial: 'Aproximação', error: 'Não encontrado', idle: '' }[geocodeStatus as string] || '';

  // ── Solar Tech Insight & PR Sugerido ───────────────────────────────────
  const hspAnual = hspMonthly.reduce((a, b) => a + b, 0);
  const hspMed   = hspAnual / 12;
  const isSulSudeste = ['RS', 'SC', 'PR', 'SP', 'RJ', 'MG', 'ES'].includes(clientData.state || '');
  
  // Base PR based on region
  let prSugerido = isSulSudeste ? 0.82 : 0.80;
  
  // Apply Azimuth Penalty (South facing roofs lose PR)
  const azimuth = clientData.azimuth ?? 0;
  let azimuthText = "Boa orientação solar";
  if (azimuth >= 135 && azimuth <= 225) {
     prSugerido -= 0.15; // Sul
     azimuthText = "Penalidade Severa (Face Sul)";
  } else if ((azimuth > 90 && azimuth < 135) || (azimuth > 225 && azimuth < 270)) {
     prSugerido -= 0.05; // Sudeste / Sudoeste
     azimuthText = "Penalidade Moderada (Leste/Oeste com viés Sul)";
  } else if (azimuth > 45 && azimuth <= 90) {
     prSugerido -= 0.02; // Leste
     azimuthText = "Orientação Leste (Viável)";
  } else if (azimuth >= 270 && azimuth <= 315) {
     prSugerido -= 0.02; // Oeste
     azimuthText = "Orientação Oeste (Viável)";
  }
  
  const notaTecnica = hspMed > 5.0 
    ? `Irradiância alta (>5.0). ${azimuthText}. Priorizar inversores de alta eficiência.`
    : `Fluxo solar moderado. ${azimuthText}.`;

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
                <input type="text" value={clientData.projectName || ''} onChange={e => updateClientData({ projectName: e.target.value })} className={fieldDefault} placeholder="Fase 1" />
              </FieldCell>
            </div>
          </div>

          {/* ── Seção B: Endereço ───────────────────────────── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
              <SectionHeader icon={<MapPin size={9} />} label="Endereço de Instalação" />
              <button
                onClick={() => geocodeAddress()}
                disabled={isGeocoding || (!clientData.street && (!clientData.zipCode || clientData.zipCode.length < 8))}
                className="flex items-center gap-2 px-3 py-1 bg-indigo-500 hover:bg-indigo-400 text-slate-950 rounded-sm transition-all disabled:opacity-30 text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-indigo-500/20"
              >
                {isGeocoding ? <Loader2 size={10} className="animate-spin" /> : <Search size={10} />}
                Buscar no Mapa
              </button>
            </div>
            <div className="grid grid-cols-12 gap-2.5">
              <FieldCell label="CEP *" className="col-span-5" accent>
                <input type="text" value={clientData.zipCode || ''} onChange={e => handleZipCodeChange(e.target.value)} className={fieldAccent} placeholder="00000-000" maxLength={9} />
              </FieldCell>
              <FieldCell label="UF" className="col-span-2">
                <input type="text" value={clientData.state || ''} onChange={e => updateClientData({ state: e.target.value.toUpperCase() })} maxLength={2} className={`${fieldBase} text-indigo-200 font-black text-center focus:border-indigo-500/50`} />
              </FieldCell>
              <FieldCell label="Cidade *" className="col-span-5">
                <input type="text" value={clientData.city || ''} onChange={e => updateClientData({ city: e.target.value })} className={fieldDefault} />
              </FieldCell>
              <FieldCell label="Logradouro" className="col-span-9">
                <input type="text" value={clientData.street || ''} onChange={e => updateClientData({ street: e.target.value })} className={fieldDefault} />
              </FieldCell>
              <FieldCell label="Nº" className="col-span-3">
                <input type="text" value={clientData.number || ''} onChange={e => updateClientData({ number: e.target.value })} className={`${fieldBase} text-slate-100 text-center focus:border-slate-700`} />
              </FieldCell>
              <FieldCell label="Bairro" className="col-span-12">
                <input type="text" value={clientData.neighborhood || ''} onChange={e => updateClientData({ neighborhood: e.target.value })} className={fieldDefault} />
              </FieldCell>

            </div>
          </div>

          {/* ── Seção C: Rede Elétrica ─────────────────────── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
              <SectionHeader icon={<Zap size={9} />} label="Rede Elétrica" color="text-amber-500/50" />
            </div>
            <div className="grid grid-cols-12 gap-2.5">
              <FieldCell label="Concessionária" className="col-span-7">
                <input type="text" value={clientData.concessionaire || ''} onChange={e => updateClientData({ concessionaire: e.target.value })} className={`${fieldBase} text-slate-300 focus:border-amber-500/40`} placeholder="Ex: CEMIG..." />
              </FieldCell>
              <FieldCell label="Tarifa Global (R$/kWh)" accent className="col-span-5">
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
            
            {/* Detalhamento Tarifário (Lei 14.300) - Progressive Disclosure style, but always visible inside an outlined box to preserve space while maintaining density */}
            <div className="mt-1 p-2.5 bg-slate-900/50 border border-slate-800/80 rounded-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap size={10} className="text-amber-500/70" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Detalhamento Regulatório (14.300)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <FieldCell label="TE" className="col-span-1">
                  <input type="number" step="0.001" value={clientData.tariffTE || ''} onChange={e => updateClientData({ tariffTE: Number(e.target.value) })} className={`${fieldBase} text-right text-slate-300 focus:border-amber-500/40`} placeholder="0.000" />
                </FieldCell>
                <FieldCell label="TUSD" className="col-span-1">
                  <input type="number" step="0.001" value={clientData.tariffTUSD || ''} onChange={e => updateClientData({ tariffTUSD: Number(e.target.value) })} className={`${fieldBase} text-right text-slate-300 focus:border-amber-500/40`} placeholder="0.000" />
                </FieldCell>
                <FieldCell label="Fio B" className="col-span-1">
                  <input type="number" step="0.001" value={clientData.tariffFioB || ''} onChange={e => updateClientData({ tariffFioB: Number(e.target.value) })} className={`${fieldBase} text-right text-amber-400 font-bold focus:border-amber-500`} placeholder="0.000" />
                </FieldCell>
              </div>
            </div>
          </div>

          {/* ── Seção D: Premissas Estruturais ─────────────── */}
          <div className="flex flex-col gap-3">
            <SectionHeader icon={<Home size={9} />} label="Premissas Estruturais" color="text-slate-500/50" />
            <div className="grid grid-cols-12 gap-2.5">
              <FieldCell label="Tipo de Telhado" className="col-span-12">
                <select value={clientData.roofType || ''} onChange={e => updateClientData({ roofType: (e.target.value || undefined) as any })} className={`${fieldBase} text-slate-300 focus:border-slate-700`}>
                  <option value="">— Selecionar —</option>
                  {ROOF_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </FieldCell>
              <FieldCell label="Inclinação" className="col-span-4">
                <div className="relative">
                  <input type="number" min={0} max={60} step={1} value={clientData.roofInclination ?? 15} onChange={e => updateClientData({ roofInclination: Number(e.target.value) })} className={`${fieldBase} text-slate-300 pr-8 focus:border-slate-700`} />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 font-mono font-black text-[10px]">°</span>
                </div>
              </FieldCell>
              <FieldCell label="Azimute (Orientação)" className="col-span-8">
                <select value={clientData.azimuth ?? 0} onChange={e => updateClientData({ azimuth: Number(e.target.value) })} className={`${fieldBase} text-indigo-300 font-bold focus:border-indigo-500`}>
                  {AZIMUTH_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
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
            </div>
          }
        />

        {/* ── Mapa Satelital ─────────────────────────────── */}
        <div className="flex-1 min-h-[260px] relative group select-none">
          <MapCore 
            activeTool="SELECT" 
            center={mapCenter} 
            zoom={clientData.lat ? 17 : 12} 
            showLayers={false}
            variant="EXPLORATION"
          >
            <MapClickHandler onLocationSelect={handleMapClick} />
            <ProjectSiteMarker />
          </MapCore>

          {/* HUD de Telemetria (Geolocalização Interativa) */}
          <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1 pointer-events-auto">
            <div className="flex flex-col gap-1">
              <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 px-2 py-1.5 rounded-sm flex items-center gap-3 shadow-2xl">
                <div className="flex flex-col">
                  <span className="text-[7px] text-slate-500 font-black uppercase tracking-tighter">Latitude</span>
                  {!isEditingGeo ? (
                    <span className="w-20 bg-transparent text-[10px] font-black text-slate-300 font-mono tabular-nums px-1 py-0.5">
                      {clientData.lat !== undefined && !isNaN(clientData.lat) ? clientData.lat.toFixed(6) : '—'}
                    </span>
                  ) : (
                    <input 
                      type="number" 
                      step="0.000001"
                      autoFocus
                      value={typeof clientData.lat === 'number' && !isNaN(clientData.lat) ? clientData.lat : ''} 
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '') updateClientData({ lat: undefined });
                        else {
                          const num = parseFloat(val);
                          updateClientData({ lat: isNaN(num) ? undefined : num });
                        }
                      }}
                      className="w-20 bg-slate-900 border border-indigo-500/30 text-[10px] font-black text-indigo-400 font-mono tabular-nums outline-none focus:border-indigo-500 transition-all px-1 py-0.5"
                    />
                  )}
                </div>
                <div className="w-px h-4 bg-slate-800" />
                <div className="flex flex-col">
                  <span className="text-[7px] text-slate-500 font-black uppercase tracking-tighter">Longitude</span>
                  {!isEditingGeo ? (
                    <span className="w-20 bg-transparent text-[10px] font-black text-slate-300 font-mono tabular-nums px-1 py-0.5">
                      {clientData.lng !== undefined && !isNaN(clientData.lng) ? clientData.lng.toFixed(6) : '—'}
                    </span>
                  ) : (
                    <input 
                      type="number" 
                      step="0.000001"
                      value={typeof clientData.lng === 'number' && !isNaN(clientData.lng) ? clientData.lng : ''} 
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '') updateClientData({ lng: undefined });
                        else {
                          const num = parseFloat(val);
                          updateClientData({ lng: isNaN(num) ? undefined : num });
                        }
                      }}
                      className="w-20 bg-slate-900 border border-indigo-500/30 text-[10px] font-black text-indigo-400 font-mono tabular-nums outline-none focus:border-indigo-500 transition-all px-1 py-0.5"
                    />
                  )}
                </div>
                
                <div className="w-px h-4 bg-slate-800" />
                
                <button 
                  onClick={() => setIsEditingGeo(!isEditingGeo)}
                  className={cn(
                    "p-1 rounded-sm transition-all border",
                    isEditingGeo 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" 
                      : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20"
                  )}
                  title={isEditingGeo ? "Salvar" : "Editar"}
                >
                  {isEditingGeo ? <Check size={12} /> : <Edit2 size={12} />}
                </button>
              </div>

              {detectedAddress && (
                <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 p-2 rounded-sm flex flex-col gap-1.5 shadow-2xl max-w-[280px] animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="flex items-center gap-2">
                    <MapPin size={10} className="text-indigo-400" />
                    <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest">Endereço Detectado</span>
                  </div>
                  <p className="text-[9px] text-slate-300 font-medium leading-relaxed px-0.5">
                    {detectedAddress}
                  </p>
                  <button 
                    onClick={() => reverseGeocode(clientData.lat!, clientData.lng!, false)}
                    className="mt-1 flex items-center justify-center gap-1.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded-sm transition-all"
                  >
                    <Zap size={9} /> Aplicar ao Projeto
                  </button>
                </div>
              )}
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
