import { validateSystemStrings, type MPPTInput, type SystemValidationReport, type ModuleElectricalSpecs } from '@/modules/engineering/utils/electricalMath';

export interface SimulationPayload {
  systemPowerKWp: number;
  performanceRatio: number;
  clientConsumption: number[];
  // P6-3: Optional electrical validation params
  electrical?: {
    mpptConfigs: MPPTInput[];
    moduleSpecs: ModuleElectricalSpecs & { isc: number };
    minAmbientTemp: number;
  };
}

export interface SimulationResponse {
  monthlyGeneration: number[];
  monthlyConsumption: number[];
  totalAnnualGeneration: number;
  totalAnnualConsumption: number;
  // P6-3: Electrical validation result (null if not requested)
  electricalValidation: SystemValidationReport | null;
}

// Synthetic Hourly Simulation (8760 hours)
function simulate8760(payload: SimulationPayload): SimulationResponse {
  const { systemPowerKWp, performanceRatio, clientConsumption } = payload;
  
  // Return early if no system power
  if (systemPowerKWp <= 0) {
    return {
      monthlyGeneration: Array(12).fill(0),
      monthlyConsumption: clientConsumption,
      totalAnnualGeneration: 0,
      totalAnnualConsumption: clientConsumption.reduce((a, b) => a + b, 0),
      electricalValidation: null,
    };
  }

  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const seasonalFactors = [1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15];
  const hspBase = 4.5;
  
  const monthlyGeneration = Array(12).fill(0);
  let hourOfYear = 0;

  for (let month = 0; month < 12; month++) {
    const days = daysPerMonth[month];
    const factor = seasonalFactors[month];
    
    // Simulate each day of the month
    for (let day = 0; day < days; day++) {
      // Simulate each hour of the day (0-23)
      for (let hour = 0; hour < 24; hour++) {
        // Simple bell curve logic (Sun is up from 6:00 to 18:00)
        let hourlyIrradiance = 0;
        if (hour > 6 && hour < 18) {
           // Simulate a parabolic curve for daylight hours
           const peak = 12; // noon
           const distance = Math.abs(hour - peak);
           // Base amplitude normalized so sum over day ≈ hspBase * factor
           // This is a rough estimation.
           hourlyIrradiance = Math.max(0, 1 - (distance / 6)) * (hspBase / 6) * factor;
        }

        const hourlyGeneration = systemPowerKWp * hourlyIrradiance * performanceRatio;
        
        monthlyGeneration[month] += hourlyGeneration;
        
        hourOfYear++; // Track 8760 progression
      }
    }
  }

  // To prove it's a worker, optionally add some raw artificial delay if you want to test UI freezing
  // let dummy = 0; for(let i=0; i<10000000; i++) dummy += Math.random();

  return {
    monthlyGeneration,
    monthlyConsumption: clientConsumption,
    totalAnnualGeneration: monthlyGeneration.reduce((a, b) => a + b, 0),
    totalAnnualConsumption: clientConsumption.reduce((a, b) => a + b, 0),
    electricalValidation: null,
  };
}

// Setup IPC listener
self.onmessage = (e: MessageEvent<SimulationPayload>) => {
  try {
    const result = simulate8760(e.data);

    // P6-3: Run electrical validation if params provided
    let electricalValidation: SystemValidationReport | null = null;
    if (e.data.electrical) {
      const { mpptConfigs, moduleSpecs, minAmbientTemp } = e.data.electrical;
      electricalValidation = validateSystemStrings(mpptConfigs, moduleSpecs, minAmbientTemp);
    }

    self.postMessage({ success: true, result: { ...result, electricalValidation } });
  } catch (error) {
    self.postMessage({ success: false, error: (error as Error).message });
  }
};
