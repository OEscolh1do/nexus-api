import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PVModule, AVAILABLE_MODULES } from '../constants/pvModules';
import { INVERTER_DB } from '@/data/equipment/inverters';
import { MODULE_DB } from '@/data/equipment/modules';
import { supabase } from '@/services/supabase';
import {
    SupabaseInverterSchema,
    SupabaseModuleSchema,
    SupabaseInverterDB,
    SupabaseModuleDB
} from '@/core/schemas/database.schemas';

// --- Types ---
export interface Inverter {
    id: string;
    manufacturer: string;
    model: string;
    nominalPower: number; // kW
    maxInputVoltage: number; // V
    minInputVoltage: number; // V
    maxInputCurrent: number; // A
    maxOutputCurrent: number; // A
    outputVoltage: number; // V
    outputFrequency: number; // Hz
    maxEfficiency: number; // %
    connectionType: string; // 'MONOFÁSICO' | 'BIFÁSICO' | 'TRIFÁSICO'
    weight: number; // kg

    // Engineering Deep Specs (Optional in interface for backward compat, but key for new engine)
    mppts?: number;
    maxIscPerMppt?: number;
    minMpptVoltage?: number;
    maxMpptVoltage?: number;
}

interface EquipmentState {
    modules: PVModule[];
    inverters: Inverter[];
    isLoading: boolean;
    error: string | null;

    addModule: (module: PVModule) => void;
    updateModule: (id: string, module: Partial<PVModule>) => void;
    deleteModule: (id: string) => void;

    addInverter: (inverter: Inverter) => void;
    updateInverter: (id: string, inverter: Partial<Inverter>) => void;
    deleteInverter: (id: string) => void;

    fetchCatalog: () => Promise<void>;
    resetToDefaults: () => void;
}

// --- Mappers (Legacy Local DB) ---
// Note: We keep "any" here only because the JSON constants are loosely typed. 
// Ideally we should fix the JSON sources too, but priority is Remote Data.
const mapInverterDB = (data: any[]): Inverter[] => {
    return data.map(item => ({
        id: item.Modelo.replace(/\s+/g, '-').toLowerCase(),
        manufacturer: item.Fabricante,
        model: item.Modelo,
        nominalPower: Number(item["Potência Nominal"]) / 1000,
        maxInputVoltage: Number(item["Tensão máxima de entrada"]),
        minInputVoltage: Number(item["Tensão mínima de entrada"]),
        maxInputCurrent: Number(item["Corrente Máxima de entrada"]),
        maxOutputCurrent: Number(item["Corrente Máxima de Saída"]),
        outputVoltage: Number(item["Tensão de saída"]),
        outputFrequency: Number(item["Frequência de saída"]),
        maxEfficiency: Number(item["Eficiência Máxima"]),
        connectionType: item["Ligação"] || 'MONOFÁSICO',
        weight: Number(item.Peso),
    }));
};

const mapModuleDB = (data: any[]): PVModule[] => {
    return data.map(db => {
        const dimString = db["Dimensões (mm)"] || "";
        const parts = typeof dimString === 'string' ? dimString.toLowerCase().split('x').map(Number) : [0, 0, 0];

        return {
            id: db.Modelo.replace(/\s+/g, '-').toLowerCase() + '-' + Math.random().toString(36).substr(2, 5),
            manufacturer: db.Fabricante,
            model: db.Modelo,
            supplier: db.Fornecedor,
            type: db.Tipo,
            dimensions: {
                length: parts[0] || 0,
                width: parts[1] || 0,
                thickness: parts[2] || 30
            },
            weight: Number(db.Peso),
            area: Number(db["Área (m²)"]),
            cells: Number(db["Número de células"]),
            electrical: {
                pmax: Number(db["Potência"]),
                efficiency: Number(db["ƞ Módulo"]) * 100,
                imp: Number(db["Imáx"]),
                vmp: Number(db["Vmáx"]),
                isc: Number(db["Isc/Icc"]),
                voc: Number(db["Voc/Vca"]),
                maxFuse: Number(db["Máx. Corr. Fusível (série)"])
            },
            temperature: {
                coeffPmax: Number(db["Coef. Temperatura/°C"])
            },
            warranty: {
                annualDegradation: Number(db["Depreciação a.a."]) * 100
            }
        };
    });
};

// --- Mappers (Supabase Typed) ---
// NOW SECURE: Input is strictly validated `SupabaseInverterDB`
const mapSupabaseInverter = (data: SupabaseInverterDB): Inverter => ({
    id: data.id,
    manufacturer: data.manufacturer,
    model: data.model,
    nominalPower: data.power_ac_watts / 1000, // kW
    maxInputVoltage: data.max_input_voltage,
    minInputVoltage: data.start_voltage, // Fallback handled in Schema
    maxInputCurrent: data.max_input_current,
    maxOutputCurrent: 0, // Placeholder
    outputVoltage: data.phases === 'three' ? 380 : 220,
    outputFrequency: 60,
    maxEfficiency: data.efficiency_percent,
    connectionType: data.phases === 'three' ? 'TRIFÁSICO' : 'MONOFÁSICO',
    weight: data.weight_kg,
    // Deep Specs
    mppts: data.mppts,
    maxIscPerMppt: data.max_isc_per_mppt,
    minMpptVoltage: data.min_mppt_voltage,
    maxMpptVoltage: data.max_mppt_voltage
});

const mapSupabaseModule = (data: SupabaseModuleDB): PVModule => ({
    id: data.id,
    manufacturer: data.manufacturer,
    model: data.model,
    supplier: 'Supabase',
    type: data.technology,
    dimensions: {
        length: data.height_mm,
        width: data.width_mm,
        thickness: data.thickness_mm
    },
    weight: data.weight_kg,
    area: (data.height_mm * data.width_mm) / 1000000,
    cells: data.cells,
    electrical: {
        pmax: data.power_watts,
        efficiency: data.efficiency_percent,
        imp: data.imp,
        vmp: data.vmp,
        isc: data.isc,
        voc: data.voc,
        maxFuse: data.max_series_fuse
    },
    temperature: {
        coeffPmax: data.temp_coeff_pmax_percent
    },
    warranty: {
        annualDegradation: 0.55
    }
});


const INITIAL_MODULES = [...AVAILABLE_MODULES, ...mapModuleDB(MODULE_DB)];
const INITIAL_INVERTERS = mapInverterDB(INVERTER_DB);

export const useEquipmentStore = create<EquipmentState>()(
    persist(
        (set) => ({
            modules: INITIAL_MODULES,
            inverters: INITIAL_INVERTERS,
            isLoading: false,
            error: null,

            addModule: (module) => set((state) => ({ modules: [...state.modules, module] })),
            updateModule: (id, updatedModule) => set((state) => ({
                modules: state.modules.map(m => m.id === id ? { ...m, ...updatedModule } : m)
            })),
            deleteModule: (id) => set((state) => ({ modules: state.modules.filter(m => m.id !== id) })),

            addInverter: (inverter) => set((state) => ({ inverters: [...state.inverters, inverter] })),
            updateInverter: (id, updatedInverter) => set((state) => ({
                inverters: state.inverters.map(i => i.id === id ? { ...i, ...updatedInverter } : i)
            })),
            deleteInverter: (id) => set((state) => ({ inverters: state.inverters.filter(i => i.id !== id) })),

            resetToDefaults: () => set({
                modules: INITIAL_MODULES,
                inverters: INITIAL_INVERTERS,
                error: null
            }),

            fetchCatalog: async () => {
                set({ isLoading: true, error: null });
                try {
                    // 1. RAW Fetch
                    const [invRes, modRes] = await Promise.all([
                        supabase.from('inverters').select('*').eq('is_active', true),
                        supabase.from('modules').select('*').eq('is_active', true)
                    ]);

                    if (invRes.error) throw new Error(`Inverter Fetch Error: ${invRes.error.message}`);
                    if (modRes.error) throw new Error(`Module Fetch Error: ${modRes.error.message}`);

                    // 2. SAFETY CHECK (Zod Parsing)
                    // We use safeParse to handle individual failures gracefully or block weird shapes
                    const rawInverters = invRes.data || [];
                    const rawModules = modRes.data || [];

                    // Validação Inversores
                    const validInverters: Inverter[] = [];
                    const failedInverters: any[] = [];

                    rawInverters.forEach((item: any) => {
                        const parse = SupabaseInverterSchema.safeParse(item);
                        if (parse.success) {
                            validInverters.push(mapSupabaseInverter(parse.data));
                        } else {
                            console.log('--- RAW INVERTER FAILED ---', JSON.stringify(item));
                            console.log('--- ZOD ERROR ---', JSON.stringify(parse.error.format()));
                            failedInverters.push({ id: item.id, model: item.model, errors: parse.error.format() });
                        }
                    });

                    // Validação Módulos
                    const validModules: PVModule[] = [];
                    const failedModules: any[] = [];

                    rawModules.forEach((item: any) => {
                        const parse = SupabaseModuleSchema.safeParse(item);
                        if (parse.success) {
                            validModules.push(mapSupabaseModule(parse.data));
                        } else {
                            failedModules.push({ id: item.id, model: item.model, errors: parse.error.format() });
                        }
                    });

                    // 3. SOCRATIC LOGGING (Se houver falhas, grite no console)
                    if (failedInverters.length > 0 || failedModules.length > 0) {
                        console.error("🚨 [GRAVITY DETECTED] Equipment Catalog Integrity Violation!");
                        console.groupCollapsed("Click to view corrupted items (rejected by Zod)");
                        if (failedInverters.length) console.warn(`Rejected ${failedInverters.length} Inverters:`, failedInverters);
                        if (failedModules.length) console.warn(`Rejected ${failedModules.length} Modules:`, failedModules);
                        console.groupEnd();
                    }

                    // 4. Update Store (Even if some failed, we use the valid ones)
                    // If TOTAL FAILURE (0 valid items but DB had data), we might want to alert UI

                    if (validInverters.length > 0 || validModules.length > 0) {
                        set({
                            inverters: validInverters.length > 0 ? validInverters : INITIAL_INVERTERS,
                            modules: validModules.length > 0 ? validModules : INITIAL_MODULES,
                            isLoading: false
                        });
                    } else {
                        // DB empty or Everything Invalid -> Keep Defaults or Clear?
                        // Keeping defaults is safer for offline resilience
                        console.warn("⚠️ No valid equipment found in remote DB. Using Local Defaults.");
                        set({ isLoading: false });
                    }

                } catch (e: any) {
                    console.error('❌ Supabase Sync Critical Failure:', e);
                    set({
                        error: 'Falha na sincronização. Catálogo offline ativo.',
                        isLoading: false,
                    });
                }
            }
        }),
        {
            name: 'equipment-storage',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.error('⚠️ [Local Storage] Failed to rehydrate Equipment Store. Clearing cache...', error);
                    localStorage.removeItem('equipment-storage');
                    window.location.reload(); // Force a clean slate
                    return;
                }
                if (state) {
                    // Trigger fetch on load
                    state.fetchCatalog();
                }
            }
        }
    )
);
