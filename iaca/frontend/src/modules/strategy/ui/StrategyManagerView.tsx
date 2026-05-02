import React, { useEffect, useState, useCallback } from 'react';
import { Target, Plus, Sparkles } from 'lucide-react';
import { StrategicTree } from '../components/StrategyTree';
import { StrategyFormModal } from '../components/StrategyFormModal';
import { KeyResultModal } from '../components/KeyResultModal';
import { CheckInModal } from '../components/CheckInModal';
import { RiskModal } from '../components/RiskModal';
import { StrategyService } from '../services/strategy.service';
import type { Strategy, KeyResult } from '../types';

export const StrategyManagerView: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

  // Key Result Modal State
  const [isKrModalOpen, setIsKrModalOpen] = useState(false);
  const [activeStrategyForKr, setActiveStrategyForKr] = useState<string | null>(null);

  // CheckIn Modal State
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [activeKrForCheckIn, setActiveKrForCheckIn] = useState<KeyResult | null>(null);

  // Risk Modal State
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [activeStrategyForRisk, setActiveStrategyForRisk] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
        const data = await StrategyService.getAll();
        setStrategies(data);
    } catch (e) {
        console.error("Failed to load strategies", e);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = useCallback(async (id: string) => {
      if (window.confirm("Remover estratégia e todos os itens filhos?")) {
          try {
              await StrategyService.delete(id);
              loadData(); // Refresh to ensure tree consistency
          } catch(e) {
              console.error(e);
          }
      }
  }, [loadData]);

  const handleEdit = useCallback((strategy: Strategy) => {
      setEditingStrategy(strategy);
      setIsModalOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
      setEditingStrategy(null);
      setIsModalOpen(true);
  }, []);

  const handleSave = async (data: Partial<Strategy>) => {
      try {
          if (editingStrategy) {
              await StrategyService.update(editingStrategy.id, data);
          } else {
              await StrategyService.create(data);
          }
          loadData();
      } catch (e) {
          console.error(e);
          alert("Erro ao salvar estratégia");
      }
  };

  const handleOpenKrModal = useCallback(async (strategyId: string) => {
      setActiveStrategyForKr(strategyId);
      setIsKrModalOpen(true);
  }, []);

  const handleSaveKr = async (strategyId: string, data: any) => {
      try {
          await StrategyService.addKeyResult(strategyId, data);
          loadData(); // Refresh UI
      } catch (e) {
          console.error(e);
          alert("Erro ao salvar Key Result");
      }
  };

  const handleOpenCheckInModal = useCallback((kr: KeyResult) => {
      setActiveKrForCheckIn(kr);
      setIsCheckInModalOpen(true);
  }, []);

  const handleSaveCheckIn = async (keyResultId: string, data: { newValue: number, comment?: string }) => {
      try {
          await StrategyService.createCheckIn(keyResultId, data);
          loadData(); // Refresh UI to show updated progress bar
      } catch (e) {
          console.error(e);
          alert("Erro ao salvar Check-in");
      }
  };

  const handleOpenRiskModal = useCallback(async (strategyId: string) => {
      setActiveStrategyForRisk(strategyId);
      setIsRiskModalOpen(true);
  }, []);

  const handleSaveRisk = async (strategyId: string, data: any) => {
      try {
          await StrategyService.addRisk(strategyId, data);
          loadData(); // Refresh UI
      } catch (e) {
          console.error(e);
          alert("Erro ao reportar risco");
      }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
       {/* Header */}
       <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
          <div>
              <div className="flex items-center gap-3 mb-1.5">
                  <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-purple-500/20">
                      <Target className="text-white w-4 h-4" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                      Matriz Estratégica (Hoshin Kanri)
                  </h2>
              </div>
              <p className="text-slate-500 text-[14px]">
                  Alinhamento de Objetivos e Key Results (OKRs) para toda a organização.
              </p>
          </div>
          <button 
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-semibold text-[13px] flex items-center gap-2 transition-all shadow-md shadow-purple-500/25 active:scale-[0.98]"
            onClick={handleCreate}
          >
             <Plus size={16} /> Novo Pilar Estratégico
          </button>
       </div>

       {/* Tree Content */}
       <div className="flex-1 overflow-auto pr-4 custom-scrollbar">
          {isLoading ? (
              <div className="p-8 text-center text-slate-400">Carregando mapa estratégico...</div>
          ) : strategies.length > 0 ? (
              <StrategicTree 
                 strategies={strategies} 
                 onEdit={handleEdit} 
                 onDelete={handleDelete} 
                 onAddKeyResult={handleOpenKrModal} 
                 onCheckIn={handleOpenCheckInModal} 
                 onAddRisk={handleOpenRiskModal}
              />
          ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl flex items-center justify-center">
                          <Sparkles className="w-7 h-7 text-slate-400" />
                      </div>
                  </div>
                  <div>
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Nenhuma estratégia definida</h3>
                      <p className="text-[14px] text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                          O mapa estratégico está vazio. Comece estruturando o primeiro pilar ou perspectiva da empresa.
                      </p>
                  </div>
              </div>
          )}
       </div>

       <StrategyFormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave}
          initialData={editingStrategy}
       />

       <KeyResultModal 
          isOpen={isKrModalOpen}
          strategyId={activeStrategyForKr || ''}
          onClose={() => setIsKrModalOpen(false)}
          onSave={handleSaveKr}
       />

       <CheckInModal 
          isOpen={isCheckInModalOpen}
          kr={activeKrForCheckIn}
          onClose={() => setIsCheckInModalOpen(false)}
          onSave={handleSaveCheckIn}
       />

       <RiskModal 
          isOpen={isRiskModalOpen}
          strategyId={activeStrategyForRisk || ''}
          onClose={() => setIsRiskModalOpen(false)}
          onSave={handleSaveRisk}
       />
    </div>
  );
};

