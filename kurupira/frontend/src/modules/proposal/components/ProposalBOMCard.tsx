import React from 'react';
import { DenseCard } from '@/components/ui/dense-form';
import { Package, CheckCircle2 } from 'lucide-react';
import { useSolarStore, selectModules, selectInverters } from '@/core/state/solarStore';

export const ProposalBOMCard: React.FC = () => {
    const modules = useSolarStore(selectModules);
    const inverters = useSolarStore(selectInverters);

    return (
        <DenseCard className="p-0 overflow-hidden border-slate-200">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Package size={18} className="text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Lista de Materiais (BOM)</h3>
                </div>
            </div>

            <div className="p-6">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200">
                            <th className="py-2 text-xs font-bold text-slate-500 uppercase">Item</th>
                            <th className="py-2 text-xs font-bold text-slate-500 uppercase">Fabricante / Modelo</th>
                            <th className="py-2 text-xs font-bold text-slate-500 uppercase text-center w-24">Qtd.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {/* Módulos */}
                        {modules.map((m, idx) => (
                            <tr key={`mod-${idx}`} className="group hover:bg-slate-50 transition-colors">
                                <td className="py-3 text-sm font-medium text-slate-700">Módulo Fotovoltaico {m.power}W</td>
                                <td className="py-3 text-sm text-slate-500">{m.manufacturer} {m.model}</td>
                                <td className="py-3 text-sm font-bold text-slate-700 text-center">{m.quantity}</td>
                            </tr>
                        ))}
                        
                        {/* Inversores */}
                        {inverters.map((inv, idx) => (
                            <tr key={`inv-${idx}`} className="group hover:bg-slate-50 transition-colors">
                                <td className="py-3 text-sm font-medium text-slate-700">Inversor {inv.nominalPower}kW</td>
                                <td className="py-3 text-sm text-slate-500">{inv.manufacturer} {inv.model}</td>
                                <td className="py-3 text-sm font-bold text-slate-700 text-center">{inv.quantity}</td>
                            </tr>
                        ))}

                        {/* Estrutura Fixação Universal */}
                        <tr className="group hover:bg-slate-50 transition-colors">
                            <td className="py-3 text-sm font-medium text-slate-700">Estrutura de Fixação</td>
                            <td className="py-3 text-sm text-slate-500">Universal Alumínio (Trilhos e Grampos)</td>
                            <td className="py-3 text-sm font-bold text-slate-700 text-center">Kit</td>
                        </tr>

                        {/* Cabos e Conectores */}
                        <tr className="group hover:bg-slate-50 transition-colors">
                            <td className="py-3 text-sm font-medium text-slate-700">String Box e Cabeamento</td>
                            <td className="py-3 text-sm text-slate-500">Cabos Solares 6mm², Conectores MC4</td>
                            <td className="py-3 text-sm font-bold text-slate-700 text-center">Kit</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="bg-emerald-50 border-t border-emerald-100 px-6 py-3 flex items-center gap-2 text-emerald-700">
                <CheckCircle2 size={16} />
                <span className="text-sm font-bold">10 Anos de Garantia de Instalação e Equipamentos inclusos.</span>
            </div>
        </DenseCard>
    );
};
