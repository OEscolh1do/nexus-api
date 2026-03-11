import { useProposalCalculator } from '../../hooks/useProposalCalculator';
import { HardHat } from 'lucide-react';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { DenseRow } from '../../components/ui/DenseRow';

export const KitCostsSection = () => {
    const { costs, kitBreakdown } = useProposalCalculator();

    // We only need read access here, as Kit costs come directly from Engineering

    return (
        <div className="mb-6">
            <SectionHeader icon={HardHat} title="1. Custos de Equipamento (Kit)" />

            <div className="bg-white border text-sm border-slate-200 rounded-md overflow-hidden shadow-sm">
                <DenseRow
                    label="Módulos PV"
                    value={kitBreakdown.modules.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    suffix="R$"
                    description="Soma do custo unitário x quantidade dimensionada"
                />
                <DenseRow
                    label="Inversores"
                    value={kitBreakdown.inverters.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    suffix="R$"
                    description="Soma do custo unitário x quantidade dimensionada"
                />

                {kitBreakdown.structure > 0 && (
                    <DenseRow
                        label="Estrutura de Fixação"
                        value={kitBreakdown.structure.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        suffix="R$"
                    />
                )}

                {kitBreakdown.bos > 0 && (
                    <DenseRow
                        label="BOS (Elétrico)"
                        value={kitBreakdown.bos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        suffix="R$"
                    />
                )}

                <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex justify-between items-center mt-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Subtotal Hard Costs</span>
                    <span className="font-mono font-black text-slate-800">
                        R$ {costs.kit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
        </div>
    );
};
