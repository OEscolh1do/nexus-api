export * from "../schemas/input.schemas";
export * from "../schemas/settings.schemas";
export * from "../schemas/equipment.schemas";
export * from "../schemas/output.schemas";
export * from "../schemas/proposal.schemas";

// Re-export specific types if they are not automatically exported or if we want to alias them
// But Zod inference largely handles it.
// We might need to manually define ViewState as it was an Enum in original types.ts
export enum ViewState {
  FORM = 'FORM',
  ENERGY_FLUX = 'ENERGY_FLUX',
  TECH_CONFIG = 'TECH_CONFIG',
  ANALYSIS = 'ANALYSIS',
  SERVICE_COMPOSITION = 'SERVICE_COMPOSITION',
  PREVIEW = 'PREVIEW'
}

export type ConnectionType = 'monofasico' | 'bifasico' | 'trifasico';

export interface WeatherAnalysis {
  hsp_monthly: number[];
  irradiation_source: string;
  ambient_temp_avg: number;
  location_name: string;
}
