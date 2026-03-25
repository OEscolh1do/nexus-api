import { ModuleSpecs, EngineeringSettings } from "@/core/types";
import { InputData } from "@/core/schemas/input.schemas";

export interface SimulationResult {
  monthlyGeneration: number[];
  annualGeneration: number;
  averageGeneration: number;
}

/**
 * Calculates the solar generation based on system specs and location data.
 * Currently uses a simplified model based on HSP and seasonal factors.
 * 
 * @param modules List of selected modules
 * @param clientData Client data including consumption history
 * @param settings Engineering settings (PR, losses)
 * @returns SimulationResult object with monthly/annual generation
 */
export const calculateGeneration = (
  modules: ModuleSpecs[],
  clientData: InputData,
  settings: EngineeringSettings
): SimulationResult => {
  // 1. Calculate System Power (kWp)
  const systemPowerKWp = modules.reduce((acc, m) => acc + (m.power), 0) / 1000;

  if (systemPowerKWp === 0) {
    return {
      monthlyGeneration: Array(12).fill(0),
      annualGeneration: 0,
      averageGeneration: 0
    };
  }

  // 2. Constants & Factors
  // TODO: Retrieve real HSP from clientData.weatherData or lat/lng API
  // For now, using the fallback logic similar to SimulationPreview
  const avgHsp = 4.5; 
  const daysPerMonth = 30; // Simplified
  
  // Seasonal curve for Brazil (South Hemisphere)
  // Higher in Summer (Dec-Feb), Lower in Winter (Jun-Aug)
  const seasonalFactors = [1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15];

  // 3. Calculate Monthly Generation
  const monthlyGeneration = seasonalFactors.map((factor, index) => {
    // Basic Formula: E = Power * HSP * Days * PR
    // We multiply by factor to simulate seasonality
    // We should use specific monthly HSP if available in clientData.monthlyIrradiation
    
    let hsp = avgHsp;
    
    // Check if we have real monthly irradiation data
    if (clientData.monthlyIrradiation && clientData.monthlyIrradiation.length === 12) {
       // If data is valid (sum > 0), use it instead of factor * avg
       const sumIrradiation = clientData.monthlyIrradiation.reduce((a, b) => a + b, 0);
       if (sumIrradiation > 0) {
          hsp = clientData.monthlyIrradiation[index];
          // If we use real HSP, we don't apply the synthetic seasonal factor again? 
          // Usually HSP already includes seasonality.
          // So if real data exists: E = Power * RealHSP * Days * PR
          return systemPowerKWp * hsp * daysPerMonth * settings.performanceRatio;
       }
    }
    
    // Fallback calculation
    return systemPowerKWp * daysPerMonth * hsp * factor * settings.performanceRatio;
  });

  // 4. Aggregates
  const annualGeneration = monthlyGeneration.reduce((acc, val) => acc + val, 0);
  const averageGeneration = annualGeneration / 12;

  return {
    monthlyGeneration,
    annualGeneration,
    averageGeneration
  };
};
