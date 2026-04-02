import React, { useState } from 'react';
import { X, Play, Loader2, Zap, LayoutGrid, AlertCircle, Wallet } from 'lucide-react';
import { ProjectService } from '@/services/ProjectService';
import { useSolarStore } from '@/core/state/solarStore';

interface ProjectInitWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectInitWizardModal: React.FC<ProjectInitWizardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const setActiveModule = useSolarStore(s => s.setActiveModule);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos Básicos
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [city, setCity] = useState('');
  const [stateUF, setStateUF] = useState('');
  const [connectionType, setConnectionType] = useState<'monofasico' | 'bifasico' | 'trifasico'>('monofasico');
  const [tariffRate, setTariffRate] = useState<number>(0.92);

  // Consumo
  const [consumptionMode, setConsumptionMode] = useState<'AVERAGE' | 'DETAILED'>('AVERAGE');
  const [averageConsumption, setAverageConsumption] = useState<number>(0);
  const [monthlyConsumption, setMonthlyConsumption] = useState<number[]>(Array(12).fill(0));

  const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const validate = () => {
    if (!clientName.trim()) return 'Nome do Cliente é obrigatório.';
    if (!city.trim() || stateUF.length !== 2) return 'Cidade e UF (2 letras) são obrigatórios.';
    if (consumptionMode === 'AVERAGE' && averageConsumption <= 0) return 'Insira um consumo médio válido.';
    if (consumptionMode === 'DETAILED' && monthlyConsumption.every(v => v === 0)) return 'Insira pelo menos um mês de consumo na tabela.';
    return null;
  };

  const handleCreate = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const history = consumptionMode === 'AVERAGE' 
        ? Array(12).fill(averageConsumption) 
        : monthlyConsumption;

      const newId = await ProjectService.createStandaloneProject({
        projectName: projectName || `Projeto ${clientName}`,
        clientName,
        city,
        stateUF,
        connectionType,
        tariffRate,
        monthlyHistory: history
      });

      if (newId) {
        onClose();
        setActiveModule('engineering');
      } else {
        setError('Ocorreu um erro na criação do projeto via API.');
      }
    } catch (e) {
      setError('Falha de conexão com os servidores do Kurupira.');
    } finally {
      setLoading(false);
    }
  };

  const updateMonth = (index: number, val: number) => {
    const newArr = [...monthlyConsumption];
    newArr[index] = val;
    setMonthlyConsumption(newArr);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
      />

      {/* Modal Content */}
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/30">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Play size={16} className="fill-current" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Novo Projeto Autônomo</h2>
              <p className="text-[10px] text-slate-400">Kurupira Engineering-First Flow</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} className="p-2 rounded hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {error && (
             <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-xs">
                 <AlertCircle size={14} className="mt-0.5 shrink-0" />
                 <p>{error}</p>
             </div>
          )}

          {/* Seção 1: Identificação */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid size={14} /> Identificação e Local
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400">Nome do Cliente *</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex: Supermercado Central"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400">Título Interno (Opcional)</label>
                <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Ex: Matriz - Fase 1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-8 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400">Cidade *</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: Manaus"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
              </div>
              <div className="col-span-4 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400">Estado (UF) *</label>
                <input type="text" value={stateUF} onChange={e => setStateUF(e.target.value.toUpperCase())} maxLength={2} placeholder="AM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors uppercase" />
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-slate-800/50" />

          {/* Seção 2: Dados Elétricos */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Zap size={14} /> Infraestrutura & Fatura
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400">Tipo de Conexão Nominal</label>
                <select value={connectionType} onChange={e => setConnectionType(e.target.value as 'monofasico' | 'bifasico' | 'trifasico')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors">
                  <option value="monofasico">Monofásico</option>
                  <option value="bifasico">Bifásico</option>
                  <option value="trifasico">Trifásico</option>
                </select>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                   <Wallet size={12}/> Tarifa Unitária (R$/kWh)
                 </label>
                 <input type="number" step="0.01" min="0" value={tariffRate} onChange={e => setTariffRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono" />
              </div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 mt-2">
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" checked={consumptionMode === 'AVERAGE'} onChange={() => setConsumptionMode('AVERAGE')} className="accent-emerald-500" />
                  <span className="text-xs font-bold text-slate-300 group-hover:text-emerald-400 transition-colors">Média Simplificada</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" checked={consumptionMode === 'DETAILED'} onChange={() => setConsumptionMode('DETAILED')} className="accent-emerald-500" />
                  <span className="text-xs font-bold text-slate-300 group-hover:text-emerald-400 transition-colors">Fatura Detalhada (12 Meses)</span>
                </label>
              </div>

              {consumptionMode === 'AVERAGE' ? (
                <div className="space-y-1.5 max-w-xs animate-in fade-in">
                  <label className="text-[10px] text-slate-500">Média Geral Mensal (kWh)</label>
                  <div className="relative">
                     <input type="number" min="0" value={averageConsumption} onChange={e => setAverageConsumption(Number(e.target.value))}
                       className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono" />
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">kWh/mês</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 animate-in slide-in-from-top-2 duration-300">
                  {MONTHS.map((m, i) => (
                    <div key={m} className="space-y-1 bg-slate-900 p-2 rounded-lg border border-slate-800/50">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block text-center">{m}</label>
                      <input type="number" min="0" value={monthlyConsumption[i]} onChange={e => updateMonth(i, Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700/50 rounded px-2 py-1 text-xs text-center text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/20 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button onClick={handleCreate} disabled={loading} 
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-[0_0_20px_rgba(5,150,105,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="fill-current" />}
            {loading ? 'Inicializando...' : 'Lançar Projeto'}
          </button>
        </div>

      </div>
    </div>
  );
};
