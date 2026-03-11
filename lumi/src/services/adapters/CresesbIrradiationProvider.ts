import { IIrradiationProvider, IrradiationData } from "../../core/ports/IIrradiationProvider";
import { CRESESB_DB } from "../../data/irradiation/cresesbData";
import { WeatherAnalysis } from "../../core/types";

export class CresesbIrradiationProvider implements IIrradiationProvider {
  async getByCity(city: string, state: string): Promise<IrradiationData> {
    const normalize = (str: string) => str.toUpperCase().trim();
    const cityKey = `${normalize(city)} - ${normalize(state)}`; // CRESESB_DB keys are like "BELÉM - PA"
    
    // Original solarEngine used separate IRRADIATION_DB with different keys and hardcoded logic.
    // But data/cresesbData.ts has keys like "BELÉM - PA".
    // I need to match the lookup logic.
    // App passed separate city and state.
    
    // Fallback logic
    let entry: WeatherAnalysis | undefined = CRESESB_DB[cityKey];
    
    if (!entry) {
        // Try state capital? CRESESB_DB has limited entries.
        // Try finding by state suffix?
        const stateSuffix = ` - ${normalize(state)}`;
        const foundKey = Object.keys(CRESESB_DB).find(k => k.endsWith(stateSuffix));
        if (foundKey) entry = CRESESB_DB[foundKey];
    }
    
    if (!entry) {
        // Default to PA
        entry = CRESESB_DB["DEFAULT_PA"];
    }

    if (!entry) throw new Error(`Could not find irradiation data for ${city}, ${state}`);

    return {
        monthly: entry.hsp_monthly,
        source: entry.irradiation_source
    };
  }
}
