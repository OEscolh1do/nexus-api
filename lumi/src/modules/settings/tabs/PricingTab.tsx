import React from 'react';
import { DenseCard, DenseInput, DenseSelect } from '@/components/ui/dense-form';
import { EngineeringSettings } from '@/core/types';
import { DollarSign, Percent, Package } from 'lucide-react';

interface TabProps {
  settings: EngineeringSettings;
  onChange: (path: string, value: number | string) => void;
}

export const PricingTab: React.FC<TabProps> = ({ settings, onChange }) => {
  return (
    <div className="space-y-6">
      
      {/* 1. MODELO DE PRECIFICAÇÃO */}
      <DenseCard className="p-6 border-l-4 border-l-emerald-500">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign className="text-emerald-500" />
            Estratégia de Precificação
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <DenseSelect 
                label="Modelo de Cálculo"
                value={settings.pricingModel || 'margin'}
                onChange={(e) => onChange('pricingModel', e.target.value)}
                options={[
                    { value: 'margin', label: 'Margem sobre Custo (Markup)' },
                    { value: 'fixed_kit', label: 'Preço Fixo por Kit (Tabela)' },
                    { value: 'cost_plus', label: 'Custo + Taxa Admin (Cost Plus)' }
                ]}
                colSpan={2}
            />

            <DenseInput 
                label="Margem de Lucro Alvo (%)"
                type="number" 
                step="1"
                value={(settings.marginPercentage * 100).toFixed(0)}
                onChange={(e) => onChange('marginPercentage', Number(e.target.value) / 100)}
                suffix="%"
                icon={<Percent size={14} />}
                helperText="Lucro líquido desejado sobre o preço final."
            />
            
            <DenseInput 
                label="Comissão Venda Direta (%)"
                type="number" 
                step="0.5"
                value={(settings.commissionPercentage * 100).toFixed(1)}
                onChange={(e) => onChange('commissionPercentage', Number(e.target.value) / 100)}
                suffix="%"
                helperText="Comissão paga ao vendedor."
            />

            <DenseInput 
                label="Impostos sobre Venda (%)"
                type="number" 
                step="0.5"
                value={(settings.taxPercentage * 100).toFixed(1)}
                onChange={(e) => onChange('taxPercentage', Number(e.target.value) / 100)}
                suffix="%"
                helperText="Simples Nacional / Lucro Presumido."
            />
             <DenseInput 
                label="Comissão Fixa Mínima (R$)"
                type="number" 
                step="50"
                value={settings.serviceCommissionFixed}
                onChange={(e) => onChange('serviceCommissionFixed', Number(e.target.value))}
                prefix="R$"
                helperText="Valor mínimo garantido por venda."
            />
        </div>
      </DenseCard>

      {/* 2. CUSTOS DE HARDWARE & KIT */}
      <DenseCard className="p-6 border-l-4 border-l-blue-500">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Package className="text-blue-500" />
            Custos de Hardware & Kits
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DenseInput 
                label="Preço Ref. Kit (R$/kWp)"
                type="number" 
                step="50"
                value={settings.referenceKitPricePerKwp}
                onChange={(e) => onChange('referenceKitPricePerKwp', Number(e.target.value))}
                prefix="R$"
                colSpan={1}
                helperText="Custo base do Kit Fotovoltaico (Módulos + Inversor)."
            />
             <DenseInput 
                label="Estrutura (R$/mod)"
                type="number" 
                step="10"
                value={settings.structurePricePerModule}
                onChange={(e) => onChange('structurePricePerModule', Number(e.target.value))}
                prefix="R$"
                colSpan={1}
                helperText="Custo médio da estrutura por módulo."
            />
            <DenseInput 
                label="BOS (R$/kWp)"
                type="number" 
                step="10"
                value={settings.bosPricePerKwp}
                onChange={(e) => onChange('bosPricePerKwp', Number(e.target.value))}
                prefix="R$"
                colSpan={1}
                helperText="Cabos, string box, fixadores (Balance of System)."
            />
        </div>
      </DenseCard>

      {/* 3. CUSTOS DE SERVIÇO (Instalação) */}
      <DenseCard className="p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Custos de Serviço (Mão de Obra)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <DenseInput 
                label="Instalação (R$/mod)"
                type="number" 
                step="5"
                value={settings.serviceUnitModule}
                onChange={(e) => onChange('serviceUnitModule', Number(e.target.value))}
                prefix="R$"
                helperText="Custo de MO por módulo instalado."
            />
            <DenseInput 
                label="Instalação (R$/inv)"
                type="number" 
                step="50"
                value={settings.serviceUnitInverter}
                onChange={(e) => onChange('serviceUnitInverter', Number(e.target.value))}
                prefix="R$"
                helperText="Custo de MO por inversor."
            />
             <DenseInput 
                label="Projeto & Eng. (Base)"
                type="number" 
                step="100"
                value={settings.serviceProjectBase}
                onChange={(e) => onChange('serviceProjectBase', Number(e.target.value))}
                prefix="R$"
                helperText="Custo fixo de engenharia/homologação."
            />
        </div>
      </DenseCard>
    </div>
  );
};
