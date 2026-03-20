import { z } from 'zod';

// Schema para Dados de Irradiação (HSP)
const IrradiationDataSchema = z.object({
  monthly: z.array(z.number()),
  annualAverage: z.number(),
  bestTilt: z.string(),
  source: z.string(),
});

// Schema para Dados Climáticos (Temperatura)
const TemperatureDataSchema = z.object({
  monthly: z.array(z.number()),
  annualAverage: z.number(),
  min: z.number(),
  max: z.number(),
});

// Resposta Composta
export const CresesbResponseSchema = z.object({
  irradiation: IrradiationDataSchema,
  temperature: TemperatureDataSchema,
});

export type CresesbResponse = z.infer<typeof CresesbResponseSchema>;

/**
 * Serviço para buscar dados climáticos do CRESESB.
 * Simula dados diferentes baseados na Latitude para provar dinamismo.
 */
export const fetchCresesbHSP = async (
  lat: number,
  _lng: number,
  orientation: string = 'N' // Default Norte
): Promise<CresesbResponse> => {
  // Simulação de latência de rede (Atrito Cognitivo: network is unreliable)
  await new Promise(resolve => setTimeout(resolve, 600));

  // Lógica de Simulação Geográfica (Mock Inteligente)
  const isNorth = lat > -15; // Regra simples: Acima de Brasília = "Norte/Nordeste"

  // Perfil A: Norte/Nordeste (Sol Forte, Temp Alta)
  const profileNorth: CresesbResponse = {
    irradiation: {
      monthly: [5.82, 5.95, 5.60, 5.25, 5.45, 5.30, 5.50, 6.10, 6.35, 6.40, 6.15, 5.90],
      annualAverage: 5.81,
      bestTilt: `9º ${orientation}`,
      source: `CRESESB (Lat ${lat.toFixed(1)})`
    },
    temperature: {
      monthly: [28, 28, 27, 27, 26, 26, 25, 26, 27, 28, 29, 29], // Variação baixa
      annualAverage: 27.2,
      min: 25,
      max: 29
    }
  };

  // Perfil B: Sul/Sudeste/Centro (Sazonalidade maior)
  const profileSouth: CresesbResponse = {
    irradiation: {
      monthly: [5.2, 5.0, 4.8, 4.2, 3.8, 3.5, 3.6, 4.1, 4.5, 4.9, 5.1, 5.3],
      annualAverage: 4.50,
      bestTilt: `22º ${orientation}`,
      source: `CRESESB (Lat ${lat.toFixed(1)})`
    },
    temperature: {
      monthly: [25, 25, 23, 20, 17, 15, 14, 16, 19, 21, 23, 24], // Inverno marcado
      annualAverage: 20.1,
      min: 14,
      max: 25
    }
  };

  const data = isNorth ? profileNorth : profileSouth;

  // Validação Zod na fronteira
  return CresesbResponseSchema.parse(data);
};
