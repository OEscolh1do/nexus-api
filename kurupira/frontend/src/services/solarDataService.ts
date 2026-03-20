/**
 * SOLAR-DATA-SERVICE.TS
 * 
 * Serviço utilitário para manipulação e cálculo de dados de irradiação solar.
 * Centraliza tipos e lógica de negócio para cálculo de médias e validação.
 */

export interface SolarDataSource {
    name: 'CRESESB' | 'INPE' | 'MANUAL';
    url?: string;
    label: string;
}

export const SOLAR_SOURCES: Record<string, SolarDataSource> = {
    CRESESB: {
        name: 'CRESESB',
        url: 'http://cresesb.cepel.br/index.php?section=sundata',
        label: 'CRESESB (Normativo)'
    },
    INPE: {
        name: 'INPE',
        url: 'http://labren.ccst.inpe.br/atlas_2017.html',
        label: 'INPE (Atlas 2017)'
    }
};

/**
 * Calcula a média anual a partir de um array mensal.
 * Ignora valores zero ou inválidos se strict=false, ou considera 0 no cálculo se strict=true.
 * Para HSP, geralmente queremos a média simples dos 12 meses.
 */
export const calculateAnnualAverage = (monthlyData: number[]): number => {
    if (!monthlyData || monthlyData.length === 0) return 0;
    
    // Filtra valores inválidos para evitar NaN
    const validData = monthlyData.map(v => isNaN(v) ? 0 : v);
    
    const total = validData.reduce((acc, val) => acc + val, 0);
    return total / 12; // Sempre divide por 12 para média anual padrão
};

/**
 * Valida se um input é um número de irradiação aceitável (0 a 10 aprox).
 */
export const isValidIrradiationValue = (val: number): boolean => {
    return !isNaN(val) && val >= 0 && val <= 14; 
};

// --- PRESETS DE CIDADES ---

export interface CityPreset {
    id: string;
    name: string;
    data: number[];
}

export const DEFAULT_CITIES: CityPreset[] = [
    {
        id: 'parauapebas_pa',
        name: 'Parauapebas (PA)',
        // [4.32, 4.46, 4.58, 4.73, 4.98, 5.29, 5.34, 5.72, 5.19, 4.72, 4.32, 4.16]
        data: [4.32, 4.46, 4.58, 4.73, 4.98, 5.29, 5.34, 5.72, 5.19, 4.72, 4.32, 4.16]
    },
    {
        id: 'belem_pa',
        name: 'Belém (PA)',
        // [4.24, 4.17, 4.25, 4.35, 4.64, 4.98, 5.04, 5.20, 5.21, 5.00, 4.81, 4.43]
        data: [4.24, 4.17, 4.25, 4.35, 4.64, 4.98, 5.04, 5.20, 5.21, 5.00, 4.81, 4.43]
    }
];

const STORAGE_KEY = 'solar_city_presets';

// Validador simples para garantir integridade
const validateCityData = (city: any): city is CityPreset => {
    return (
        city &&
        typeof city.id === 'string' &&
        typeof city.name === 'string' &&
        Array.isArray(city.data) &&
        city.data.length === 12 &&
        city.data.every((n: any) => typeof n === 'number' && !isNaN(n))
    );
};

export const getSavedCities = (): CityPreset[] => {
    if (typeof window === 'undefined') return DEFAULT_CITIES; // SSR safety

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return DEFAULT_CITIES;

        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return DEFAULT_CITIES;

        // Filtra apenas cidades válidas para evitar crash no UI
        const validCities = parsed.filter(validateCityData);
        
        // Retorna Default + Salvas (evitando duplicatas de ID se houver colisão)
        return [...DEFAULT_CITIES, ...validCities];
    } catch (e) {
        console.warn("SolarDataService: Erro ao recuperar cidades salvas. Resetando para padrão.", e);
        // Em caso de corrupção severa, limpamos para recuperar a usabilidade
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
        return DEFAULT_CITIES;
    }
};

export const saveCity = (name: string, data: number[]): CityPreset[] => {
    try {
        // Validação de entrada
        if (!name || !data || data.length !== 12 || !data.every(n => typeof n === 'number')) {
            console.error("Tentativa de salvar cidade com dados inválidos");
            return getSavedCities();
        }

        const currentSaved = getSavedCities().filter(c => !DEFAULT_CITIES.some(d => d.id === c.id));
        
        const newPreset: CityPreset = {
            id: 'custom_' + Date.now().toString(36), // ID seguro
            name: name.trim(),
            data: [...data] // Clone para segurança
        };
        
        const updatedList = [...currentSaved, newPreset];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        
        return [...DEFAULT_CITIES, ...updatedList];
    } catch (e) {
        console.error("SolarDataService: Falha ao salvar cidade", e);
        return getSavedCities();
    }
};

/**
 * Estima a temperatura mensal com base na latitude.
 * Regra simplificada para Brasil:
 * - Latitude > -18 (Norte/Nordeste/CO): Clima Tropical (Quente e constante)
 * - Latitude <= -18 (Sul/Sudeste): Clima Subtropical (Verão quente, Inverno frio)
 */
export const getEstimatedTemperature = (lat: number) => {
    const isTropical = lat > -18;
    
    // Gerador determinístico baseado na latitude para consistência
    // (Mesma lat sempre gera mesmos "aleatórios")
    const seed = Math.abs(lat * 100); 
    const random = (i: number) => ((seed + i) * 9301 + 49297) % 233280 / 233280;

    let monthly: number[] = [];

    if (isTropical) {
        // Tropical: Média 28°C, variação pequena
        for (let i = 0; i < 12; i++) {
            monthly.push(26 + random(i) * 6); // 26°C a 32°C
        }
    } else {
        // Subtropical: Senoidal. 
        // Jan(0)=Verão, Jun(5)/Jul(6)=Inverno.
        for (let i = 0; i < 12; i++) {
            // Pico no verão (Jan/Dez), Vale no inverno (Jun/Jul)
            // Cosine curve: cos(0) = 1 (Jan), cos(PI) = -1 (Jul)
            // Ajuste de fase para alinhar com meses (aprox)
            const seasonality = Math.cos((i / 11) * Math.PI * 2); 
            // Variação de 15°C a 30°C: Média 22.5, Amplitude 7.5
            // Invertendo fase se necessário (Jan é quente no hemisfério sul)
            // Cosine normal tem pico no 0.
            const temp = 22.5 + (seasonality * 7.5) + (random(i) * 2);
            monthly.push(temp);
        }
    }

    const min = Math.min(...monthly);
    const max = Math.max(...monthly);
    const avg = monthly.reduce((a, b) => a + b, 0) / 12;

    return { monthly, min, max, avg };
};
