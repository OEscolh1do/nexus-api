
import React, { useState, useEffect, useRef } from 'react';
import { InputData } from '../types';
import html2canvas from 'html2canvas';
import { MapPin, Sun, Navigation, Search, Loader2, ChevronRight, Sparkles, Layers, PencilRuler, Eraser } from 'lucide-react';

interface Props {
  initialData: InputData;
  onSubmit: (data: InputData) => void;
}

declare const L: any;

export const InputForm: React.FC<Props> = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState<InputData>(initialData);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [addressSearch, setAddressSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapMode, setMapMode] = useState<'streets' | 'hybrid'>('hybrid');

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const mapContainerId = "map-selector-container";

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        setFormData(prev => ({
          ...prev,
          street: addr.road || addr.pedestrian || addr.suburb || prev.street,
          neighborhood: addr.neighbourhood || addr.suburb || addr.village || prev.neighborhood,
          city: addr.city || addr.town || addr.village || prev.city,
          state: (addr.state_code || (addr.state && addr.state.length === 2 ? addr.state : 'PA')).toUpperCase()
        }));
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

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
      console.error("Erro ao calcular área:", e);
    }
  };

  const updateLocation = (lat: number, lng: number, updateMap = false, shouldReverse = true) => {
    setFormData(prev => ({ ...prev, lat, lng }));
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    if (updateMap && mapRef.current) mapRef.current.setView([lat, lng], 20);
    if (shouldReverse) reverseGeocode(lat, lng);
  };

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
          html: `<div class="w-10 h-10 bg-neonorte-purple rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        })
      }).addTo(mapRef.current);

      mapRef.current.on('click', (e: any) => {
        if (!mapRef.current.pm.globalDrawModeEnabled()) updateLocation(e.latlng.lat, e.latlng.lng);
      });

      markerRef.current.on('dragend', (e: any) => updateLocation(e.target.getLatLng().lat, e.target.getLatLng().lng));

      mapRef.current.pm.setGlobalOptions({
        pathOptions: { color: '#05CD46', fillColor: '#05CD46', fillOpacity: 0.4, weight: 3, dashArray: '5, 5' }
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

  const handleSearchAddress = async () => {
    if (!addressSearch) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(addressSearch)}`);
      const data = await response.json();
      if (data && data.length > 0) {
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
    } finally { setIsSearching(false); }
  };

  const handleCaptureLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      updateLocation(pos.coords.latitude, pos.coords.longitude, true, true);
      setGpsAccuracy(pos.coords.accuracy);
      setIsLocating(false);
    }, () => {
      setIsLocating(false);
      alert("Erro ao obter localização.");
    }, { enableHighAccuracy: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const mapElement = document.getElementById(mapContainerId);
      if (mapElement) {
        const canvas = await html2canvas(mapElement, {
          useCORS: true,
          allowTaint: true,
          ignoreElements: (element: Element) => element.classList.contains('leaflet-control-container')
        });
        const mapImage = canvas.toDataURL('image/png');
        onSubmit({ ...formData, mapImage });
      } else {
        onSubmit(formData);
      }
    } catch (err) {
      console.error("Map capture failed", err);
      onSubmit(formData);
    }
  };

  return (
    <div className="w-full bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-neonorte-deepPurple p-12 flex justify-between items-center relative overflow-hidden neonorte-overlay">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none"><Sun size={240} className="text-neonorte-green animate-pulse" /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-neonorte-green p-2 rounded-xl text-white"><Sparkles size={20} /></div>
            <span className="text-neonorte-green font-black uppercase text-[10px] tracking-[0.4em]">Fase 01: Levantamento Geospatial</span>
          </div>
          <h2 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase leading-none italic font-display">Análise de <br /> <span className="text-neonorte-green">Telhado Premium</span></h2>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-12 space-y-20">
        {/* ... keeping everything else the same ... */}

        <section className="space-y-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-neonorte-purple rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl"><MapPin size={32} /></div>
              <div>
                <h3 className="text-3xl font-black text-neonorte-darkPurple uppercase tracking-tighter font-display">Mapeamento</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Localização e Edição de Logradouro</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4 space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Nome do Cliente</label>
                <input type="text" value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl font-bold text-neonorte-darkPurple outline-none focus:ring-4 focus:ring-neonorte-purple/5" placeholder="Nome do Projeto..." required />
              </div>

              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Endereço Confirmado</h4>
                <div className="space-y-4">
                  <input type="text" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold" placeholder="Rua..." />
                  <input type="text" value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold" placeholder="Bairro..." />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold" placeholder="Nº" />
                    <input type="text" value={formData.complement} onChange={e => setFormData({ ...formData, complement: e.target.value })} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold" placeholder="Comp." />
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button type="button" onClick={handleCaptureLocation} className="w-full py-5 bg-white border-2 border-neonorte-purple text-neonorte-purple rounded-3xl font-black text-xs hover:bg-neonorte-purple hover:text-white transition-all flex items-center justify-center gap-4 uppercase tracking-widest">
                  <Navigation size={20} className={isLocating ? 'animate-spin' : ''} />
                  {isLocating ? 'Buscando...' : 'Minha Localização'}
                </button>
                <div className="flex gap-2">
                  <input type="text" value={addressSearch} onChange={e => setAddressSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearchAddress())} className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-bold" placeholder="Buscar endereço manual..." />
                  <button type="button" onClick={handleSearchAddress} className="bg-neonorte-purple text-white px-5 rounded-2xl transition-all">
                    {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-6 relative">
              {/* CONTROLES DO MAPA - Posicionados para não sobrepor as ferramentas do Geoman */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[2000] flex gap-2 bg-neonorte-deepPurple/90 backdrop-blur-xl p-2.5 rounded-[1.8rem] border border-white/20 shadow-2xl">
                <button type="button" onClick={toggleMapMode} className={`px-5 py-3 rounded-[1.2rem] transition-all flex items-center gap-2 ${mapMode === 'hybrid' ? 'bg-neonorte-green text-white' : 'bg-white/10 text-white'}`}>
                  <Layers size={18} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Camadas</span>
                </button>
                <div className="w-[1px] bg-white/10 mx-1"></div>
                <button type="button" onClick={handleStartDraw} className="px-6 py-3 bg-neonorte-green text-white rounded-[1.2rem] hover:bg-neonorte-lightGreen transition-all flex items-center gap-2 group shadow-xl">
                  <PencilRuler size={18} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Medir Telhado</span>
                </button>
                <button type="button" onClick={handleClearDraw} className="p-3 bg-red-500/20 text-red-400 rounded-[1.2rem] hover:bg-red-500 hover:text-white transition-all"><Eraser size={18} /></button>
              </div>

              <div id={mapContainerId} className="w-full h-[550px] shadow-2xl rounded-[3.5rem] border-[10px] border-slate-50 overflow-hidden ring-1 ring-slate-200 cursor-crosshair relative z-10"></div>

              <div className="flex justify-between items-center bg-slate-50 px-10 py-6 rounded-3xl border border-slate-100 shadow-inner">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${formData.availableArea > 0 ? 'bg-neonorte-green text-white' : 'bg-slate-200 text-slate-400'}`}><Sun size={20} /></div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Área de Telhado Medida</p>
                    <p className="text-2xl font-black text-neonorte-darkPurple font-mono">{formData.availableArea} <span className="text-xs font-bold text-slate-400">m²</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Orientação do Telhado</p>
                  <select value={formData.orientation} onChange={e => setFormData({ ...formData, orientation: e.target.value })} className="bg-transparent font-black text-neonorte-purple text-right outline-none">
                    <option value="Norte">Norte (Máximo)</option><option value="Leste">Leste</option><option value="Oeste">Oeste</option><option value="Sul">Sul</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-8">
          <button type="submit" className="group relative overflow-hidden bg-neonorte-purple hover:bg-neonorte-lightPurple text-white font-black py-6 px-16 rounded-[2rem] shadow-xl transition-all active:scale-95 flex items-center gap-6">
            <span className="tracking-[0.2em] uppercase text-lg">Avançar para Demanda</span>
            <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );
};
