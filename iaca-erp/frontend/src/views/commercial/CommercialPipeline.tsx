import React, { useEffect, useState } from 'react';
import { commercialApi } from '@/lib/api/commercial';
import { Opportunity, OpportunityStatus } from '@/modules/commercial/types';
import { MoreHorizontal, Filter, LayoutDashboard, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import clsx from 'clsx';

const STATUS_COLUMNS: OpportunityStatus[] = [
    'LEAD_QUALIFICATION',
    'VISIT_SCHEDULED',
    'TECHNICAL_VISIT_DONE',
    'PROPOSAL_GENERATED',
    'NEGOTIATION',
    'CLOSED_WON'
];

const STATUS_LABELS: Record<string, string> = {
    'LEAD_QUALIFICATION': 'Qualificação',
    'VISIT_SCHEDULED': 'Visita Agendada',
    'TECHNICAL_VISIT_DONE': 'Visita Feita',
    'PROPOSAL_GENERATED': 'Proposta Gerada',
    'NEGOTIATION': 'Negociação',
    'CLOSED_WON': 'Fechado ✓',
};

const STATUS_COLORS: Record<string, string> = {
    'LEAD_QUALIFICATION': 'from-slate-400 to-slate-500',
    'VISIT_SCHEDULED': 'from-blue-400 to-blue-500',
    'TECHNICAL_VISIT_DONE': 'from-indigo-400 to-indigo-500',
    'PROPOSAL_GENERATED': 'from-purple-400 to-purple-500',
    'NEGOTIATION': 'from-amber-400 to-amber-500',
    'CLOSED_WON': 'from-emerald-400 to-emerald-500',
};

export const CommercialPipeline: React.FC = () => {
    const [deals, setDeals] = useState<Opportunity[]>([]);

    useEffect(() => {
        loadDeals();
    }, []);

    const loadDeals = async () => {
        try {
            const data = await commercialApi.getDeals();
            setDeals(data);
        } catch (e) {
            console.error("Failed to load deals", e);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Pipeline de Vendas</h1>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                        <LayoutDashboard className="w-3 h-3 text-blue-500" />
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{deals.length} deals</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5" /> Filtros
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-x-auto p-6 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex gap-4 h-full min-w-max">
                    {STATUS_COLUMNS.map(status => {
                        const columnDeals = deals.filter(d => d.status === status);
                        return (
                            <div key={status} className="w-80 flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-3 border border-slate-200/60 dark:border-slate-800/60">
                                {/* Column Header */}
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <div className="flex items-center gap-2">
                                        <div className={clsx("w-2 h-2 rounded-full bg-gradient-to-br", STATUS_COLORS[status])}></div>
                                        <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-[13px]">
                                            {STATUS_LABELS[status] || status.replace('_', ' ')}
                                        </h3>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                        {columnDeals.length}
                                    </span>
                                </div>

                                {/* Deal Cards */}
                                <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                                    {columnDeals.map(deal => (
                                        <div key={deal.id} className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-blue-200/60 dark:hover:border-blue-500/30 transition-all duration-200 cursor-pointer group">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-200/50 dark:ring-blue-500/30 px-1.5 py-0.5 rounded">
                                                    {deal.probability}% Prob.
                                                </span>
                                                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <h4 className="font-semibold text-[13px] text-slate-800 dark:text-slate-200 mb-1">{deal.title}</h4>
                                            <p className="text-[11px] text-slate-400 mb-3">
                                                {deal.lead?.name || 'Cliente Desconhecido'}
                                            </p>

                                            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                                <span className="font-bold text-slate-700 dark:text-slate-300 text-[13px]">
                                                    R$ {deal.estimatedValue.toLocaleString('pt-BR')}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    {deal.technicalProposal?.validatedByEng ? (
                                                        <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-[9px] px-1.5 h-5 font-bold">
                                                            Eng. OK
                                                        </Badge>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const kurupiraUrl = import.meta.env.VITE_KURUPIRA_URL || 'http://localhost:5174';
                                                                window.open(`${kurupiraUrl}?leadId=${deal.leadId}`, '_blank');
                                                            }}
                                                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-[9px] font-bold transition-colors ring-1 ring-emerald-200/50 dark:ring-emerald-500/30"
                                                            title="Abrir dimensionamento no Kurupira"
                                                        >
                                                            <Zap size={10} />
                                                            Dimensionar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CommercialPipeline;
