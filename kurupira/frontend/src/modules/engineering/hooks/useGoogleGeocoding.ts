import { useState, useCallback } from 'react';
import { useSolarStore } from '@/core/state/solarStore';

export type GeocodeStatus = 'idle' | 'searching' | 'success' | 'partial' | 'error';

export const useGoogleGeocoding = () => {
  const clientData = useSolarStore(s => s.clientData);
  const updateClientData = useSolarStore(s => s.updateClientData);

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<GeocodeStatus>('idle');
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  /**
   * Reverse Geocoding: Lat/Lng -> Address
   */
  const reverseGeocode = useCallback(async (lat: number, lng: number, previewOnly: boolean = false) => {
    if (!apiKey) {
      console.warn('Google Maps API Key is missing.');
      setGeocodeStatus('error');
      return;
    }

    if (!previewOnly) {
      setIsGeocoding(true);
      setGeocodeStatus('searching');
    }

    // Tentar usar o SDK do Google (recomendado para chaves com restrição de Referer)
    const google = (window as any).google;
    if (google && google.maps && google.maps.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      
      try {
        const response = await geocoder.geocode({ location: { lat, lng } });
        
        if (response && response.results && response.results.length > 0) {
          const firstResult = response.results[0];
          const formattedAddress = firstResult.formatted_address;
          setDetectedAddress(formattedAddress);

          if (!previewOnly) {
            const addressComponents = firstResult.address_components;
            let street = '', number = '', neighborhood = '', city = '', state = '';

            addressComponents.forEach((component: any) => {
              if (component.types.includes('route')) street = component.long_name;
              if (component.types.includes('street_number')) number = component.long_name;
              if (component.types.includes('sublocality') || component.types.includes('sublocality_level_1')) neighborhood = component.long_name;
              if (component.types.includes('administrative_area_level_2')) city = component.long_name;
              if (component.types.includes('administrative_area_level_1')) state = component.short_name;
            });

            updateClientData({ 
              street: street || undefined, number: number || undefined, 
              neighborhood: neighborhood || undefined, city: city || undefined, 
              state: state || undefined, lat, lng 
            });
            setGeocodeStatus('success');
          }
        } else {
          console.warn('Google SDK Geocode: No results found or empty response.');
          if (!previewOnly) setGeocodeStatus('error');
        }
        return;
      } catch (e) {
        console.error('Google SDK Geocode Error:', e);
        // Não retornar aqui para permitir que o fallback de fetch tente, 
        // caso o problema seja apenas no SDK mas a chave ainda funcione via HTTP
      }
    }

    // Fallback: Fetch direto (falha se houver restrição de Referer)
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const firstResult = data.results[0];
        setDetectedAddress(firstResult.formatted_address);

        if (!previewOnly) {
          const addressComponents = firstResult.address_components;
          
          let street = '';
          let number = '';
          let neighborhood = '';
          let city = '';
          let state = '';

          addressComponents.forEach((component: any) => {
            if (component.types.includes('route')) street = component.long_name;
            if (component.types.includes('street_number')) number = component.long_name;
            if (component.types.includes('sublocality') || component.types.includes('sublocality_level_1')) neighborhood = component.long_name;
            if (component.types.includes('administrative_area_level_2')) city = component.long_name;
            if (component.types.includes('administrative_area_level_1')) state = component.short_name;
          });

          updateClientData({ 
            street: street || undefined, 
            number: number || undefined, 
            neighborhood: neighborhood || undefined, 
            city: city || undefined, 
            state: state || undefined,
            lat,
            lng
          });
          setGeocodeStatus('success');
        }
      } else {
        if (!previewOnly) setGeocodeStatus('error');
      }
    } catch (e) {
      if (!previewOnly) setGeocodeStatus('error');
    } finally {
      if (!previewOnly) {
        setIsGeocoding(false);
        setTimeout(() => setGeocodeStatus('idle'), 4000);
      }
    }
  }, [apiKey, updateClientData]);

  /**
   * Geocoding: Address -> Lat/Lng
   */
  const geocodeAddress = useCallback(async (addressOverride?: string) => {
    const { street, number, neighborhood, city, state, zipCode } = clientData;
    
    // Prioritize override, then full address with zip, then components
    const query = addressOverride || [street, number, neighborhood, zipCode, city, state, 'Brasil'].filter(Boolean).join(', ');
    
    if (!query || query.length < 5) return;

    if (!apiKey) {
      console.warn('Google Maps API Key is missing.');
      setGeocodeStatus('error');
      return;
    }

    setIsGeocoding(true);
    setGeocodeStatus('searching');

    // 1. Tentar usar o SDK do Google (Evita CORS e Referer Issues)
    const google = (window as any).google;
    if (google && google.maps && google.maps.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      try {
        const response = await geocoder.geocode({ address: query });
        
        if (response && response.results && response.results.length > 0) {
          const result = response.results[0];
          const coords = result.geometry.location;
          const resultType = result.geometry.location_type === 'ROOFTOP' ? 'success' : 'partial';

          updateClientData({ 
            lat: parseFloat(coords.lat().toFixed(6)), 
            lng: parseFloat(coords.lng().toFixed(6)) 
          });
          setGeocodeStatus(resultType);
        } else {
          console.warn('Google SDK Geocode (Address): No results found.');
          setGeocodeStatus('error');
        }
        return;
      } catch (e) {
        console.error('Google SDK Geocode Error (Address):', e);
        // Fallback para fetch se o SDK falhar
      } finally {
        setIsGeocoding(false);
        setTimeout(() => setGeocodeStatus('idle'), 4000);
      }
    }

    // 2. Fallback: Fetch direto (Pode falhar por CORS no browser)
    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`
      );
      const data = await resp.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const coords = data.results[0].geometry.location;
        const resultType = data.results[0].geometry.location_type === 'ROOFTOP' ? 'success' : 'partial';
        
        updateClientData({ 
          lat: parseFloat(coords.lat.toFixed(6)), 
          lng: parseFloat(coords.lng.toFixed(6)) 
        });
        setGeocodeStatus(resultType);
      } else { 
        setGeocodeStatus('error'); 
      }
    } catch (err) { 
      console.error('Geocoding Fallback Error:', err); 
      setGeocodeStatus('error'); 
    } finally { 
      setIsGeocoding(false); 
      setTimeout(() => setGeocodeStatus('idle'), 4000); 
    }
  }, [apiKey, clientData, updateClientData]);

  return {
    isGeocoding,
    geocodeStatus,
    geocodeAddress,
    reverseGeocode,
    setGeocodeStatus,
    detectedAddress,
    setDetectedAddress
  };
};
