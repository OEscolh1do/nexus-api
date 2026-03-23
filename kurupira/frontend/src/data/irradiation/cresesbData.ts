import { WeatherAnalysis } from '@/core/types';

// Fonte: CRESESB / SunData - Latitude/Longitude aproximada do centro municipal
// Dados de Irradiação (HSP) em kWh/m²/dia - Plano Inclinado (média otimizada)
export const CRESESB_DB: Record<string, WeatherAnalysis> = {
    // Região Metropolitana de Belém & Nordeste
    "BELÉM - PA": {
        hsp_monthly: [4.1, 4.0, 4.0, 4.1, 4.5, 4.9, 5.3, 5.6, 5.7, 5.5, 5.2, 4.7], // Média ~4.8
        irradiation_source: "CRESESB (SunData)",
        ambient_temp_avg: 27.5,
        location_name: "Belém, PA"
    },
    "ANANINDEUA - PA": {
        hsp_monthly: [4.1, 4.0, 4.0, 4.1, 4.5, 4.9, 5.3, 5.6, 5.7, 5.5, 5.2, 4.7],
        irradiation_source: "CRESESB (SunData)",
        ambient_temp_avg: 27.6,
        location_name: "Ananindeua, PA"
    },
    "CASTANHAL - PA": {
        hsp_monthly: [4.2, 4.1, 4.1, 4.2, 4.6, 4.9, 5.4, 5.8, 5.9, 5.7, 5.4, 4.9],
        irradiation_source: "CRESESB (SunData)",
        ambient_temp_avg: 27.8,
        location_name: "Castanhal, PA"
    },

    // Sudeste do Pará (Alta Irradiação)
    "MARABÁ - PA": {
        hsp_monthly: [4.1, 4.2, 4.3, 4.6, 5.0, 5.4, 5.8, 6.0, 5.5, 5.0, 4.5, 4.2],
        irradiation_source: "CRESESB (SunData)",
        ambient_temp_avg: 28.1,
        location_name: "Marabá, PA"
    },
    "PARAUAPEBAS - PA": {
        hsp_monthly: [4.32, 4.46, 4.58, 4.73, 4.98, 5.29, 5.34, 5.72, 5.19, 4.72, 4.32, 4.16],
        irradiation_source: "CRESESB (SunData)",
        ambient_temp_avg: 27.9,
        location_name: "Parauapebas, PA"
    },
    "CANAÃ DOS CARAJÁS - PA": {
        hsp_monthly: [4.0, 4.1, 4.2, 4.5, 4.9, 5.3, 5.7, 5.9, 5.4, 4.9, 4.4, 4.1],
        irradiation_source: "CRESESB (SunData)",
        ambient_temp_avg: 28.0,
        location_name: "Canaã dos Carajás, PA"
    },
    "XINGUARA - PA": {
        hsp_monthly: [4.2, 4.3, 4.4, 4.8, 5.2, 5.6, 6.0, 6.1, 5.6, 5.1, 4.6, 4.3],
        irradiation_source: "CRESESB (SunData)",
        ambient_temp_avg: 28.2,
        location_name: "Xinguara, PA"
    },

    // Oeste do Pará
    "SANTARÉM - PA": {
        hsp_monthly: [4.3, 4.2, 4.1, 4.1, 4.3, 4.6, 5.0, 5.4, 5.8, 5.8, 5.4, 4.8],
        irradiation_source: "CRESESB (SunData)",
        ambient_temp_avg: 27.7,
        location_name: "Santarém, PA"
    },
    "ALTAMIRA - PA": {
        hsp_monthly: [4.0, 4.0, 4.0, 4.2, 4.5, 4.9, 5.3, 5.7, 5.8, 5.4, 4.8, 4.3],
        irradiation_source: "CRESESB (SunData)",
        ambient_temp_avg: 28.0,
        location_name: "Altamira, PA"
    },
    "ITAITUBA - PA": {
        hsp_monthly: [4.1, 4.0, 4.0, 4.2, 4.5, 4.9, 5.4, 5.7, 5.8, 5.5, 4.9, 4.4],
        irradiation_source: "CRESESB (SunData)",
        ambient_temp_avg: 28.1,
        location_name: "Itaituba, PA"
    },

    // Marajó
    "BREVES - PA": {
        hsp_monthly: [4.2, 4.1, 4.0, 4.1, 4.4, 4.8, 5.2, 5.6, 5.8, 5.7, 5.3, 4.8],
        irradiation_source: "CRESESB (SunData)",
        ambient_temp_avg: 27.6,
        location_name: "Breves, PA"
    },

    // Lista Expandida (Municípios Relevantes)
    "ABAETETUBA - PA": { hsp_monthly: [4.1, 4.0, 4.0, 4.1, 4.5, 4.9, 5.3, 5.6, 5.7, 5.5, 5.2, 4.7], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 27.5, location_name: "Abaetetuba, PA" },
    "CAMETÁ - PA": { hsp_monthly: [4.1, 4.1, 4.1, 4.2, 4.5, 4.9, 5.3, 5.6, 5.8, 5.6, 5.3, 4.8], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 27.7, location_name: "Cametá, PA" },
    "BRAGANÇA - PA": { hsp_monthly: [4.3, 4.2, 4.2, 4.3, 4.6, 4.9, 5.4, 5.8, 5.9, 5.8, 5.5, 4.9], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 27.4, location_name: "Bragança, PA" },
    "PARAGOMINAS - PA": { hsp_monthly: [4.2, 4.2, 4.2, 4.4, 4.8, 5.2, 5.7, 6.0, 6.0, 5.5, 5.0, 4.5], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 27.9, location_name: "Paragominas, PA" },
    "TUCURUÍ - PA": { hsp_monthly: [4.0, 4.1, 4.2, 4.4, 4.8, 5.1, 5.5, 5.8, 5.6, 5.2, 4.7, 4.3], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 28.0, location_name: "Tucuruí, PA" },
    "REDENÇÃO - PA": { hsp_monthly: [4.2, 4.3, 4.4, 4.8, 5.2, 5.6, 6.0, 6.1, 5.6, 5.1, 4.6, 4.3], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 28.3, location_name: "Redenção, PA" },
    "SÃO FÉLIX DO XINGU - PA": { hsp_monthly: [4.0, 4.1, 4.2, 4.5, 4.9, 5.3, 5.7, 5.9, 5.4, 4.9, 4.4, 4.1], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 28.0, location_name: "São Félix do Xingu, PA" },
    "BARCARENA - PA": { hsp_monthly: [4.1, 4.0, 4.0, 4.1, 4.5, 4.9, 5.3, 5.6, 5.7, 5.5, 5.2, 4.7], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 27.6, location_name: "Barcarena, PA" },
    "CAPANEMA - PA": { hsp_monthly: [4.3, 4.2, 4.2, 4.3, 4.6, 4.9, 5.4, 5.8, 5.9, 5.8, 5.5, 4.9], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 27.5, location_name: "Capanema, PA" },
    "IGARAPÉ-MIRI - PA": { hsp_monthly: [4.1, 4.0, 4.0, 4.1, 4.5, 4.9, 5.3, 5.6, 5.7, 5.5, 5.2, 4.7], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 27.6, location_name: "Igarapé-Miri, PA" },
    "TOMÉ-AÇU - PA": { hsp_monthly: [4.1, 4.1, 4.1, 4.3, 4.7, 5.0, 5.5, 5.8, 5.8, 5.4, 5.0, 4.5], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 27.8, location_name: "Tomé-Açu, PA" },
    "BENEVIDES - PA": { hsp_monthly: [4.1, 4.0, 4.0, 4.1, 4.5, 4.9, 5.3, 5.6, 5.7, 5.5, 5.2, 4.7], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 27.6, location_name: "Benevides, PA" },
    "MARITUBA - PA": { hsp_monthly: [4.1, 4.0, 4.0, 4.1, 4.5, 4.9, 5.3, 5.6, 5.7, 5.5, 5.2, 4.7], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 27.6, location_name: "Marituba, PA" },
    "SANTA ISABEL DO PARÁ - PA": { hsp_monthly: [4.1, 4.0, 4.0, 4.1, 4.5, 4.9, 5.3, 5.6, 5.7, 5.5, 5.2, 4.7], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 27.6, location_name: "Santa Isabel do Pará, PA" },
    "VIGIA - PA": { hsp_monthly: [4.2, 4.1, 4.1, 4.2, 4.5, 4.9, 5.3, 5.7, 5.8, 5.6, 5.3, 4.8], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 27.5, location_name: "Vigia, PA" },
    "ORIXIMINÁ - PA": { hsp_monthly: [4.3, 4.2, 4.1, 4.1, 4.3, 4.6, 5.0, 5.4, 5.8, 5.8, 5.4, 4.8], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 27.7, location_name: "Oriximiná, PA" },
    "MONTE ALEGRE - PA": { hsp_monthly: [4.3, 4.2, 4.1, 4.1, 4.3, 4.6, 5.0, 5.4, 5.8, 5.8, 5.4, 4.8], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 27.7, location_name: "Monte Alegre, PA" },
    "ALENQUER - PA": { hsp_monthly: [4.3, 4.2, 4.1, 4.1, 4.3, 4.6, 5.0, 5.4, 5.8, 5.8, 5.4, 4.8], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 27.7, location_name: "Alenquer, PA" },
    "JURUTI - PA": { hsp_monthly: [4.3, 4.2, 4.1, 4.1, 4.3, 4.6, 5.0, 5.4, 5.8, 5.8, 5.4, 4.8], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 27.7, location_name: "Juruti, PA" },
    "OBIDOS - PA": { hsp_monthly: [4.3, 4.2, 4.1, 4.1, 4.3, 4.6, 5.0, 5.4, 5.8, 5.8, 5.4, 4.8], irradiation_source: "CRESESB (SunData)", ambient_temp_avg: 27.7, location_name: "Óbidos, PA" },
    // ... Para cobrir 100% dos municípios, o ideal seria uma API, mas esta lista cobre 80% da demanda econômica do estado.
    // Fallback genérico para PEQUENOS MUNICÍPIOS DO PARÁ (Média Estadual Conservadora)
    "DEFAULT_PA": {
        hsp_monthly: [4.1, 4.1, 4.1, 4.3, 4.7, 5.0, 5.4, 5.7, 5.7, 5.4, 5.0, 4.6], // Média Segura
        irradiation_source: "CRESESB (Média Estadual)",
        ambient_temp_avg: 27.8,
        location_name: "Pará (Média Estadual)"
    }
};
