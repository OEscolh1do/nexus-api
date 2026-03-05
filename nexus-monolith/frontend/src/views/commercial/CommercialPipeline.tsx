import React, { useEffect, useState } from 'react';
import { commercialApi } from '@/lib/api/commercial'; // Adjust alias if needed
import { Opportunity, OpportunityStatus } from '@/modules/commercial/types';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STATUS_COLUMNS: OpportunityStatus[] = [
    'LEAD_QUALIFICATION',
    'VISIT_SCHEDULED',
    'TECHNICAL_VISIT_DONE',
    'PROPOSAL_GENERATED',
    'NEGOTIATION',
    'CLOSED_WON'
];

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

    // Basic Kanban UI - In a real app, use dnd-kit or similar
    // This is a simplified visual representation

    return (
        <div className="h-full flex flex-col">
            <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
                <h1 className="text-xl font-bold text-slate-900">Pipeline de Vendas</h1>
                <div className="flex gap-2">
                    {/* Filters would go here */}
                </div>
            </header>

            <div className="flex-1 overflow-x-auto p-6 bg-slate-50">
                <div className="flex gap-4 h-full min-w-max">
                    {STATUS_COLUMNS.map(status => (
                        <div key={status} className="w-80 flex flex-col bg-slate-100/50 rounded-lg p-3 border border-slate-200">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="font-semibold text-slate-700 text-sm">
                                    {status.replace('_', ' ')}
                                </h3>
                                <Badge variant="secondary" className="bg-white text-slate-500">
                                    {deals.filter(d => d.status === status).length}
                                </Badge>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                                {deals.filter(d => d.status === status).map(deal => (
                                    <div key={deal.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                {deal.probability}% Prob.
                                            </span>
                                            <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <h4 className="font-medium text-slate-900 mb-1">{deal.title}</h4>
                                        <p className="text-xs text-slate-500 mb-2">
                                            {deal.lead?.name || 'Cliente Desconhecido'}
                                        </p>

                                        <div className="mt-3 pt-3 border-t flex justify-between items-center">
                                            <span className="font-bold text-slate-700 text-sm">
                                                R$ {deal.estimatedValue.toLocaleString('pt-BR')}
                                            </span>
                                            {deal.technicalProposal?.validatedByEng && (
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 text-[10px] px-1 h-5">
                                                    Eng. OK
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CommercialPipeline;
