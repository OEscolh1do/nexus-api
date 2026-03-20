import { Receipt } from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';
import { EngineeringSettings } from '@/core/types';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { DenseRow } from '../../components/ui/DenseRow';
import { MinimalInput } from '../../components/ui/MinimalInput';

export const AdministrativeCostsSection = () => {
    const settings = useSolarStore(state => state.settings);
    const updateSettings = useSolarStore(state => state.updateSettings);

    const handleSettingsChange = (key: keyof EngineeringSettings, value: number) => {
        updateSettings({ [key]: value } as any);
    };

    const toInput = (val: number) => val * 100;
    const fromInput = (val: number) => val / 100;

    return (
        <div className="mb-6">
            <SectionHeader icon={Receipt} title="3. Custos Operacionais (Soft)" />
            <div className="bg-white border text-sm border-slate-200 rounded-md overflow-hidden shadow-sm">

                <DenseRow
                    label="Impostos Globais (Simples/Lucro)"
                    description="Aplicado sobre o faturamento total"
                    value={
                        <MinimalInput
                            value={toInput(settings.taxPercentage || 0)}
                            onChange={(e: any) => handleSettingsChange('taxPercentage', fromInput(parseFloat(e.target.value) || 0))}
                        />
                    }
                    suffix="%"
                />

                <DenseRow
                    label="Margem Admin (Reserva Financeira)"
                    description="Taxa de segurança ou custo fixo da operação"
                    value={
                        <MinimalInput
                            value={toInput(settings.serviceAdminPercent || 0)}
                            onChange={(e: any) => handleSettingsChange('serviceAdminPercent', fromInput(parseFloat(e.target.value) || 0))}
                        />
                    }
                    suffix="%"
                />
            </div>
        </div>
    );
};
