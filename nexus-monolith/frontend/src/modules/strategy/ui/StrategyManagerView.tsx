import React, { useEffect, useState, useCallback } from 'react';
import { Target, Plus } from 'lucide-react';
import { StrategicTree } from '../components/StrategyTree';
import { StrategyFormModal } from '../components/StrategyFormModal';
import { StrategyService } from '../services/strategy.service';
import type { Strategy } from '../types';

export const StrategyManagerView: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

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

  const handleDelete = async (id: string) => {
      if (window.confirm("Remover estratégia e todos os itens filhos?")) {
          try {
              await StrategyService.delete(id);
              loadData(); // Refresh to ensure tree consistency
          } catch(e) {
              console.error(e);
          }
      }
  };

  const handleEdit = (strategy: Strategy) => {
      setEditingStrategy(strategy);
      setIsModalOpen(true);
  };

  const handleCreate = () => {
      setEditingStrategy(null);
      setIsModalOpen(true);
  }

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
          alert("Erro ao salvar");
      }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
       {/* Header */}
       <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Target className="text-purple-600" />
                Matriz Estratégica (Hoshin Kanri)
             </h2>
             <p className="text-slate-500 text-sm mt-1">Alinhamento de Objetivos e Key Results (OKRs)</p>
          </div>
          <button 
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-purple-500/20"
            onClick={handleCreate}
          >
             <Plus size={16} /> Novo Pilar
          </button>
       </div>

       {/* Tree Content */}
       <div className="flex-1 overflow-auto pr-4 custom-scrollbar">
          {isLoading ? (
              <div className="p-8 text-center text-slate-400">Carregando mapa estratégico...</div>
          ) : strategies.length > 0 ? (
              <StrategicTree strategies={strategies} onEdit={handleEdit} onDelete={handleDelete} />
          ) : (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Target size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">Nenhuma estratégia definida.</p>
                  <p className="text-xs text-slate-400 mt-2">Comece criando um Pilar Estratégico.</p>
              </div>
          )}
       </div>

       <StrategyFormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave}
          initialData={editingStrategy}
       />
    </div>
  );
};

