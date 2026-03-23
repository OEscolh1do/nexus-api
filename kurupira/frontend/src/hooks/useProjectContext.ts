import { useMemo } from "react";
import { useSolarStore, selectSimulatedItems } from "@/core/state/solarStore";

/**
 * useProjectContext
 *
 * Hook de Integração (Ponte de Dados) entre CRM e Engenharia.
 * Isola o Módulo de Engenharia da estrutura interna do `clientSlice` e `useSolarStore`.
 *
 * Responsabilidade:
 * - Centralizar o acesso a dados críticos do projeto.
 * - Fornecer defaults seguros para evitar crashes.
 * - Abstrair a lógica de derivação (ex: tensão/fase baseada em faturas).
 */

export interface ProjectConstraints {
  area: number;
  voltage: number; // Tensão em Volts (ex: 127, 220, 380)
  phase: "monofasico" | "bifasico" | "trifasico";
}

export interface ClimateContext {
  hsp: number;
  city: string;
  state: string;
}

export interface EnergyGoal {
  monthlyTarget: number;
  annualTarget: number;
}

export interface ProjectContext {
  constraints: ProjectConstraints;
  climate: ClimateContext;
  energyGoal: EnergyGoal;
  hasClientData: boolean;
}

export const useProjectContext = (): ProjectContext => {
  // Seletores diretos para otimização
  // Seletores diretos para otimização
  const clientData = useSolarStore((state) => state.clientData);
  const weatherData = useSolarStore((state) => state.weatherData);
  const simulatedItems = useSolarStore(selectSimulatedItems);

  // 1. Derivação de Constraints (Restrições Físicas/Elétricas)
  const constraints = useMemo<ProjectConstraints>(() => {
    // Tenta pegar da primeira fatura, senão usa defaults
    const invoice = clientData.invoices?.[0];

    // Normaliza tensão para número
    let voltage = 220; // Default seguro
    if (invoice?.voltage) {
      const parsed = parseInt(invoice.voltage);
      if (!isNaN(parsed)) voltage = parsed;
    }

    // Fase
    const phase =
      invoice?.connectionType || clientData.connectionType || "monofasico";

    return {
      area: clientData.availableArea || 0,
      voltage,
      phase,
    };
  }, [clientData]);

  // 2. Derivação Climática
  const climate = useMemo<ClimateContext>(() => {
    // Prioridade: Dados de Irradiação Persistidos (Editados/Selecionados no Card)
    // Se a soma > 0, consideramos que há dados válidos
    const persistedIrradiation = clientData.monthlyIrradiation;
    const hasPersistedData = persistedIrradiation && persistedIrradiation.reduce((a, b) => a + b, 0) > 0;

    const sourceData = hasPersistedData ? persistedIrradiation : weatherData?.hsp_monthly;

    const hsp = sourceData
      ? sourceData.reduce((a, b) => a + b, 0) / sourceData.length
      : 4.5; // Default BR

    return {
      hsp,
      city: clientData.irradiationCity || clientData.city || "Local Desconhecido",
      state: clientData.state || "UF",
    };
  }, [weatherData, clientData.monthlyIrradiation, clientData.irradiationCity, clientData.city, clientData.state]);

  // 3. Meta Energética
  const energyGoal = useMemo<EnergyGoal>(() => {
    // A. Cálculo da Média de Consumo (Invoices)
    let baseConsumption = clientData.averageConsumption || 0;

    // Se averageConsumption for 0, tenta recalcular das faturas
    if (baseConsumption === 0 && clientData.invoices && clientData.invoices.length > 0) {
      // Tenta extrair o histórico de consumo da primeira fatura válida
      const invoiceWithHistory = clientData.invoices.find(inv => inv.monthlyHistory && inv.monthlyHistory.length > 0);
      
      if (invoiceWithHistory && invoiceWithHistory.monthlyHistory) {
         const history = invoiceWithHistory.monthlyHistory;
         // Filtra zeros se necessário, mas geralmente queremos a média dos 12 meses se informados
         const validMonths = history.filter(val => val > 0);
         if (validMonths.length > 0) {
             baseConsumption = validMonths.reduce((a, b) => a + b, 0) / validMonths.length;
         }
      }
    }

    // B. Cálculo de Cargas Simuladas (Extra)
    const simulatedLoadKwh = simulatedItems.reduce((acc, item) => {
       const dailyLoad = (item.power * item.qty * item.hoursPerDay * item.dutyCycle) / 1000;
       return acc + (dailyLoad * item.daysPerMonth);
    }, 0);

    // Soma final
    const finalMonthlyTarget = baseConsumption + simulatedLoadKwh;

    return {
      monthlyTarget: finalMonthlyTarget,
      annualTarget: finalMonthlyTarget * 12,
    };
  }, [clientData.averageConsumption, clientData.invoices, simulatedItems]);

  return useMemo(() => ({
    constraints,
    climate,
    energyGoal,
    hasClientData: !!clientData.clientName,
  }), [constraints, climate, energyGoal, clientData.clientName]);
};
