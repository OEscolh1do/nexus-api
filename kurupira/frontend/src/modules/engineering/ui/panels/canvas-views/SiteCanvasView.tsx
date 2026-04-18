import { 
  ThermometerSun, Sunrise, 
  Navigation, Zap,
  Search, Loader2, FileText
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSolarStore } from '@/core/state/solarStore';
import { useCallback, useEffect, useState } from 'react';
import { fetchWeatherAnalysis } from '@/services/weatherService';

// Fix default marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Map Utilities
const MapClickHandler: React.FC<{ onLocationSelect: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
  useMapEvents({ click: (e) => onLocationSelect(e.latlng.lat, e.latlng.lng) });
  return null;
};

const MapViewUpdater: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat !== 0 && lng !== 0) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.8 });
    }
  }, [lat, lng, map]);
  return null;
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const tileUrl = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

/**
 * SITE CANVAS VIEW — Identificação e Contexto Geográfico
 */
export const SiteCanvasView: React.FC = () => {
    const clientData = useSolarStore(s => s.clientData);
    const weatherData = useSolarStore(s => s.weatherData);
    const updateClientData = useSolarStore(s => s.updateClientData);
    const setWeatherData = useSolarStore(s => s.setWeatherData);
    const setIrradiationData = useSolarStore(s => s.setIrradiationData);
    
    // ─── GEOPOSICIONAMENTO DINÂMICO ───
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'searching' | 'success' | 'partial' | 'error'>('idle');

    const handleGeocodeAddress = async () => {
        const { street, number, neighborhood, city, state, zipCode } = clientData;
        
        const hasMinAddress = (street && city) || (zipCode && zipCode.length >= 8);
        if (!hasMinAddress) return;

        setIsGeocoding(true);
        setGeocodeStatus('searching');
        
        try {
            // Estratégia de Busca Iterativa (Variants)
            const variants = [
                { type: 'success', query: [street, number, neighborhood, city, state, 'Brasil'].filter(Boolean).join(', ') },
                { type: 'partial', query: [street, city, state, 'Brasil'].filter(Boolean).join(', ') },
                { type: 'partial', query: [zipCode, 'Brasil'].filter(Boolean).join(', ') },
                { type: 'partial', query: [city, state, 'Brasil'].filter(Boolean).join(', ') }
            ].filter(v => v.query.length > 8); // Evita queries muito curtas/vazias

            let finalCoords: { lat: number; lng: number } | null = null;
            let finalType: typeof geocodeStatus = 'error';

            for (const variant of variants) {
                const query = variant.query.replace(/\s+/g, ' ').trim();
                let coords: { lat: number; lng: number } | null = null;

                if (MAPBOX_TOKEN) {
                    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=BR&limit=1&types=address,postcode,place`;
                    const resp = await fetch(endpoint);
                    const data = await resp.json();
                    if (data.features && data.features.length > 0) {
                        const [lng, lat] = data.features[0].center;
                        coords = { lat, lng };
                    }
                } else {
                    const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
                    const resp = await fetch(endpoint, { headers: { 'Accept-Language': 'pt-BR' } });
                    const data = await resp.json();
                    if (data && data.length > 0) {
                        coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                    }
                }

                if (coords) {
                    finalCoords = coords;
                    finalType = variant.type as any;
                    break; // Sucesso em um dos níveis
                }
            }

            if (finalCoords) {
                updateClientData({ 
                    lat: parseFloat(finalCoords.lat.toFixed(6)), 
                    lng: parseFloat(finalCoords.lng.toFixed(6)) 
                });
                setGeocodeStatus(finalType);
            } else {
                setGeocodeStatus('error');
            }
        } catch (err) {
            console.error("SITE_GEOC_ERROR:", err);
            setGeocodeStatus('error');
        } finally {
            setIsGeocoding(false);
            // Limpa o status após 4 segundos para não poluir a UI
            setTimeout(() => setGeocodeStatus('idle'), 4000);
        }
    };
    
    // ─── SINCRONIZAÇÃO CLIMÁTICA REATIVA ───
    const [isSyncing, setIsSyncing] = useState(false);

    const syncClimateData = useCallback(async () => {
        if (!clientData.lat || !clientData.lng || !clientData.city) return;
        
        setIsSyncing(true);
        try {
            const data = await fetchWeatherAnalysis(
                clientData.lat,
                clientData.lng,
                clientData.city,
                clientData.state
            );
            setWeatherData(data);
            setIrradiationData(data.hsp_monthly, data.irradiation_source);
        } catch (err) {
            console.error("Erro na sincronização climática:", err);
        } finally {
            setIsSyncing(false);
        }
    }, [clientData.lat, clientData.lng, clientData.city, clientData.state, setWeatherData, setIrradiationData]);

    useEffect(() => {
        const timer = setTimeout(() => {
            syncClimateData();
        }, 800);
        return () => clearTimeout(timer);
    }, [clientData.lat, clientData.lng, clientData.city, clientData.state, syncClimateData]);
    
    const handleZipCodeChange = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        updateClientData({ zipCode: cleanCep });
        
        if (cleanCep.length === 8) {
            try {
                const resp = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await resp.json();
                if (!data.erro) {
                    updateClientData({
                        street: data.logradouro || clientData.street,
                        neighborhood: data.bairro || clientData.neighborhood,
                        city: data.localidade || clientData.city,
                        state: data.uf || clientData.state
                    });
                }
            } catch (e) {
                console.error('ViaCEP Fetch Error:', e);
            }
        }
    };

    const handleMapClick = useCallback((newLat: number, newLng: number) => {
        updateClientData({ 
            lat: parseFloat(newLat.toFixed(6)), 
            lng: parseFloat(newLng.toFixed(6)) 
        });
    }, [updateClientData]);

    const activeLat = clientData.lat ?? -3.1316;
    const activeLng = clientData.lng ?? -60.0233;
    const mapCenter: [number, number] = [activeLat, activeLng];

    return (
        <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden font-sans">
            
            {/* ── CORPO DASHBOARD ────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
                    
                    {/* COLUNA ESQUERDA: FORMULÁRIOS TÉCNICOS */}
                    <div className="lg:col-span-6 space-y-6">
                        
                        {/* 1. Card de Identificação e Localização */}
                        <div className="space-y-2">
                            <div className="flex items-center ml-1">
                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                                    <FileText size={12} className="text-indigo-500" /> Dados Gerais do Projeto
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-3 p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-sm shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rotate-45 translate-x-16 -translate-y-16 pointer-events-none" />
                                
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                    <div className="sm:col-span-4 space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase">Cliente *</label>
                                        <input 
                                            type="text" 
                                            value={clientData.clientName || ''}
                                            onChange={e => updateClientData({ clientName: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-1.5 text-xs text-white focus:border-indigo-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="sm:col-span-4 space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase">Título do Projeto</label>
                                        <input 
                                            type="text" 
                                            value={clientData.projectName || ''}
                                            onChange={e => updateClientData({ projectName: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-1.5 text-xs text-slate-400 font-mono outline-none focus:border-indigo-500/50"
                                        />
                                    </div>
                                    <div className="sm:col-span-4 space-y-1">
                                        <label className="text-[9px] font-bold text-indigo-500/50 uppercase">CEP *</label>
                                        <input 
                                            type="text" 
                                            value={clientData.zipCode || ''}
                                            onChange={e => handleZipCodeChange(e.target.value)}
                                            className="w-full bg-slate-950 border border-indigo-900/40 rounded-sm px-3 py-1.5 text-xs text-indigo-400 font-mono font-bold text-center outline-none focus:border-indigo-500"
                                            placeholder="00000-000"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                    <div className="sm:col-span-8 space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase">Logradouro / Endereço</label>
                                        <input 
                                            type="text" 
                                            value={clientData.street || ''}
                                            onChange={e => updateClientData({ street: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-slate-700"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase text-center block">Nº</label>
                                        <input 
                                            type="text" 
                                            value={clientData.number || ''}
                                            onChange={e => updateClientData({ number: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-1.5 text-xs text-white text-center font-mono outline-none focus:border-slate-700"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase text-center block">UF</label>
                                        <input 
                                            type="text" 
                                            value={clientData.state || ''}
                                            onChange={e => updateClientData({ state: e.target.value.toUpperCase() })}
                                            maxLength={2}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-1.5 text-xs text-indigo-500 font-black text-center outline-none focus:border-indigo-900/40"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                    <div className="sm:col-span-6 space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase">Bairro</label>
                                        <input 
                                            type="text" 
                                            value={clientData.neighborhood || ''}
                                            onChange={e => updateClientData({ neighborhood: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-1.5 text-xs text-slate-500 outline-none focus:border-slate-800"
                                        />
                                    </div>
                                    <div className="sm:col-span-6 space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase">Cidade *</label>
                                        <input 
                                            type="text" 
                                            value={clientData.city || ''}
                                            onChange={e => updateClientData({ city: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-1.5 text-xs text-slate-400 outline-none focus:border-slate-800"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Configuração Elétrica */}
                        <div className="space-y-2">
                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1 flex items-center gap-2">
                                <Zap size={12} className="text-amber-500" /> Configuração Elétrica
                            </span>
                            <div className="p-5 bg-slate-900 border border-slate-800 rounded-sm shadow-xl">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Tipo de Ligação</label>
                                        <select 
                                            value={clientData.connectionType || 'monofasico'}
                                            onChange={e => updateClientData({ connectionType: e.target.value as any })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                                        >
                                            <option value="monofasico">MONOFÁSICO</option>
                                            <option value="bifasico">BIFÁSICO</option>
                                            <option value="trifasico">TRIFÁSICO</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Tarifa Final (R$/kWh)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 font-mono font-bold text-[10px]">R$</span>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                value={clientData.tariffRate || 0}
                                                onChange={e => updateClientData({ tariffRate: Number(e.target.value) })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-sm pl-8 pr-3 py-2 text-xs text-indigo-400 font-mono font-bold focus:border-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUNA DIREITA: MAPA E CLIMA */}
                    <div className="lg:col-span-6 space-y-6">
                        
                        {/* 3. Visualizador de Satélite */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1 relative">
                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                                    <Navigation size={12} className="text-indigo-500" /> Visualizador de Satélite
                                </span>
                                {/* Botão Localizar — ao lado do mapa */}
                                <button
                                    onClick={handleGeocodeAddress}
                                    disabled={isGeocoding || (!clientData.street && (!clientData.zipCode || clientData.zipCode.length < 8))}
                                    title="Localizar endereço no mapa"
                                    className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-sm transition-all disabled:opacity-30 group"
                                >
                                    {isGeocoding ? (
                                        <Loader2 size={10} className="animate-spin text-indigo-300" />
                                    ) : (
                                        <Search size={10} className="group-hover:scale-110 transition-transform" />
                                    )}
                                    <span className="text-[8px] font-black uppercase tracking-widest">Localizar no Mapa</span>
                                </button>
                                {/* Status de geocodificação */}
                                {geocodeStatus !== 'idle' && (
                                    <div className={`absolute -bottom-4 right-0 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-300 ${
                                        geocodeStatus === 'searching' ? 'text-slate-500 animate-pulse' :
                                        geocodeStatus === 'success' ? 'text-emerald-500' :
                                        geocodeStatus === 'partial' ? 'text-amber-500' :
                                        'text-rose-500'
                                    }`}>
                                        <div className={`w-1 h-1 rounded-full ${
                                            geocodeStatus === 'searching' ? 'bg-slate-500' :
                                            geocodeStatus === 'success' ? 'bg-emerald-500' :
                                            geocodeStatus === 'partial' ? 'bg-amber-500' :
                                            'bg-rose-500'
                                        }`} />
                                        <span className="text-[7px] font-black uppercase tracking-widest whitespace-nowrap">
                                            {geocodeStatus === 'searching' && 'Buscando variantes...'}
                                            {geocodeStatus === 'success' && 'Localização Exata'}
                                            {geocodeStatus === 'partial' && 'Aproximação'}
                                            {geocodeStatus === 'error' && 'Não encontrado'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-sm shadow-2xl relative overflow-hidden group">
                                <div className="h-[280px] sm:h-[420px] w-full relative">
                                    <MapContainer
                                        center={mapCenter}
                                        zoom={clientData.lat ? 18 : 12}
                                        className="w-full h-full grayscale-[0.2] contrast-[1.1] brightness-[0.9]"
                                        zoomControl={false}
                                        attributionControl={false}
                                    >
                                        <TileLayer url={tileUrl} maxZoom={22} />
                                        <MapClickHandler onLocationSelect={handleMapClick} />
                                        <MapViewUpdater lat={activeLat} lng={activeLng} />
                                        {clientData.lat !== undefined && clientData.lat !== 0 && (
                                            <Marker position={[activeLat, activeLng]} icon={defaultIcon} />
                                        )}
                                    </MapContainer>
                                </div>
                            </div>
                        </div>
                        
                        {/* 4. Instrumentação do Local */}
                        <div className="space-y-2">
                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1 flex items-center gap-2">
                                <ThermometerSun size={12} className="text-rose-500" /> Instrumentação do Local
                            </span>
                            <div className="bg-slate-900 border border-slate-800 rounded-sm p-4 sm:p-5 space-y-4 shadow-xl">
                                
                                {/* Coordenadas HUD */}
                                <div className="grid grid-cols-2 gap-px bg-slate-800 border border-slate-800 rounded-sm overflow-hidden">
                                    <div className="bg-slate-950 p-2 flex flex-col items-center">
                                        <span className="text-[6px] text-slate-500 font-bold uppercase tracking-widest">Latitude</span>
                                        <span className="text-[10px] font-black text-white font-mono tabular-nums">{clientData.lat ? clientData.lat.toFixed(6) : "00.000000"}</span>
                                    </div>
                                    <div className="bg-slate-950 p-2 flex flex-col items-center">
                                        <span className="text-[6px] text-slate-500 font-bold uppercase tracking-widest">Longitude</span>
                                        <span className="text-[10px] font-black text-white font-mono tabular-nums">{clientData.lng ? clientData.lng.toFixed(6) : "00.000000"}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex items-center justify-between p-3 bg-slate-950 border border-l-2 border-rose-500 border-slate-800/60 rounded-sm">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                                                <ThermometerSun size={8} className={`text-rose-500 ${isSyncing ? 'animate-pulse' : ''}`} /> T. Ambient
                                            </span>
                                            <div className="flex items-baseline gap-0.5 mt-0.5">
                                                <span className="text-lg font-black text-white font-mono tabular-nums">
                                                    {weatherData?.ambient_temp_avg ? weatherData.ambient_temp_avg.toFixed(1) : "—"}
                                                </span>
                                                <span className="text-[8px] font-bold text-slate-600">°C</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-slate-950 border border-l-2 border-amber-500 border-slate-800/60 rounded-sm">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                                                <Sunrise size={8} className={`text-amber-500 ${isSyncing ? 'animate-pulse' : ''}`} /> HSP Est.
                                            </span>
                                            <div className="flex items-baseline gap-0.5 mt-0.5">
                                                <span className="text-lg font-black text-amber-500 font-mono tabular-nums">
                                                    {weatherData?.hsp_avg ? weatherData.hsp_avg.toFixed(2) : "—"}
                                                </span>
                                                <span className="text-[7px] font-bold text-slate-600">kWh/m²</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
