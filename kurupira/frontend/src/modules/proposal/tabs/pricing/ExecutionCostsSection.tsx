import { TrendingUp } from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';
import { EngineeringSettings } from '@/core/types';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { DenseRow } from '../../components/ui/DenseRow';
import { MoneyInput } from '../../components/ui/MoneyInput';

export const ExecutionCostsSection = () => {
    // Engineering Data (Read-only context)
    const modules = useSolarStore(state => state.modules);
    const totalPowerkWp = modules.reduce((acc, m) => acc + (m.quantity * m.power), 0) / 1000;

    // Settings (Read/Write)
    const settings = useSolarStore(state => state.settings);
    const updateSettings = useSolarStore(state => state.updateSettings);

    const handleSettingsChange = (key: keyof EngineeringSettings, value: number) => {
        updateSettings({ [key]: value } as any);
    };

    return (
        <div className="mb-6">
            <SectionHeader icon={TrendingUp} title="2. Custos de Execução (Serviços)" />
            <div className="bg-white border text-sm border-slate-200 rounded-md overflow-hidden shadow-sm">

                {/* Fixed or Manual Input Services */}
                <DenseRow
                    label="Frete & Logística"
                    description="Custo estimado de transporte"
                    value={
                        <MoneyInput
                            value={settings.serviceProjectBase || 0}
                            onChange={(val: any) => handleSettingsChange('serviceProjectBase' as any, val)}
                            className="w-32"
                        />
                    }
                />

                <DenseRow
                    label="Engenharia (Projeto/ART)"
                    description="Taxas e custo do projeto elétrico"
                    value={
                        <MoneyInput
                            value={settings.serviceAdminBase || 0}
                            onChange={(val: any) => handleSettingsChange('serviceAdminBase' as any, val)}
                            className="w-32"
                        />
                    }
                />

                <DenseRow
                    label="Instalação (Mão de Obra)"
                    description="Padrão R$/kWp editável via configs"
                    value={
                        <MoneyInput
                            value={(settings.serviceUnitModule || 0) * totalPowerkWp * 1000} // Convert kWp back to Wp for display if needed
                            onChange={(val: any) => {
                                // Reverse calculation: user edits the total, we derive the per-Module rate
                                const newPerMod = modules.reduce((acc, m) => acc + m.quantity, 0) > 0 ? val / modules.reduce((acc, m) => acc + m.quantity, 0) : 0;
                                handleSettingsChange('serviceUnitModule' as any, newPerMod);
                            }}
                            className="w-32"
                        />
                    }
                />

                <DenseRow
                    label="Homologação / Parecer"
                    description="Taxas da concessionária"
                    value={
                        <MoneyInput
                            value={settings.extraMaterialsCost || 0}
                            onChange={(val: any) => handleSettingsChange('extraMaterialsCost' as any, val)}
                            className="w-32"
                        />
                    }
                />
            </div>
        </div>
    );
};
