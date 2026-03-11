
import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';
import { fetchWeatherAnalysis } from '@/services/weatherService';
import { CompassOverlay } from './CompassOverlay';
import { MapHUD } from './MapHUD';
import html2canvas from 'html2canvas';

// Leaflet types
declare const L: any;

export const GeoLocationWidget: React.FC = () => {
  // Store
  const clientData = useSolarStore(state => state.clientData);
  const updateClientData = useSolarStore(state => state.updateClientData);
  const weatherData = useSolarStore(state => state.weatherData);
  const setWeatherData = useSolarStore(state => state.setWeatherData);
  const setLoadingWeather = useSolarStore(state => state.setLoadingWeather);

  // Local State
  const [addressSearch, setAddressSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapMode, setMapMode] = useState<'streets' | 'hybrid'>('hybrid');

  // Refs
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const layerRef = useRef<any>(null); // Active polygon layer
  const mapContainerId = "map-widget-container";

  // --- Handlers ---
  const updateLocation = (lat: number, lng: number, updateView = false) => {
    updateClientData({ lat, lng });
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    if (updateView && mapRef.current) {
        mapRef.current.flyTo([lat, lng], 20, { duration: 1.5 }); // Smooth FlyTo
    }
    reverseGeocode(lat, lng);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data?.address) {
        const addr = data.address;
        updateClientData({
          street: addr.road || addr.pedestrian || addr.suburb || clientData.street,
          neighborhood: addr.neighbourhood || addr.suburb || addr.village || clientData.neighborhood,
          city: addr.city || addr.town || addr.village || clientData.city,
          state: (addr.state_code || (addr.state?.length === 2 ? addr.state : 'PA')).toUpperCase(),
          zipCode: addr.postcode || clientData.zipCode
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  const calculateArea = (layer: any) => {
    try {
        let latlngs = layer.getLatLngs();
        if (Array.isArray(latlngs[0])) latlngs = latlngs[0]; // Leaflet polygons are array of arrays
        const radius = 6378137;
        let area = 0;
        const coords = latlngs.map((ll: any) => ({
          x: (ll.lng * Math.PI * radius * Math.cos(ll.lat * Math.PI / 180)) / 180,
          y: (ll.lat * Math.PI * radius) / 180
        }));
        for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
          area += (coords[j].x + coords[i].x) * (coords[j].y - coords[i].y);
        }
        const finalArea = Math.round(Math.abs(area / 2));
        updateClientData({ availableArea: finalArea });
        
        // Add/Update Tooltip
        // const center = layer.getCenter(); // Unused
        if (!layer.getTooltip()) {
            layer.bindTooltip(`${finalArea} m²`, { 
                permanent: true, 
                direction: 'center', 
                className: 'area-tooltip' // We'll add custom global css or inline style via <style>
            }).openTooltip();
        } else {
            layer.setTooltipContent(`${finalArea} m²`);
        }
        
      } catch (e) {
        console.error("Erro ao calcular area:", e);
      }
  };

  const captureMapImage = async () => {
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
        updateClientData({ mapImage });
      }
    } catch (err) {
      console.error("Map capture failed", err);
    }
  };

  // Weather triggers automatically when location stabilizes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (clientData.lat && clientData.lng && clientData.city && !weatherData) {
         fetchWeather();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [clientData.lat, clientData.lng, clientData.city, weatherData]);

  const fetchWeather = async () => {
    if (!clientData.lat || !clientData.lng || !clientData.city || !clientData.state) return;
    setLoadingWeather(true);
    try {
      const apiKey = (import.meta as any).env?.VITE_GOOGLE_AI_API_KEY || '';
      const data = await fetchWeatherAnalysis(clientData.lat, clientData.lng, clientData.city, clientData.state, apiKey);
      setWeatherData(data);
      captureMapImage();
    } catch (err) {
      console.error('Weather fetch error:', err);
    } finally {
      setLoadingWeather(false);
    }
  };

  // Map Init
  useEffect(() => {
    // Wait for layout to settle
    const initTimer = setTimeout(() => {
        if (!mapRef.current) {
          mapRef.current = L.map(mapContainerId, {
            zoomControl: false, // Disabling default controls
            attributionControl: false, // Disabling default attribution
            maxZoom: 22
          }).setView([clientData.lat || -6.0673, clientData.lng || -49.9022], 19);
    
          const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 22, maxNativeZoom: 19 });
          const hybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 22, maxNativeZoom: 20 });
          hybrid.addTo(mapRef.current);
    
          // Custom Marker Icon SVG
          const customIcon = L.divIcon({
              className: 'bg-transparent',
              html: `
                <div class="relative group">
                    <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black/40 blur-sm rounded-full"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#05CD46" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="drop-shadow-lg transition-transform duration-300">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
                    </svg>
                </div>
              `,
              iconSize: [48, 48],
              iconAnchor: [24, 48],
          });
    
          markerRef.current = L.marker([clientData.lat || -6.0673, clientData.lng || -49.9022], {
            draggable: true,
            icon: customIcon
          }).addTo(mapRef.current);
    
          mapRef.current.on('click', (e: any) => {
            if (!mapRef.current.pm.globalDrawModeEnabled()) updateLocation(e.latlng.lat, e.latlng.lng, true);
          });
    
          markerRef.current.on('dragend', (e: any) => updateLocation(e.target.getLatLng().lat, e.target.getLatLng().lng));
    
          // Leaflet-Geoman Styles
          mapRef.current.pm.setGlobalOptions({
            pathOptions: { 
                color: '#05CD46', // Primary Color Border
                fillColor: '#05CD46', 
                fillOpacity: 0.2, 
                weight: 2, 
                dashArray: '5, 5' 
            }
          });
    
          mapRef.current.on('pm:create', (e: any) => {
            const layer = e.layer;
            if (layerRef.current) mapRef.current.removeLayer(layerRef.current);
            layerRef.current = layer;
            
            // Apply production styles
            layer.setStyle({ dashArray: null, fillOpacity: 0.2 });
    
            calculateArea(layer);
            
            layer.on('pm:edit', () => calculateArea(layer));
            layer.on('pm:remove', () => { updateClientData({ availableArea: 0 }); layerRef.current = null; });
          });
    
          mapRef.current._streets = streets;
          mapRef.current._hybrid = hybrid;
        }

        // Force a resize check shortly after init
        setTimeout(() => {
            mapRef.current?.invalidateSize();
        }, 100);
    }, 100);

    // ResizeObserver for robust responsiveness
    const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
            mapRef.current.invalidateSize();
        }
    });

    const container = document.getElementById(mapContainerId);
    if (container) {
        resizeObserver.observe(container);
    }

    return () => {
        if (container) {
            resizeObserver.unobserve(container);
        }
        clearTimeout(initTimer);
    };
  }, []);


  const toggleMapMode = (mode: 'streets' | 'hybrid') => {
    setMapMode(mode);
    if (mode === 'streets') {
      if (mapRef.current._hybrid) mapRef.current.removeLayer(mapRef.current._hybrid);
      mapRef.current._streets.addTo(mapRef.current);
    } else {
      if (mapRef.current._streets) mapRef.current.removeLayer(mapRef.current._streets);
      mapRef.current._hybrid.addTo(mapRef.current);
    }
  };

  const handleStartDraw = () => mapRef.current.pm.enableDraw('Polygon', { snappable: true, snapDistance: 20, finishOn: 'dblclick' });
  const handleClearDraw = () => {
    if (layerRef.current) mapRef.current.removeLayer(layerRef.current);
    mapRef.current.pm.getGeomanLayers().forEach((l: any) => mapRef.current.removeLayer(l));
    updateClientData({ availableArea: 0 });
    layerRef.current = null;
  };

  const handleZoom = (delta: number) => {
      if(mapRef.current) mapRef.current.setZoom(mapRef.current.getZoom() + delta);
  }

  const handleSearchAddress = async () => {
    if (!addressSearch) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(addressSearch)}`);
      const data = await response.json();
      if (data?.length > 0) {
        const { lat, lon, address } = data[0];
        updateLocation(parseFloat(lat), parseFloat(lon), true);
        
        updateClientData({
          street: address.road || address.pedestrian || '',
          neighborhood: address.neighbourhood || address.suburb || '',
          city: address.city || address.town || clientData.city,
          state: (address.state_code || address.state?.substring(0, 2))?.toUpperCase() || 'PA'
        });
      }
    } finally { setIsSearching(false); }
  };

  const handleCaptureLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { updateLocation(pos.coords.latitude, pos.coords.longitude, true); setIsLocating(false); }, 
      () => { setIsLocating(false); alert("Erro ao obter localizacao."); }, 
      { enableHighAccuracy: true }
    );
  };

  const handleCenterOnMarker = () => {
    if (clientData.lat && clientData.lng && mapRef.current) {
        mapRef.current.flyTo([clientData.lat, clientData.lng], 19, { duration: 1.5 });
    }
  };

  return (
    <div className="w-full h-full relative bg-slate-200 overflow-hidden group">
      
      {/* 1. Map Container */}
      <div id={mapContainerId} className="w-full h-full z-0 absolute inset-0 text-slate-400 flex items-center justify-center">
          <Loader2 className="animate-spin opacity-20" size={32} />
      </div>

      {/* 2. Map HUD (Controls) */}
      <MapHUD 
        addressSearch={addressSearch}
        setAddressSearch={setAddressSearch}
        onSearch={handleSearchAddress}
        isSearching={isSearching}
        mapMode={mapMode}
        onToggleMapMode={toggleMapMode}
        onZoomIn={() => handleZoom(1)}
        onZoomOut={() => handleZoom(-1)}
        onLocate={handleCaptureLocation}
        onCenterMarker={handleCenterOnMarker}
        isLocating={isLocating}
        onStartDraw={handleStartDraw}
        onClearDraw={handleClearDraw}
        hasDrawnArea={clientData.availableArea > 0}
      />

      {/* 3. Azimuth Compass Overlay (Center) */}
      <CompassOverlay />

      {/* Inject custom tooltip styles */}
      <style>{`
        .area-tooltip {
            background-color: rgba(0, 0, 0, 0.7);
            border: none;
            color: white;
            font-weight: bold;
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .area-tooltip::before {
            display: none; /* Remove Leaflet default arrow */
        }
      `}</style>
    </div>
  );
};
