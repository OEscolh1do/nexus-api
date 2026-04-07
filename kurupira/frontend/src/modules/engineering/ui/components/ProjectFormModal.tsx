/**
 * =============================================================================
 * PROJECT FORM MODAL — Modal Unificado (CREATE + EDIT)
 * =============================================================================
 *
 * Substitui ProjectInitWizardModal e ProjectQuickEditModal.
 * - projectId = null  → Modo CREATE (campos vazios, botão "Lançar Projeto")
 * - projectId = 'xxx' → Modo EDIT   (carrega do DB, botão "Gravar Alterações")
 *
 * Inclui mini-mapa Leaflet interativo para definir lat/lng por clique.
 * =============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Play, Save, Loader2, Zap, LayoutGrid,
  AlertCircle, Wallet, MapPin, Search, Navigation
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ProjectService } from '@/services/ProjectService';
import { KurupiraClient } from '@/services/NexusClient';
import { useSolarStore } from '@/core/state/solarStore';

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

// =============================================================================
// TILE CONFIG
// =============================================================================
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

const tileUrl = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// =============================================================================
// TYPES
// =============================================================================

interface ProjectFormModalProps {
  isOpen: boolean;
  projectId: string | null; // null = CREATE, string = EDIT
  onClose: () => void;
  onSaveSuccess: () => void;
}

// =============================================================================
// MAP SUB-COMPONENTS
// =============================================================================

/** Captures click events on the mini-map and calls onLocationSelect */
const MapClickHandler: React.FC<{ onLocationSelect: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

/** Syncs map center when lat/lng change externally (from inputs) */
const MapViewUpdater: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat !== 0 && lng !== 0) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
    }
  }, [lat, lng, map]);
  return null;
};

// =============================================================================
// COMPONENT
// =============================================================================

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  projectId,
  onClose,
  onSaveSuccess,
}) => {
  const setActiveModule = useSolarStore(s => s.setActiveModule);
  const isEditMode = projectId !== null;

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields (superset of both old modals)
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [city, setCity] = useState('');
  const [stateUF, setStateUF] = useState('');
  const [street, setStreet] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [number, setNumber] = useState('');
  const [lat, setLat] = useState<number>(0);
  const [lng, setLng] = useState<number>(0);
  
  // Map control states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [connectionType, setConnectionType] = useState<'monofasico' | 'bifasico' | 'trifasico'>('monofasico');
  const [tariffRate, setTariffRate] = useState<number>(0.92);

  // Consumption
  const [consumptionMode, setConsumptionMode] = useState<'AVERAGE' | 'DETAILED'>('AVERAGE');
  const [averageConsumption, setAverageConsumption] = useState<number>(0);
  const [monthlyConsumption, setMonthlyConsumption] = useState<number[]>(Array(12).fill(0));

  // Raw design data for EDIT patch
  const [rawDesignData, setRawDesignData] = useState<any>(null);

  // ─── RESET on open ───
  useEffect(() => {
    if (!isOpen) return;

    // Reset fields
    setError(null);
    setProjectName('');
    setClientName('');
    setCity('');
    setStateUF('');
    setStreet('');
    setZipCode('');
    setNeighborhood('');
    setNumber('');
    setSearchQuery('');
    setLat(0);
    setLng(0);
    setConnectionType('monofasico');
    setTariffRate(0.92);
    setConsumptionMode('AVERAGE');
    setAverageConsumption(0);
    setMonthlyConsumption(Array(12).fill(0));
    setRawDesignData(null);

    if (isEditMode) {
      loadProjectData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, projectId]);

  // ─── LOAD (EDIT mode) ───
  const loadProjectData = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const design = await KurupiraClient.designs.get(projectId);
      const dd = design.designData;
      setRawDesignData(dd);

      const cd = dd?.solar?.clientData || {};
      setProjectName(design.name || '');
      setClientName(cd.clientName || design.leadContext?.name || '');
      setCity(cd.city || '');
      setStateUF(cd.state || '');
      setStreet(cd.street || '');
      setZipCode(cd.zipCode || '');
      setNeighborhood(cd.neighborhood || '');
      setNumber(cd.number || '');
      setLat(cd.lat || 0);
      setLng(cd.lng || 0);
      setConnectionType(cd.connectionType || 'monofasico');
      setTariffRate(cd.tariffRate || 0.92);
      setAverageConsumption(cd.averageConsumption || 0);

      const history = cd.invoices?.[0]?.monthlyHistory;
      if (history?.length === 12) {
        setMonthlyConsumption(history);
        // Detect if monthly values vary → switch to DETAILED mode
        const allSame = history.every((v: number) => v === history[0]);
        setConsumptionMode(allSame ? 'AVERAGE' : 'DETAILED');
        if (allSame && history[0] > 0) {
          setAverageConsumption(history[0]);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Falha ao carregar os dados do projeto.');
    } finally {
      setLoading(false);
    }
  };

  // ─── MAP CLICK HANDLER ───
  const handleMapClick = useCallback((newLat: number, newLng: number) => {
    setLat(parseFloat(newLat.toFixed(6)));
    setLng(parseFloat(newLng.toFixed(6)));
  }, []);

  // ─── NOMINATIM GEOCODING ───
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingMap(true);
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await resp.json();
      if (data && data.length > 0) {
        setLat(parseFloat(data[0].lat));
        setLng(parseFloat(data[0].lon));
      } else {
        alert('Endereço não encontrado no mapa.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao buscar endereço.');
    } finally {
      setIsSearchingMap(false);
    }
  };

  // ─── BROWSER GEOLOCATION ───
  const locateUser = () => {
    if (!navigator.geolocation) {
      alert('Seu navegador não suporta geolocalização.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(parseFloat(pos.coords.latitude.toFixed(6)));
        setLng(parseFloat(pos.coords.longitude.toFixed(6)));
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        alert('Falha ao obter sua localização. Verifique as permissões.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ─── VIACEP ───
  const fetchViaCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    setZipCode(cleanCep);
    if (cleanCep.length === 8) {
      try {
        const resp = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await resp.json();
        if (!data.erro) {
          setStreet(data.logradouro || '');
          setNeighborhood(data.bairro || '');
          setCity(data.localidade || '');
          setStateUF(data.uf || '');
          // Automagically search on map
          const q = `${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}`;
          setSearchQuery(q);
          
          setIsSearchingMap(true);
          const mapResp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`);
          const mapData = await mapResp.json();
          if (mapData && mapData.length > 0) {
            setLat(parseFloat(mapData[0].lat));
            setLng(parseFloat(mapData[0].lon));
          }
          setIsSearchingMap(false);
        }
      } catch (e) {
        console.error('ViaCEP Fetch Error:', e);
      }
    }
  };

  // ─── VALIDATION ───
  const validate = () => {
    if (!clientName.trim()) return 'Nome do Cliente é obrigatório.';
    if (!city.trim() || stateUF.length !== 2) return 'Cidade e UF (2 letras) são obrigatórios.';
    if (!isEditMode) {
      if (consumptionMode === 'AVERAGE' && averageConsumption <= 0) return 'Insira um consumo médio válido.';
      if (consumptionMode === 'DETAILED' && monthlyConsumption.every(v => v === 0)) return 'Insira pelo menos um mês de consumo.';
    }
    return null;
  };

  // ─── SAVE ───
  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setSaving(true);
    setError(null);

    try {
      const history = consumptionMode === 'AVERAGE'
        ? Array(12).fill(averageConsumption)
        : monthlyConsumption;
      const avgCalc = history.reduce((a: number, b: number) => a + b, 0) / 12;

      if (isEditMode && projectId) {
        // ─── EDIT: PATCH existing project ───
        const updatedDesignData = { ...(rawDesignData || {}) };
        if (!updatedDesignData.solar) updatedDesignData.solar = {};
        if (!updatedDesignData.solar.clientData) updatedDesignData.solar.clientData = {};

        updatedDesignData.solar.clientData = {
          ...updatedDesignData.solar.clientData,
          clientName,
          zipCode,
          street,
          number,
          neighborhood,
          city,
          state: stateUF,
          lat,
          lng,
          connectionType,
          tariffRate,
          averageConsumption: avgCalc,
        };

        // Update invoices
        let invoices = updatedDesignData.solar.clientData.invoices || [];
        if (invoices.length === 0) {
          invoices.push({
            id: 'default', name: 'Instalação Principal', installationNumber: '', concessionaire: '',
            rateGroup: 'B', connectionType, voltage: '220', breakerCurrent: 50,
            monthlyHistory: history,
          });
        } else {
          invoices[0] = { ...invoices[0], connectionType, monthlyHistory: history };
        }
        updatedDesignData.solar.clientData.invoices = invoices;

        await KurupiraClient.designs.update(projectId, {
          name: projectName,
          designData: updatedDesignData,
          latitude: lat,
          longitude: lng,
        });

        onSaveSuccess();
        onClose();
      } else {
        // ─── CREATE: new standalone project ───
        const newId = await ProjectService.createStandaloneProject({
          projectName: projectName || `Projeto ${clientName}`,
          clientName,
          city,
          stateUF,
          street,
          zipCode,
          neighborhood,
          number,
          lat,
          lng,
          connectionType,
          tariffRate,
          monthlyHistory: history,
        });

        if (newId) {
          onSaveSuccess();
          onClose();
          setActiveModule('engineering');
        } else {
          setError('Ocorreu um erro na criação do projeto via API.');
        }
      }
    } catch (e) {
      console.error(e);
      setError('Falha de conexão com os servidores do Kurupira.');
    } finally {
      setSaving(false);
    }
  };

  const updateMonth = (index: number, val: number) => {
    const newArr = [...monthlyConsumption];
    newArr[index] = val;
    setMonthlyConsumption(newArr);
  };

  if (!isOpen) return null;

  // Map center: use lat/lng if set, else Manaus default
  const mapCenter: [number, number] = (lat !== 0 && lng !== 0) ? [lat, lng] : [-3.1316, -60.0233];
  const mapZoom = (lat !== 0 && lng !== 0) ? 16 : 12;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={() => !saving && !loading && onClose()}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/30 shrink-0">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isEditMode ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {isEditMode ? <Save size={16} /> : <Play size={16} className="fill-current" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {isEditMode ? 'Editar Projeto' : 'Novo Projeto'}
              </h2>
              <p className="text-[10px] text-slate-400">
                {isEditMode ? 'Atualize os dados do projeto' : 'Kurupira Engineering-First Flow'}
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={saving} className="p-2 rounded hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">

          {/* Loading state (EDIT mode) */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-xs font-semibold">Carregando dados do projeto...</span>
            </div>
          )}

          {!loading && (
            <>
              {/* Error banner */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-xs">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* ── SEÇÃO 1: IDENTIFICAÇÃO ── */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <LayoutGrid size={14} /> Identificação e Local
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Nome do Cliente *</label>
                    <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex: Supermercado Central"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Título Interno (Opcional)</label>
                    <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Ex: Matriz - Fase 1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-4 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">CEP</label>
                    <input type="text" value={zipCode} onChange={e => fetchViaCep(e.target.value)} maxLength={9} placeholder="Somente números"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
                  </div>
                  <div className="col-span-8 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Logradouro / Endereço</label>
                    <input type="text" value={street} onChange={e => setStreet(e.target.value)} placeholder="Ex: Av. Eduardo Ribeiro"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-3 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Número</label>
                    <input type="text" value={number} onChange={e => setNumber(e.target.value)} placeholder="000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
                  </div>
                  <div className="col-span-4 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Bairro</label>
                    <input type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Centro"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
                  </div>
                  <div className="col-span-3 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Cidade *</label>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: Manaus"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">UF *</label>
                    <input type="text" value={stateUF} onChange={e => setStateUF(e.target.value.toUpperCase())} maxLength={2} placeholder="AM"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors uppercase" />
                  </div>
                </div>
              </div>

              {/* ── SEÇÃO 2: MAPA INTERATIVO ── */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={14} /> Localização no Mapa
                </h3>
                <p className="text-[10px] text-slate-500 -mt-1">Clique no mapa para definir a localização do projeto ou insira as coordenadas manualmente.</p>

                {/* Mini Leaflet Map */}
                <div className="rounded-xl overflow-hidden border border-slate-800 h-[200px] relative">
                  <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ width: '100%', height: '100%' }}
                    zoomControl={false}
                    attributionControl={false}
                  >
                    <TileLayer
                      url={tileUrl}
                      maxZoom={MAPBOX_TOKEN ? 22 : 19}
                    />
                    <MapClickHandler onLocationSelect={handleMapClick} />
                    <MapViewUpdater lat={lat} lng={lng} />
                    {lat !== 0 && lng !== 0 && (
                      <Marker position={[lat, lng]} icon={defaultIcon} />
                    )}
                  </MapContainer>

                  {/* Floating Map Controls */}
                  <div className="absolute top-2 left-2 right-2 z-[400] flex gap-2">
                    <div className="flex-1 flex px-2 py-1 items-center bg-slate-900 border border-slate-700 shadow-xl rounded-lg opacity-90 hover:opacity-100 transition-opacity">
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
                        placeholder="Buscar endereço no mapa..."
                        className="bg-transparent border-none outline-none text-xs text-white w-full placeholder:text-slate-500"
                      />
                      <button onClick={searchLocation} disabled={isSearchingMap} className="p-1 hover:bg-slate-800 rounded-md text-emerald-400 transition-colors">
                        {isSearchingMap ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                      </button>
                    </div>
                    <button onClick={locateUser} disabled={isLocating} title="Localização Atual"
                      className="p-1.5 bg-slate-900 border border-slate-700 shadow-xl rounded-lg text-emerald-400 hover:bg-slate-800 flex items-center justify-center opacity-90 hover:opacity-100 transition-all">
                      {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                    </button>
                  </div>

                  {/* Crosshair hint overlay */}
                  {lat === 0 && lng === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[300]">
                      <div className="bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700 mt-8">
                        <span className="text-[10px] font-bold text-slate-400">Clique no mapa ou busque para pinar</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Coordinate inputs (synced with map) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <MapPin size={10} /> Latitude
                    </label>
                    <input type="number" step="0.0001" value={lat} onChange={e => setLat(Number(e.target.value))} placeholder="-3.1316"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <MapPin size={10} /> Longitude
                    </label>
                    <input type="number" step="0.0001" value={lng} onChange={e => setLng(Number(e.target.value))} placeholder="-60.0233"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono" />
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-slate-800/50" />

              {/* ── SEÇÃO 3: INFRAESTRUTURA & FATURA ── */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Zap size={14} /> Infraestrutura & Fatura
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Tipo de Conexão Nominal</label>
                    <select value={connectionType} onChange={e => setConnectionType(e.target.value as 'monofasico' | 'bifasico' | 'trifasico')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors">
                      <option value="monofasico">Monofásico</option>
                      <option value="bifasico">Bifásico</option>
                      <option value="trifasico">Trifásico</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Wallet size={12} /> Tarifa Unitária (R$/kWh)
                    </label>
                    <input type="number" step="0.01" min="0" value={tariffRate} onChange={e => setTariffRate(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono" />
                  </div>
                </div>

                {/* Consumption Block */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 mt-2">
                  <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" checked={consumptionMode === 'AVERAGE'} onChange={() => setConsumptionMode('AVERAGE')} className="accent-emerald-500" />
                      <span className="text-xs font-bold text-slate-300 group-hover:text-emerald-400 transition-colors">Média Simplificada</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" checked={consumptionMode === 'DETAILED'} onChange={() => setConsumptionMode('DETAILED')} className="accent-emerald-500" />
                      <span className="text-xs font-bold text-slate-300 group-hover:text-emerald-400 transition-colors">Fatura Detalhada (12 Meses)</span>
                    </label>
                  </div>

                  {consumptionMode === 'AVERAGE' ? (
                    <div className="space-y-1.5 max-w-xs animate-in fade-in">
                      <label className="text-[10px] text-slate-500">Média Geral Mensal (kWh)</label>
                      <div className="relative">
                        <input type="number" min="0" value={averageConsumption} onChange={e => setAverageConsumption(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">kWh/mês</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 animate-in slide-in-from-top-2 duration-300">
                      {MONTHS.map((m, i) => (
                        <div key={m} className="space-y-1 bg-slate-900 p-2 rounded-lg border border-slate-800/50">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block text-center">{m}</label>
                          <input type="number" min="0" value={monthlyConsumption[i]} onChange={e => updateMonth(i, Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700/50 rounded px-2 py-1 text-xs text-center text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/20 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} disabled={saving || loading} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || loading}
            className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              isEditMode
                ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(5,150,105,0.4)]'
            }`}>
            {saving
              ? <Loader2 size={16} className="animate-spin" />
              : isEditMode ? <Save size={16} /> : <Play size={16} className="fill-current" />
            }
            {saving
              ? (isEditMode ? 'Gravando...' : 'Inicializando...')
              : (isEditMode ? 'Gravar Alterações' : 'Lançar Projeto')
            }
          </button>
        </div>
      </div>
    </div>
  );
};
