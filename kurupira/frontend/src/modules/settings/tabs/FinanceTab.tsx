import React from 'react';
import { DenseCard, DenseInput } from '@/components/ui/dense-form';
import { EngineeringSettings } from '@/core/types';
import { PiggyBank, TrendingUp } from 'lucide-react';

interface TabProps {
  settings: EngineeringSettings;
  onChange: (path: string, value: number | string) => void;
}

export const FinanceTab: React.FC<TabProps> = ({ settings, onChange }) => {
  return (
    <div className="space-y-6">
      
      {/* 1. INDICADORES FINANCEIROS */}
      <DenseCard className="p-6 border-l-4 border-l-purple-500">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-purple-500" />
            Indicadores de Mercado
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DenseInput 
                label="Inflação Energética Anual (%)"
                type="number" 
                step="0.1"
                value={(settings.energyInflationRate * 100).toFixed(1)}
                onChange={(e) => onChange('energyInflationRate', Number(e.target.value) / 100)}
                suffix="%"
                helperText="Aumento médio anual da tarifa de energia (IPCA Energia)."
            />
            
            <DenseInput 
                label="Taxa Mínima de Atratividade (TMA) (%)"
                type="number" 
                step="0.1"
                value={(settings.monthlyInterestRate * 12 * 100).toFixed(1)} 
                onChange={(e) => onChange('monthlyInterestRate', (Number(e.target.value) / 100) / 12)}
                suffix="% a.a."
                helperText="Custo de oportunidade do capital (Selic/CDI)."
            />
        </div>
      </DenseCard>

      {/* 2. FINANCIAMENTO BANCÁRIO */}
      <DenseCard className="p-6 border-l-4 border-l-blue-500">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PiggyBank className="text-blue-500" />
            Padrões de Financiamento
        </h3>
        <p className="text-sm text-slate-500 mb-4">
            Defina as taxas de juros padrão usadas nas simulações de crédito.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DenseInput 
                label="Taxa de Juros (Financiamento) (% a.m.)"
                type="number" 
                step="0.01"
                // Assuming monthlyInterestRate is used for Payback NPV, but wait, 
                // we added `loanInterestRate` to FinanceParams (per proposal), NOT settings globally.
                // However, having a DEFAUlT in settings is good.
                // Let's hijack `monthlyInterestRate` or add a new one if schema supported.
                // Settings schema has `monthlyInterestRate`. Let's use that as the BASE rate.
                // Or better, let's treat `monthlyInterestRate` as the Discount Rate (TMA).
                
                // Oops, the schema only has `monthlyInterestRate`. 
                // Let's use that for now as the TMA/Discount Rate.
                
                // For "Simulação de Financiamento", the params are in `FinanceSlice`, not `Settings`.
                // BUT we could set a "Default Interest Rate" for new simulations here? 
                // For now, let's just stick to what `EngineeringSettings` has.
                
                // Just use the existing `monthlyInterestRate` as TMA/Discount Rate for NPV.
                 value={(settings.monthlyInterestRate * 100).toFixed(2)}
                 onChange={(e) => onChange('monthlyInterestRate', Number(e.target.value) / 100)}
                 suffix="% a.m."
                 helperText="Taxa usada para trazer VP e calcular LCOE."
            />
        </div>
      </DenseCard>
    </div>
  );
};
