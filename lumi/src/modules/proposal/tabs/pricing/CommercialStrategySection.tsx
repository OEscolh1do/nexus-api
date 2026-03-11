import { DollarSign } from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';
import { EngineeringSettings } from '@/core/types';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { DenseRow } from '../../components/ui/DenseRow';
import { MinimalInput } from '../../components/ui/MinimalInput';

export const CommercialStrategySection = () => {
    const settings = useSolarStore(state => state.settings);
    const updateSettings = useSolarStore(state => state.updateSettings);

    const handleSettingsChange = (key: keyof EngineeringSettings, value: number) => {
        updateSettings({ [key]: value } as any);
    };

    const toInput = (val: number) => val * 100;
    const fromInput = (val: number) => val / 100;

    return (
        <div className="mb-6">
            <SectionHeader icon={DollarSign} title="4. Estratégia Comercial (Margem e Venda)" />
            <div className="bg-gradient-to-br from-indigo-50 to-white border text-sm border-indigo-100 rounded-md overflow-hidden shadow-sm">

                {/* DYNAMIC ROW based on Strategy */}
                {settings.pricingModel === 'margin' && (
                    <DenseRow
                        label="Margem de Lucro Bruto (Alvo)"
                        description="Markup global sobre os custos (Desejado)"
                        highlight={true}
                        value={
                            <MinimalInput
                                className="bg-white border-indigo-200 focus:border-indigo-500 text-indigo-700"
                                value={toInput(settings.marginPercentage || 0)}
                                onChange={(e: any) => handleSettingsChange('marginPercentage', fromInput(parseFloat(e.target.value) || 0))}
                            />
                        }
                        suffix="%"
                    />
                )}

                {settings.pricingModel === 'cost_plus' && (
                    <div className="p-3 text-xs text-indigo-700 font-medium">
                        O modelo 'Cost Plus' soma os custos Hard e Soft como Custo Base. Ajuste as alíquotas de Engenharia/Mão de Obra para derivar o preço, ou defina um Markup fixo.
                        {/* More detailed inputs could go here for Cost Plus specifically */}
                        <div className="mt-2 text-slate-500">
                            Neste modelo, o Markup Líquido Adicional é:
                            <div className="mt-1 flex items-center justify-between bg-white border border-indigo-100 rounded p-1 px-2">
                                <span>Markup Fixo:</span>
                                <div className="flex items-center">
                                    <MinimalInput
                                        className="bg-white border-transparent text-indigo-700 w-16"
                                        value={toInput(settings.marginPercentage || 0)}
                                        onChange={(e: any) => handleSettingsChange('marginPercentage', fromInput(parseFloat(e.target.value) || 0))}
                                    />
                                    <span className="text-xs text-indigo-400 font-bold">%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {settings.pricingModel === 'fixed_kit' && (
                    <div className="p-3 text-xs text-amber-700 font-medium bg-amber-50">
                        O modelo 'Orçamento Fornecedor' assume que o Distribuidor já passou um preço final bloqueado.
                        A sua margem será a diferença entre o Preço de Venda Customizado e o Valor do Kit + Serviços.
                    </div>
                )}

                <DenseRow
                    label="Comissão de Vendas"
                    description="Taxa paga ao vendedor/parceiro"
                    value={
                        <MinimalInput
                            value={toInput(settings.commissionPercentage || 0)}
                            onChange={(e: any) => handleSettingsChange('commissionPercentage', fromInput(parseFloat(e.target.value) || 0))}
                        />
                    }
                    suffix="%"
                />
            </div>
        </div>
    );
};
