import { useSolarStore } from '@/core/state/solarStore';
import { useProposalCalculator } from '../../hooks/useProposalCalculator';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DenseRow } from '../../components/ui/DenseRow';
import { generateB2BReport } from '../../utils/generateB2BReport';
import { selectClientData } from '@/core/state/solarStore';

export const PricingResultsPanel = () => {
    const calculator = useProposalCalculator();
    const { costs, pricing, financials } = calculator;
    const settings = useSolarStore(state => state.settings);
    const clientData = useSolarStore(selectClientData);

    // Pie Chart Data
    const pieData = [
        { name: 'Custo Hard (Kit)', value: costs.kit, color: '#6366f1' }, // Indigo-500
        { name: 'Serviços & Inst.', value: costs.labor + costs.project + costs.materials, color: '#3b82f6' }, // Blue-500
        { name: 'Impostos + Admin', value: pricing.taxValue + costs.admin, color: '#f59e0b' }, // Amber-500
        { name: 'Lucro + Comissão', value: pricing.marginValue + pricing.commissionValue, color: '#10b981' } // Emerald-500
    ].filter(item => item.value > 0);

    return (
        <div className="w-1/3 bg-slate-50 border-l border-slate-200 h-full p-6 overflow-y-auto flex flex-col shadow-inner">

            <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Composição de Preço</h3>

                {/* 1. Final Price Card */}
                <div className="bg-indigo-600 text-white rounded-xl p-4 shadow-lg shadow-indigo-200 mb-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    </div>
                    <span className="text-indigo-200 text-xs font-bold uppercase tracking-wide">Valor Final de Venda</span>
                    <div className="text-3xl font-black tracking-tight mt-1 flex items-baseline gap-1">
                        <span className="text-lg text-indigo-300">R$</span>
                        {pricing.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {/* Price / Wp Metric */}
                    <div className="mt-3 pt-3 border-t border-indigo-500/50 flex justify-between items-center text-sm">
                        <span className="text-indigo-200">Preço / Wp</span>
                        <span className="font-mono font-bold">R$ {pricing.pricePerWp.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* 2. Visual Breakdown (Recharts) */}
                <div className="h-40 w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* 3. Detailed Breakdown List */}
                <div className="bg-white border text-xs border-slate-200 rounded-md overflow-hidden shadow-sm">
                    <DenseRow
                        label="Custo Direto (Hard + Soft)"
                        value={costs.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        suffix="R$"
                    />
                    <DenseRow
                        label={`Lucro Bruto (${((settings.marginPercentage || 0) * 100).toFixed(1)}%)`}
                        value={pricing.marginValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        suffix="R$"
                        highlight={true}
                    />
                    <DenseRow
                        label={`Comissão (${((settings.commissionPercentage || 0) * 100).toFixed(1)}%)`}
                        value={pricing.commissionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        suffix="R$"
                    />
                </div>
            </div>

            {/* 4. Financial Premises Preview */}
            <div className="mt-auto pt-6 border-t border-slate-200">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Premissas Financeiras</h3>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-100 p-2 rounded text-center">
                        <span className="block text-[10px] text-slate-500 uppercase">Infl. Estratégica</span>
                        <span className="text-sm font-mono font-bold text-slate-700">6.0% a.a</span>
                    </div>
                    <div className="bg-slate-100 p-2 rounded text-center">
                        <span className="block text-[10px] text-slate-500 uppercase">Payback Estimado</span>
                        <span className="text-sm font-mono font-bold text-slate-700">={(financials.paybackYears).toFixed(1)} anos</span>
                    </div>
                </div>
            </div>

            {/* 5. B2B Report Action */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-center">
                <button
                    onClick={() => generateB2BReport(calculator, clientData.clientName || 'Cliente', 'Projeto Otimizado')}
                    className="w-full flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    Exportar BOM B2B (Custos)
                </button>
            </div>

        </div>
    );
};
