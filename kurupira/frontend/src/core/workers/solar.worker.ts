/// <reference lib="webworker" />

import { SolarCalculator } from "../domain/SolarCalculator";
import { InMemoryEquipmentRepo } from "@/services/adapters/InMemoryEquipmentRepo";
import { CresesbIrradiationProvider } from "@/services/adapters/CresesbIrradiationProvider";
import { InputData, EngineeringSettings } from "../types";
import { InputDataSchema, EngineeringSettingsSchema } from "../schemas";

const equipmentRepo = new InMemoryEquipmentRepo();
const irradiationProvider = new CresesbIrradiationProvider();
const calculator = new SolarCalculator(irradiationProvider, equipmentRepo);

export interface WorkerCalculatePayload {
    data: InputData;
    settings: EngineeringSettings;
}

self.onmessage = async (e: MessageEvent<{
    id: string;
    type: 'CALCULATE_PROPOSAL';
    payload: WorkerCalculatePayload;
}>) => {
    const { id, type, payload } = e.data;
    if (type !== 'CALCULATE_PROPOSAL') return;

    try {
        // Validate Inputs
        const validatedInput = InputDataSchema.parse(payload.data);
        const validatedSettings = EngineeringSettingsSchema.parse(payload.settings);

        // Execute Calculation
        const result = await calculator.calculate(validatedInput, validatedSettings);
        
        // Post back the success result
        self.postMessage({ id, status: 'success', result });
    } catch (error: any) {
        self.postMessage({ id, status: 'error', error: error.message, stack: error.stack });
    }
};
