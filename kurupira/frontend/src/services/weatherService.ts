import { WeatherAnalysis } from '@/core/types';
import { CRESESB_DB } from '@/data/irradiation/cresesbData';

// NASA POWER Configuration
const NASA_BASE_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point";

/**
 * Mapeia as chaves de string da NASA para o array de meses 0-11
 */
const mapNasaToMonthlyArray = (nasaData: Record<string, number>): number[] => {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return months.map(m => nasaData[m] || 0);
};

// Normalizar nome da cidade para busca (sem acentos, uppercase)
const normalizeCity = (city: string, state: string) => {
    return `${city.toUpperCase().trim()} - ${state.toUpperCase().trim()}`;
};

const normalizeCitySimple = (city: string) => {
    return city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
};

export const fetchWeatherAnalysis = async (
    lat: number,
    lng: number,
    city: string,
    state: string,
    _apiKey?: string // Mantido por compatibilidade de assinatura, mas não usado
): Promise<WeatherAnalysis> => {
    // 1. Tentar Banco de Dados Local (CRESESB) para HSP rápido no Pará
    const cityKey = normalizeCity(city, state);
    let localData: WeatherAnalysis | null = null;

    if (CRESESB_DB[cityKey]) {
        localData = CRESESB_DB[cityKey];
    } else {
        const simpleName = normalizeCitySimple(city);
        const foundKey = Object.keys(CRESESB_DB).find(k => 
            normalizeCitySimple(k).includes(simpleName) && k.includes(state.toUpperCase())
        );
        if (foundKey) localData = CRESESB_DB[foundKey];
    }

    // Se não encontrou no Pará, tenta o fallback regional do CRESESB
    if (!localData && (state.toUpperCase().trim() === 'PA' || state.toUpperCase().trim() === 'PARA')) {
        localData = {
            ...CRESESB_DB["DEFAULT_PA"],
            location_name: `${city} - PA (Média Estadual)`
        };
    }

    // 2. Tentar API NASA POWER para Temperatura e HSP (Climatologia Global)
    try {
        const url = `${NASA_BASE_URL}?parameters=T2M,ALLSKY_SFC_SW_DWN&community=RE&longitude=${lng}&latitude=${lat}&format=JSON`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("NASA API connection failed");
        
        const data = await response.json();
        const nasaParams = data.properties?.parameter;

        if (!nasaParams) throw new Error("NASA response invalid");

        const hspMonthly = mapNasaToMonthlyArray(nasaParams.ALLSKY_SFC_SW_DWN);
        const tempMonthly = mapNasaToMonthlyArray(nasaParams.T2M);
        const avgTempAnual = nasaParams.T2M.ANN || (tempMonthly.reduce((a, b) => a + b, 0) / 12);
        const hspMonthlyFinal = localData?.hsp_monthly || hspMonthly;
        const hspAvg = hspMonthlyFinal.reduce((a, b) => a + b, 0) / 12;

        return {
            // Prioriza CRESESB para HSP se for do Pará (mais calibrado regionalmente)
            hsp_monthly: hspMonthlyFinal,
            temp_monthly: tempMonthly,
            ambient_temp_avg: avgTempAnual,
            hsp_avg: hspAvg,
            irradiation_source: localData ? "CRESESB + NASA (Temp)" : "NASA POWER API",
            location_name: localData?.location_name || `${city}, ${state}`
        };

    } catch (error: any) {
        console.warn("NASA API Failed. Using CRESESB or Fixed Fallback.", error);

        const hspFallback = localData?.hsp_monthly || [4.5, 4.6, 4.8, 5.1, 5.3, 5.4, 5.5, 5.8, 5.9, 5.6, 5.2, 4.8];
        const hspAvgFallback = hspFallback.reduce((a, b) => a + b, 0) / 12;

        // Fallback final
        return {
            hsp_monthly: hspFallback,
            temp_monthly: [26.5, 26.3, 26.5, 26.7, 27.2, 27.5, 27.6, 27.8, 27.9, 27.8, 27.6, 27.1],
            hsp_avg: hspAvgFallback,
            irradiation_source: localData ? `${localData.irradiation_source} (Offline)` : "Dados Médios (Offline)",
            ambient_temp_avg: localData?.ambient_temp_avg || 27.5,
            location_name: localData?.location_name || `${city} - ${state} (Offline)`
        };
    }
};
