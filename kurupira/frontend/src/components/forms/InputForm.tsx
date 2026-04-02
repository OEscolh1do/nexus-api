/**
 * INPUT FORM - Com Dados Climaticos Integrados
 * Refatorado: Busca HSP/Clima automaticamente ao definir localizacao
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InputData, WeatherAnalysis } from '@/core/types';
import { fetchWeatherAnalysis } from '@/services/weatherService';
import html2canvas from 'html2canvas';
import {
  MapPin, Navigation, Search, Loader2, Layers, PencilRuler, Eraser,
  Crosshair, Sun, CloudSun, Home, Zap, TrendingDown, Users
} from 'lucide-react';
import {
  DenseFormGrid, DenseCard, DenseInput, DenseSelect, DenseStat, DenseButton
} from '@/components/ui/dense-form';

interface Props {
  initialData: InputData;
  onSubmit: (data: InputData, weather?: WeatherAnalysis) => void;
}

declare const L: any;

const ORIENTATION_OPTIONS = [
  { value: 'Norte', label: 'Norte (Máximo)' },
  { value: 'Nordeste', label: 'Nordeste' },
  { value: 'Noroeste', label: 'Noroeste' },
  { value: 'Leste', label: 'Leste' },
  { value: 'Oeste', label: 'Oeste' },
  { value: 'Sul', label: 'Sul (Mínimo)' },
];

const ROOF_TYPE_OPTIONS = [
  { value: 'ceramica', label: 'Cerâmica (Barro)' },
  { value: 'metalico', label: 'Metálico (Galvanizado/Sanduíche)' },
  { value: 'fibrocimento', label: 'Fibrocimento (Brasilit)' },
  { value: 'laje', label: 'Laje Plana (Concreto)' },
  { value: 'outro', label: 'Outro' },
];

const CONNECTION_TYPE_OPTIONS = [
  { value: 'monofasico', label: 'Monofásico (1F)' },
  { value: 'bifasico', label: 'Bifásico (2F)' },
  { value: 'trifasico', label: 'Trifásico (3F)' },
];

const STATE_OPTIONS = [
  { value: 'AC', label: 'AC' }, { value: 'AL', label: 'AL' }, { value: 'AP', label: 'AP' },
  { value: 'AM', label: 'AM' }, { value: 'BA', label: 'BA' }, { value: 'CE', label: 'CE' },
  { value: 'DF', label: 'DF' }, { value: 'ES', label: 'ES' }, { value: 'GO', label: 'GO' },
  { value: 'MA', label: 'MA' }, { value: 'MT', label: 'MT' }, { value: 'MS', label: 'MS' },
  { value: 'MG', label: 'MG' }, { value: 'PA', label: 'PA' }, { value: 'PB', label: 'PB' },
  { value: 'PR', label: 'PR' }, { value: 'PE', label: 'PE' }, { value: 'PI', label: 'PI' },
  { value: 'RJ', label: 'RJ' }, { value: 'RN', label: 'RN' }, { value: 'RS', label: 'RS' },
  { value: 'RO', label: 'RO' }, { value: 'RR', label: 'RR' }, { value: 'SC', label: 'SC' },
  { value: 'SP', label: 'SP' }, { value: 'SE', label: 'SE' }, { value: 'TO', label: 'TO' },
];

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const InputForm: React.FC<Props> = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState<InputData>(initialData);
  const [isLocating, setIsLocating] = useState(false);
  const [addressSearch, setAddressSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapMode, setMapMode] = useState<'streets' | 'hybrid'>('hybrid');
  
  // Weather State
  const [weatherData, setWeatherData] = useState<WeatherAnalysis | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const mapContainerId = "map-selector-container";

  // Fetch Weather quando lat/lng/city/state mudam
  const fetchWeather = useCallback(async () => {
    if (!formData.lat || !formData.lng || !formData.city || !formData.state) return;
    
    setIsLoadingWeather(true);
    setWeatherError(null);
    
    try {
      const apiKey = (import.meta as any).env?.VITE_GOOGLE_AI_API_KEY || '';
      const data = await fetchWeatherAnalysis(
        formData.lat,
        formData.lng,
        formData.city,
        formData.state,
        apiKey
      );
      setWeatherData(data);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setWeatherError('Falha ao buscar dados climaticos');
    } finally {
      setIsLoadingWeather(false);
    }
  }, [formData.lat, formData.lng, formData.city, formData.state]);

  // Debounce weather fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.lat && formData.lng && formData.city) {
        fetchWeather();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData.lat, formData.lng, formData.city, formData.state, fetchWeather]);

  // Geocoding
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data?.address) {
        const addr = data.address;
        setFormData(prev => ({
          ...prev,
          street: addr.road || addr.pedestrian || addr.suburb || prev.street,
          neighborhood: addr.neighbourhood || addr.suburb || addr.village || prev.neighborhood,
          city: addr.city || addr.town || addr.village || prev.city,
          state: (addr.state_code || (addr.state?.length === 2 ? addr.state : 'PA')).toUpperCase()
        }));
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  // Area Calculation
  const calculateArea = (layer: any) => {
    try {
      let latlngs = layer.getLatLngs();
      if (Array.isArray(latlngs[0])) latlngs = latlngs[0];
      const radius = 6378137;
      let area = 0;
      const coords = latlngs.map((ll: any) => ({
        x: (ll.lng * Math.PI * radius * Math.cos(ll.lat * Math.PI / 180)) / 180,
        y: (ll.lat * Math.PI * radius) / 180
      }));
      for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
        area += (coords[j].x + coords[i].x) * (coords[j].y - coords[i].y);
      }
      const finalArea = Math.abs(area / 2);
      setFormData(prev => ({ ...prev, availableArea: Math.round(finalArea) }));
    } catch (e) {
      console.error("Erro ao calcular area:", e);
    }
  };

  // Location Update
  const updateLocation = (lat: number, lng: number, updateMap = false, shouldReverse = true) => {
    setFormData(prev => ({ ...prev, lat, lng }));
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    if (updateMap && mapRef.current) mapRef.current.setView([lat, lng], 20);
    if (shouldReverse) reverseGeocode(lat, lng);
  };

  // Map Initialization
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerId, {
        zoomControl: false,
        attributionControl: false,
        maxZoom: 22
      }).setView([formData.lat || -6.0673, formData.lng || -49.9022], 19);

      const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 22, maxNativeZoom: 19 });
      const hybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 22, maxNativeZoom: 20 });
      hybrid.addTo(mapRef.current);

      markerRef.current = L.marker([formData.lat || -6.0673, formData.lng || -49.9022], {
        draggable: true,
        icon: L.divIcon({
          className: 'bg-none',
          html: `<div class="w-8 h-8 bg-neonorte-purple rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        })
      }).addTo(mapRef.current);

      mapRef.current.on('click', (e: any) => {
        if (!mapRef.current.pm.globalDrawModeEnabled()) updateLocation(e.latlng.lat, e.latlng.lng);
      });

      markerRef.current.on('dragend', (e: any) => updateLocation(e.target.getLatLng().lat, e.target.getLatLng().lng));

      mapRef.current.pm.setGlobalOptions({
        pathOptions: { color: '#05CD46', fillColor: '#05CD46', fillOpacity: 0.4, weight: 2, dashArray: '4, 4' }
      });

      mapRef.current.on('pm:create', (e: any) => {
        const layer = e.layer;
        if (layerRef.current) mapRef.current.removeLayer(layerRef.current);
        layerRef.current = layer;
        calculateArea(layer);
        layer.on('pm:edit', () => calculateArea(layer));
        layer.on('pm:remove', () => {
          setFormData(prev => ({ ...prev, availableArea: 0 }));
          layerRef.current = null;
        });
      });

      mapRef.current._streets = streets;
      mapRef.current._hybrid = hybrid;
    }
  }, []);

  // Map Controls
  const toggleMapMode = () => {
    const nextMode = mapMode === 'streets' ? 'hybrid' : 'streets';
    setMapMode(nextMode);
    if (nextMode === 'streets') {
      mapRef.current.removeLayer(mapRef.current._hybrid);
      mapRef.current._streets.addTo(mapRef.current);
    } else {
      mapRef.current.removeLayer(mapRef.current._streets);
      mapRef.current._hybrid.addTo(mapRef.current);
    }
  };

  const handleStartDraw = () => {
    mapRef.current.pm.enableDraw('Polygon', { snappable: true, snapDistance: 20, finishOn: 'dblclick' });
  };

  const handleClearDraw = () => {
    if (layerRef.current) mapRef.current.removeLayer(layerRef.current);
    mapRef.current.pm.getGeomanLayers().forEach((l: any) => mapRef.current.removeLayer(l));
    setFormData(prev => ({ ...prev, availableArea: 0 }));
    layerRef.current = null;
  };

  // Search & GPS
  const handleSearchAddress = async () => {
    if (!addressSearch) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(addressSearch)}`);
      const data = await response.json();
      if (data?.length > 0) {
        const { lat, lon, address } = data[0];
        updateLocation(parseFloat(lat), parseFloat(lon), true, false);
        setFormData(prev => ({
          ...prev,
          street: address.road || address.pedestrian || '',
          neighborhood: address.neighbourhood || address.suburb || '',
          city: address.city || address.town || prev.city,
          state: (address.state_code || address.state?.substring(0, 2))?.toUpperCase() || 'PA'
        }));
      }
    } finally { 
      setIsSearching(false); 
    }
  };

  const handleCaptureLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude, true, true);
        setIsLocating(false);
      }, 
      () => {
        setIsLocating(false);
        alert("Erro ao obter localizacao.");
      }, 
      { enableHighAccuracy: true }
    );
  };

  // Form Handlers
  const handleChange = (field: keyof InputData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleNumericChange = (field: keyof InputData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: parseFloat(e.target.value) || 0 }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const mapElement = document.getElementById(mapContainerId);
      if (mapElement) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canvas = await html2canvas(mapElement, {
          useCORS: true,
          allowTaint: true,
          ignoreElements: (element: Element) => element.classList.contains('leaflet-control-container')
        } as any);
        const mapImage = canvas.toDataURL('image/png');
        onSubmit({ ...formData, mapImage }, weatherData || undefined);
      } else {
        onSubmit(formData, weatherData || undefined);
      }
    } catch (err) {
      console.error("Map capture failed", err);
      onSubmit(formData, weatherData || undefined);
    }
  };

  // Computed
  const avgHsp = weatherData?.hsp_monthly 
    ? (weatherData.hsp_monthly.reduce((a, b) => a + b, 0) / 12).toFixed(2)
    : '--';

  return (
    <form onSubmit={handleFormSubmit} className="animate-in fade-in duration-300">
      <DenseFormGrid className="gap-4">
        
        {/* COLUNA PRINCIPAL: Form + Mapa (Col-8) */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          
          {/* Card: Identificacao */}
          <DenseCard>
            <DenseFormGrid>
              <DenseInput
                label="Nome do Cliente"
                value={formData.clientName}
                onChange={handleChange('clientName')}
                placeholder="Nome completo ou razao social"
                colSpan={12}
                required
              />
            </DenseFormGrid>
          </DenseCard>

          {/* Card: Endereco */}
          <DenseCard>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin size={12} className="text-neonorte-purple" />
              Endereco da Instalacao
            </h4>
            <DenseFormGrid>
              <DenseInput label="Logradouro" value={formData.street} onChange={handleChange('street')} placeholder="Rua, Avenida..." colSpan={12} />
              <DenseInput label="Bairro" value={formData.neighborhood} onChange={handleChange('neighborhood')} placeholder="Bairro" colSpan={6} />
              <DenseInput label="Nr" value={formData.number} onChange={handleChange('number')} placeholder="123" colSpan={3} />
              <DenseInput label="Comp." value={formData.complement} onChange={handleChange('complement')} placeholder="Apto, Bloco..." colSpan={3} />
              <DenseInput label="Cidade" value={formData.city} onChange={handleChange('city')} colSpan={9} />
              <DenseSelect label="UF" value={formData.state} onChange={handleChange('state')} options={STATE_OPTIONS} colSpan={3} />
            </DenseFormGrid>
          </DenseCard>

          {/* Card: Busca */}
          <DenseCard className="bg-slate-50">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={addressSearch}
                onChange={e => setAddressSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearchAddress())}
                className="flex-1 h-8 px-3 text-sm rounded-lg border border-slate-200 focus:border-neonorte-green outline-none"
                placeholder="Digite o endereco..."
              />
              <DenseButton type="button" onClick={handleSearchAddress} variant="secondary" size="sm"
                icon={isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              />
            </div>
            <DenseButton type="button" onClick={handleCaptureLocation} variant="ghost" size="sm"
              icon={<Navigation size={14} className={isLocating ? 'animate-spin' : ''} />} className="w-full"
            >
              {isLocating ? 'Localizando...' : 'Usar GPS Atual'}
            </DenseButton>
          </DenseCard>

          {/* Mapa */}
          <DenseCard className="p-2 relative">
            <div className="absolute top-4 left-4 z-[1000] flex gap-1">
              <button type="button" onClick={toggleMapMode}
                className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${mapMode === 'hybrid' ? 'bg-slate-900/90 text-white' : 'bg-white/90 text-slate-700 border border-slate-200'}`}
              >
                <Layers size={14} />
                {mapMode === 'hybrid' ? 'Satelite' : 'Mapa'}
              </button>
            </div>

            <div className="absolute top-4 right-4 z-[1000] flex gap-1">
              <button type="button" onClick={handleStartDraw}
                className="h-8 px-3 bg-neonorte-green text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-neonorte-green/90 transition-all shadow-lg"
              >
                <PencilRuler size={14} />
                Medir Area
              </button>
              <button type="button" onClick={handleClearDraw}
                className="h-8 w-8 bg-red-500/90 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition-all"
                title="Limpar desenho"
              >
                <Eraser size={14} />
              </button>
            </div>

            <div id={mapContainerId} className="w-full h-[280px] rounded-lg overflow-hidden cursor-crosshair" />

            <div className="mt-2 grid grid-cols-12 gap-2">
              <DenseStat label="Area Medida" value={formData.availableArea} unit="m2" colSpan={4} variant={formData.availableArea > 0 ? 'success' : 'default'} />
              <DenseStat label="Latitude" value={formData.lat?.toFixed(5) || '-'} colSpan={4} />
              <DenseStat label="Longitude" value={formData.lng?.toFixed(5) || '-'} colSpan={4} />
            </div>
          </DenseCard>

          {/* Parametros Tecnicos */}
          <DenseCard>
            <DenseFormGrid>
              <DenseSelect label="Orientação do Telhado" value={formData.orientation} onChange={handleChange('orientation')} options={ORIENTATION_OPTIONS} colSpan={6} />
              <DenseInput label="Tarifa (R$/kWh)" type="number" step="0.01" value={formData.tariffRate} onChange={handleNumericChange('tariffRate')} colSpan={6} />
            </DenseFormGrid>
          </DenseCard>

          {/* Estrutura do Telhado */}
          <DenseCard>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Home size={12} className="text-neonorte-purple" />
              Estrutura do Telhado
            </h4>
            <DenseFormGrid>
              <DenseSelect
                label="Tipo de Cobertura"
                value={formData.roofType || ''}
                onChange={handleChange('roofType')}
                options={[{ value: '', label: 'Selecione...' }, ...ROOF_TYPE_OPTIONS]}
                colSpan={6}
              />
              <DenseInput
                label="Inclinação (°)"
                type="number"
                step="1"
                value={formData.roofInclination ?? 15}
                onChange={handleNumericChange('roofInclination')}
                colSpan={3}
              />
              <DenseSelect
                label="Conexão"
                value={formData.connectionType || 'monofasico'}
                onChange={handleChange('connectionType')}
                options={CONNECTION_TYPE_OPTIONS}
                colSpan={3}
              />
            </DenseFormGrid>
          </DenseCard>

          {/* Consumo Mensal (12 meses) */}
          <DenseCard>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap size={12} className="text-neonorte-green" />
              Histórico de Consumo (kWh/mês)
            </h4>
            <div className="grid grid-cols-6 gap-2">
              {MONTHS_SHORT.map((month, i) => {
                const history = formData.invoices?.[0]?.monthlyHistory;
                const val = history?.[i] ?? formData.averageConsumption ?? 0;
                return (
                  <div key={month} className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 text-center font-medium">{month}</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={val || ''}
                      onChange={e => {
                        const v = parseFloat(e.target.value) || 0;
                        const invoices = formData.invoices?.length
                          ? [...formData.invoices]
                          : [{
                              id: 'default', name: 'Instalação Principal',
                              installationNumber: '', concessionaire: '',
                              rateGroup: 'B', connectionType: formData.connectionType || 'monofasico',
                              voltage: '220', breakerCurrent: 50,
                              monthlyHistory: Array(12).fill(formData.averageConsumption ?? 0)
                            }];
                        const newHistory = [...(invoices[0].monthlyHistory || Array(12).fill(0))];
                        newHistory[i] = v;
                        invoices[0] = { ...invoices[0], monthlyHistory: newHistory };
                        const avg = newHistory.reduce((a, b) => a + b, 0) / 12;
                        setFormData(prev => ({ ...prev, invoices, averageConsumption: avg }));
                      }}
                      className="w-full h-8 text-center text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 focus:border-neonorte-green focus:bg-white outline-none transition-colors"
                    />
                  </div>
                );
              })}
            </div>
            {(() => {
              const history = formData.invoices?.[0]?.monthlyHistory;
              if (!history) return null;
              const avg = history.reduce((a, b) => a + b, 0) / 12;
              const max = Math.max(...history);
              const min = Math.min(...history.filter(v => v > 0));
              return (
                <div className="mt-3 grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase">Média</p>
                    <p className="text-sm font-bold text-slate-700">{avg.toFixed(0)} kWh</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase">Pico</p>
                    <p className="text-sm font-bold text-orange-500">{max} kWh</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase">Mínimo</p>
                    <p className="text-sm font-bold text-emerald-600">{isFinite(min) ? min : 0} kWh</p>
                  </div>
                </div>
              );
            })()}
          </DenseCard>
        </div>

        {/* COLUNA LATERAL: Dados Climaticos (Col-4) */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          
          {/* Card: HSP e Clima */}
          <DenseCard className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-orange-700 uppercase tracking-wider flex items-center gap-2">
                <Sun size={14} className="text-orange-500" />
                Dados Climaticos
              </h4>
              {isLoadingWeather && <Loader2 size={14} className="animate-spin text-orange-500" />}
            </div>

            {weatherError && (
              <p className="text-xs text-red-500 mb-2">{weatherError}</p>
            )}

            {!weatherData && !isLoadingWeather && !weatherError && (
              <p className="text-xs text-slate-400 text-center py-4">
                Defina a localizacao para carregar dados climaticos
              </p>
            )}

            {weatherData && (
              <>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-white/80 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">HSP Medio</p>
                    <p className="text-lg font-black text-orange-600">{avgHsp}</p>
                    <p className="text-[9px] text-slate-400">kWh/m2/dia</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Temp. Media</p>
                    <p className="text-lg font-black text-orange-600">{weatherData.ambient_temp_avg?.toFixed(1) || '--'}</p>
                    <p className="text-[9px] text-slate-400">Celsius</p>
                  </div>
                </div>

                {/* HSP Mensal Mini Grid */}
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-[10px] text-slate-500 uppercase mb-2">HSP Mensal</p>
                  <div className="grid grid-cols-6 gap-1">
                    {weatherData.hsp_monthly.map((hsp, i) => (
                      <div key={i} className="text-center">
                        <p className="text-[8px] text-slate-400">{MONTHS_SHORT[i]}</p>
                        <p className="text-[10px] font-bold text-slate-700">{hsp.toFixed(1)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[9px] text-slate-400 mt-2 text-center">
                  Fonte: {weatherData.irradiation_source}
                </p>
              </>
            )}
          </DenseCard>

          {/* Card: Status Location */}
          <DenseCard className="bg-slate-50">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-neonorte-purple/10 text-neonorte-purple rounded-lg shrink-0">
                <CloudSun size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-1">Localizacao</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {weatherData?.location_name || formData.city || 'Defina um ponto no mapa'}
                </p>
              </div>
            </div>
          </DenseCard>

          {/* Perfil do Lead */}
          <DenseCard>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users size={12} className="text-neonorte-purple" />
              Perfil do Lead
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'provedor', label: 'Provedor', desc: 'Foco em alívio e segurança familiar', icon: <Home size={18} /> },
                { value: 'calculista', label: 'Calculista', desc: 'Foco em ROI e eficiência', icon: <TrendingDown size={18} /> },
              ] as const).map(opt => {
                const selected = formData.leadPersona === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, leadPersona: opt.value }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                      selected
                        ? 'border-neonorte-purple bg-neonorte-purple/10 text-neonorte-purple'
                        : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {opt.icon}
                    <span className={`text-xs font-bold ${selected ? 'text-neonorte-purple' : 'text-slate-600'}`}>{opt.label}</span>
                    <span className="text-[9px] leading-tight text-slate-400">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </DenseCard>

          {/* Submit Button */}
          <div className="flex justify-end">
            <DenseButton type="submit" variant="primary" icon={<Crosshair size={16} />} className="w-full">
              Confirmar Dados
            </DenseButton>
          </div>
        </div>

      </DenseFormGrid>
    </form>
  );
};
