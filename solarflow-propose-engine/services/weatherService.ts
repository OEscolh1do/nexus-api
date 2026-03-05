
import { GoogleGenAI, Type } from "@google/genai";
import { WeatherAnalysis } from '../types';
import { CRESESB_DB } from './cresesbData';

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
    apiKey: string
): Promise<WeatherAnalysis> => {
    // 1. Tentar Banco de Dados Local (CRESESB)
    const cityKey = normalizeCity(city, state);
    console.log(`Searching CRESESB for: ${cityKey}`);

    // Tentativa exata
    if (CRESESB_DB[cityKey]) {
        console.log("Found in CRESESB DB:", cityKey);
        return CRESESB_DB[cityKey];
    }

    // Tentativa aproximada (busca parcial no mapa)
    const simpleName = normalizeCitySimple(city);
    const foundKey = Object.keys(CRESESB_DB).find(k => normalizeCitySimple(k).includes(simpleName) && k.includes(state.toUpperCase()));

    if (foundKey) {
        console.log("Found approximate in CRESESB DB:", foundKey);
        return CRESESB_DB[foundKey];
    }

    // Fallback Estadual se for PA
    if (state.toUpperCase().trim() === 'PA' || state.toUpperCase().trim() === 'PARA') {
        console.log("Using PA State Average");
        return {
            ...CRESESB_DB["DEFAULT_PA"],
            location_name: `${city} - PA (Média Estadual)`
        };
    }

    // 2. Tentar API (apenas se for fora do estado mapeado)
    try {
        if (!apiKey) throw new Error("API Key missing");

        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Analise o potencial fotovoltaico detalhado para as coordenadas Latitude: ${lat}, Longitude: ${lng}. 
    Cidade: ${city}, Estado: ${state}.
    Retorne estritamente em JSON:
    1. hsp_monthly: um array de 12 números (Jan a Dez) representando a irradiação solar média diária (HSP em kWh/m²/dia).
    2. irradiation_source: string citando a fonte científica (ex: NASA POWER).
    3. ambient_temp_avg: temperatura média local anual (°C).
    4. location_name: confirmação do nome do local/bairro.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        hsp_monthly: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                        irradiation_source: { type: Type.STRING },
                        ambient_temp_avg: { type: Type.NUMBER },
                        location_name: { type: Type.STRING }
                    },
                    required: ["hsp_monthly", "irradiation_source"]
                }
            }
        });

        if (!response.text) throw new Error("Empty response");

        return JSON.parse(response.text) as WeatherAnalysis;

    } catch (error: any) {
        console.warn("Weather API Failed. Using Mock Fallback.", error);

        return {
            hsp_monthly: [4.5, 4.6, 4.8, 5.1, 5.3, 5.4, 5.5, 5.8, 5.9, 5.6, 5.2, 4.8],
            irradiation_source: "Dados Médios de Engenharia (Offline)",
            ambient_temp_avg: 27.5,
            location_name: `${city} - ${state} (Offline)`
        };
    }
};
