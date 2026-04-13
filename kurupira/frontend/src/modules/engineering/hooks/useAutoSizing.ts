import { useMemo } from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { useCatalogStore } from '@/modules/engineering/store/useCatalogStore';
import { calculateMinimumPower } from '@/modules/engineering/utils/minimumPower';
import type { InverterCatalogItem } from '@/core/schemas/inverterSchema';
import type { ModuleCatalogItem } from '@/core/schemas/moduleSchema';

export interface AutoSizingResult {
  /** Potência alvo do projeto em kWp */
  requiredKwp: number;
  /** Inversor recomendado (melhor match da marca escolhida) */
  recommendedInverter: InverterCatalogItem | null;
  /** Quantidade de módulos necessários */
  requiredModuleQty: number;
  /** Se há dados suficientes para calcular */
  isCalculable: boolean;
}

/**
 * Motor de Dimensionamento Automático.
 * 
 * Fluxo de decisão:
 * 1. Usuário escolhe o MÓDULO (marca + modelo) — decisão de negócio
 * 2. Usuário escolhe a MARCA do INVERSOR — preferência comercial
 * 3. Sistema calcula quantidade de módulos e recomenda o MODELO de inversor
 *    mais adequado dentro da marca escolhida (DC/AC ratio ideal ~1.20)
 */
export const useAutoSizing = (
  selectedModule: ModuleCatalogItem | null = null,
  inverterBrand: string = ''
): AutoSizingResult => {
  const clientData = useSolarStore(state => state.clientData);
  const pr = useTechStore(state => state.getPerformanceRatio)();
  
  const inverters = useCatalogStore(state => state.inverters);

  const result = useMemo(() => {
    // 1. Extrair dados do projeto
    const currentInvoice = clientData.invoices[0];
    const monthlyConsumption = currentInvoice?.monthlyHistory || Array(12).fill(0);
    const hspArray = clientData.monthlyIrradiation || Array(12).fill(0);
    const connType = currentInvoice?.connectionType || clientData.connectionType || 'monofasico';

    // 2. Calcular a Potência Mínima alvo
    const minPowerResult = calculateMinimumPower(
      monthlyConsumption, 
      hspArray, 
      pr, 
      1.0, 
      connType
    );

    const requiredKwp = minPowerResult.roundedKwp;

    // Sem dados → não calculável
    if (requiredKwp === 0 || inverters.length === 0) {
      return {
        requiredKwp: 0,
        recommendedInverter: null,
        requiredModuleQty: 0,
        isCalculable: false
      };
    }

    // Sem módulo → apenas informamos o kWp alvo
    if (!selectedModule) {
      return {
        requiredKwp,
        recommendedInverter: null,
        requiredModuleQty: 0,
        isCalculable: true
      };
    }

    // 3. Calcular quantidade de módulos
    const pmaxKw = selectedModule.electrical.pmax / 1000;
    const requiredModuleQty = pmaxKw > 0 ? Math.ceil(requiredKwp / pmaxKw) : 0;
    const actualDcKwp = requiredModuleQty * pmaxKw;

    // Sem marca de inversor → retornamos qty mas sem recomendação de inversor
    if (!inverterBrand) {
      return {
        requiredKwp,
        recommendedInverter: null,
        requiredModuleQty,
        isCalculable: true
      };
    }

    // 4. Recomendação de Inversor (filtrado pela marca escolhida)
    let bestInverter: InverterCatalogItem | null = null;
    let minDiffInverter = Infinity;

    inverters
      .filter(inv => inv.manufacturer === inverterBrand)
      .forEach(inv => {
        const nominalKwp = inv.nominalPowerW / 1000;
        
        // Filtra micro-inversores para sistemas > 3kWp
        if (actualDcKwp > 3 && nominalKwp <= 2) return;
        
        // DC/AC ratio ideal ≈ 1.20
        const dcAcRatio = actualDcKwp / nominalKwp;
        const idealCenter = 1.20;
        const diff = Math.abs(dcAcRatio - idealCenter);
        
        // Fora dos limites aceitáveis
        if (dcAcRatio > 1.50) return;
        if (dcAcRatio < 0.70) return;

        if (diff < minDiffInverter) {
          minDiffInverter = diff;
          bestInverter = inv;
        }
      });

    return {
      requiredKwp,
      recommendedInverter: bestInverter,
      requiredModuleQty,
      isCalculable: true
    };
  }, [clientData, pr, inverters, selectedModule, inverterBrand]);

  return result;
};
