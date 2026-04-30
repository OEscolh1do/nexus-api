import { useMemo } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useCatalogStore } from '@/modules/engineering/store/useCatalogStore';
import { calculateCompatibilityMetrics, InverterCompatibilityResult } from '../utils/compatibilityMath';
import type { InverterCatalogItem } from '@/core/schemas/inverterSchema';
import type { ModuleElectricalSpecs } from '../utils/electricalMath';

export type DecoratedInverterCatalogItem = InverterCatalogItem & {
    compatibility: InverterCompatibilityResult | null;
};

// Tabelas de contingência para temperatura
const ESTADOS_TROPICAIS = new Set(['AM','PA','RR','AP','AC','RO','TO','MA','PI','CE','RN','PB','PE','AL','SE','BA']);
const TMIN_POR_UF: Record<string, number> = {
    RS: 0, SC: 2, PR: 5, SP: 8, MG: 8, RJ: 12, ES: 12,
    MS: 8, GO: 10, DF: 8, MT: 15,
    BA: 15, SE: 18, AL: 18, PE: 18, PB: 18, RN: 18,
    CE: 20, PI: 20, MA: 22, TO: 20,
    PA: 22, AM: 22, AC: 20, RO: 20, RR: 22, AP: 22,
};

const resolveTemps = (settings: any, clientData: any) => {
    const uf = clientData?.state ?? '';
    const isTropical = ESTADOS_TROPICAIS.has(uf);
    const tmin = settings?.manualTmin ?? TMIN_POR_UF[uf] ?? 10;
    const tamb_max = settings?.manualTmax ?? (isTropical ? 35 : 30);
    return { tmin, tamb_max };
};

export const useInverterCompatibility = (): DecoratedInverterCatalogItem[] => {
    const settings = useSolarStore(state => state.settings);
    const clientData = useSolarStore(state => state.clientData);
    const modules = useSolarStore(selectModules);
    const { inverters } = useCatalogStore();

    return useMemo(() => {
        if (!inverters || inverters.length === 0) return [];
        
        if (!modules || modules.length === 0) {
            return inverters.map((inv: InverterCatalogItem) => ({ ...inv, compatibility: null }));
        }

        const repModule = modules[0];
        const totalModulesCount = modules.length;
        const { tmin, tamb_max } = resolveTemps(settings, clientData);

        const moduleSpecs: ModuleElectricalSpecs & { power: number } = {
            voc: repModule.voc || 0,
            vmp: repModule.vmp ?? ((repModule.voc || 0) * 0.82),
            isc: repModule.isc || 0,
            tempCoeffVoc: (repModule as any).electrical?.tempCoeffVoc ?? repModule.tempCoeff ?? -0.29,
            power: (repModule as any).electrical?.pmax || repModule.power || 0,
        };

        const result = inverters.map((inv: InverterCatalogItem) => {
            const metrics = calculateCompatibilityMetrics(
                moduleSpecs,
                totalModulesCount,
                tmin,
                tamb_max,
                inv
            );
            return {
                ...inv,
                compatibility: metrics
            };
        });

        // Ordenação prioritária (Recomendados no topo, incompatíveis no fim)
        const priorityOrder: Record<string, number> = {
            'RECOMMENDED': 0,
            'ACCEPTABLE': 1,
            'WARNING': 2,
            'INCOMPATIBLE': 3
        };

        return result.sort((a, b) => {
            const pA = a.compatibility ? priorityOrder[a.compatibility.status] : 4;
            const pB = b.compatibility ? priorityOrder[b.compatibility.status] : 4;
            if (pA === pB) {
                // Em caso de empate de status, prioriza o FDI mais próximo do 1.25 ideal.
                if (a.compatibility && b.compatibility) {
                   return Math.abs(a.compatibility.fdi - 1.25) - Math.abs(b.compatibility.fdi - 1.25);
                }
            }
            return pA - pB;
        });

    }, [inverters, modules, settings, clientData]);
};
