
import React, { useEffect, useState } from 'react';
import { LeadDrawer } from './LeadDrawer';
import { Plus, MoreHorizontal, Filter, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/mock-components';
import { useDebounce } from '@/hooks/useDebounce';

import { Lead, Opportunity, OpportunityStatus } from '../types';

interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  helpText?: string;
}

// Map dynamic stage names to the strict backend OpportunityStatusEnum
const mapStageNameToStatus = (name: string): OpportunityStatus => {
  const map: Record<string, OpportunityStatus> = {
    'Lead': 'LEAD_QUALIFICATION',
    'Aguardando Vistoria': 'VISIT_SCHEDULED',
    'Vistoria': 'TECHNICAL_VISIT_DONE',
    'Proposta': 'PROPOSAL_GENERATED',
    'Negociação': 'NEGOTIATION',
    'Contrato Fechado': 'CONTRACT_SENT',
    'Fechado': 'CLOSED_WON',
    'Concluído': 'CLOSED_WON',
  };
  return map[name] || 'LEAD_QUALIFICATION'; // Fallback
};

export default function CommercialPipeline() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [draggedOppId, setDraggedOppId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch specifically Opportunities (Deals) and the dynamic Pipeline structure
      const [oppsRes, pipelineRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/v2/commercial/opportunities`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/v2/commercial/pipeline`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const oppsData = await oppsRes.json();
      const pipelineData = await pipelineRes.json();

      if (oppsData.success) {
        setOpportunities(oppsData.data);
      }
      if (pipelineData.success && pipelineData.data?.stages) {
        setStages(pipelineData.data.stages);
      }

    } catch (error) {
      console.error("Failed to fetch opportunities or pipeline", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOppStatus = async (oppId: string, newStatus: OpportunityStatus) => {
    // Optimistic UI update
    const previousOpps = [...opportunities];
    setOpportunities(prev => prev.map(o => o.id === oppId ? { ...o, status: newStatus } : o));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/v2/commercial/opportunities/${oppId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!data.success) {
        alert(`Bloqueio de Guardrail:\n${data.error || 'Erro ao mover card.'}`);
        setOpportunities(previousOpps); // Revert on failure
      }
    } catch (error) {
      console.error("Failed to update status", error);
      setOpportunities(previousOpps); // Revert on failure
    }
  };

  const handleDragStart = (e: React.DragEvent, oppId: string) => {
    setDraggedOppId(oppId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: OpportunityStatus) => {
    e.preventDefault();
    if (!draggedOppId) return;

    // Call API (Guardrails will block invalid moves if needed)
    updateOppStatus(draggedOppId, status);
    setDraggedOppId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const openDrawer = (opp: Opportunity) => {
    // LeadDrawer was built for Lead type, we pass the expanded Lead from Opportunity
    if (opp.lead) {
      setSelectedLead({ ...opp.lead, id: opp.leadId } as Lead);
      setIsDrawerOpen(true);
    }
  };

  // ... (handleInteraction same as before) ...
  const handleAddInteraction = async (type: string, content: string) => {
    if (!selectedLead) return;
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/v2/commercial/leads/${selectedLead.id}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type, content })
      });
      // Refresh details logic
    } catch (error) {
      console.error(error);
    }
  };

  // Dynamic Geo-Clustering Detection
  const geoClusters = React.useMemo(() => {
    const cityCounts = opportunities
      .filter(o => o.status !== 'CLOSED_WON' && o.status !== 'CLOSED_LOST')
      .reduce((acc, opp) => {
        const city = opp.lead?.city?.trim();
        if (city) {
          acc[city] = (acc[city] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

    // Find the city with the highest count that meets the threshold
    const criticalCity = Object.entries(cityCounts).find(([_, count]) => count >= 3);
    return criticalCity ? { city: criticalCity[0], count: criticalCity[1] } : null;
  }, [opportunities]);

  // Note: we now filter opportunities by debouncedSearchTerm instead of searchTerm
  const filteredOpps = React.useMemo(() => {
    return opportunities.filter(opp => {
      if (!debouncedSearchTerm) return true;
      const lowerSearch = debouncedSearchTerm.toLowerCase();
      const matchName = opp.title.toLowerCase().includes(lowerSearch);
      const matchLead = opp.lead?.name?.toLowerCase().includes(lowerSearch);
      return matchName || matchLead;
    });
  }, [opportunities, debouncedSearchTerm]);

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar leads..."
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" /> Filtros</Button>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 mr-2" /> Novo Lead</Button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-w-max">
          {stages.length === 0 && <p className="text-slate-500 text-sm p-4">Nenhum estágio de pipeline encontrado.</p>}
          {stages.map(stage => {
            const mappedStatus = mapStageNameToStatus(stage.name);
            return (
              <div
                key={stage.id}
                className="w-80 flex flex-col bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, mappedStatus)}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-slate-200/50 dark:border-slate-800 relative group/header">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stage.color || 'bg-slate-500'}`}></div>
                      <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider">{stage.name}</span>
                    </div>

                    {/* Column Dropdown Menu (Aesthetic / Functionality placeholder) */}
                    <div className="relative group/dropdown">
                      <MoreHorizontal size={14} className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors" />
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-md overflow-hidden opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-10">
                        <button className="w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Editar Estágio</button>
                        <button className="w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Ocultar Coluna</button>
                      </div>
                    </div>
                  </div>
                  {stage.helpText && <p className="text-[10px] text-slate-400 ml-4">{stage.helpText}</p>}

                  {/* Geo-Cluster Alert (Show in the first active qualification column if cluster exists) */}
                  {mappedStatus === 'LEAD_QUALIFICATION' && geoClusters && (
                    <div className="mt-2 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50 rounded-lg p-2 flex items-start gap-2">
                      <div className="bg-purple-500 text-white rounded-full p-1 mt-0.5"><Loader2 size={10} className="animate-spin" /></div>
                      <div>
                        <p className="text-xs font-bold text-purple-800 dark:text-purple-300">Cluster Detectado!</p>
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 leading-tight">Você tem {geoClusters.count} leads em {geoClusters.city}. <span className="underline cursor-pointer">Criar Missão?</span></p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Droppable Area */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[100px]">
                  {filteredOpps
                    .filter(o => o.status === mappedStatus)
                    .map(opp => (
                      <div
                        key={opp.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, opp.id)}
                        onClick={() => openDrawer(opp)}
                        className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm cursor-grab hover:shadow-md transition-all active:cursor-grabbing group group-hover:border-purple-200 dark:group-hover:border-purple-500/50"
                      >
                        <div className="flex justify-between items-start mb-2">
                          {/* Opportunity specific title */}
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate">{opp.title}</h4>
                          {opp.lead?.engagementScore && opp.lead.engagementScore > 50 && <span className="text-[9px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded ml-2 shrink-0">HOT</span>}
                        </div>

                        <p className="text-xs text-slate-500 truncate mb-1">{opp.lead?.name || 'Sem Lide'}</p>
                        <p className="text-[10px] text-slate-400 truncate mb-3">{opp.lead?.city ? `${opp.lead.city} • ` : ''}Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opp.estimatedValue || 0)}</p>

                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50 dark:border-slate-700">
                          <div className="flex -space-x-1">
                            <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/40 border border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-bold text-purple-700 dark:text-purple-400">VE</div>
                          </div>
                          <span className="text-[9px] text-slate-400 font-medium">#{opp.id.slice(0, 5)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <LeadDrawer
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onAddInteraction={handleAddInteraction}
      />
    </div>
  );
}
