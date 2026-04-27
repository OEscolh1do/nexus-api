import React, { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useSolarStore } from '@/core/state/solarStore';
import { calcKWpAlvo } from '@/core/state/slices/journeySlice';
import { ConsumptionChart } from './consumption/ConsumptionChart';
import { SimulatedLoadsPanel } from './consumption/SimulatedLoadsPanel';
import { TrendingUp, Plus, Ruler, Info, CheckCircle2, Factory, Trash2, X, AlertTriangle, Hash, Activity } from 'lucide-react';

const formatNumber = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
};

// Common circuit breaker values (Amperes)
const BREAKER_OPTIONS = [10, 16, 20, 25, 32, 40, 50, 63, 70, 80, 100, 125, 150, 200];

export const ConsumptionCanvasView: React.FC<{ className?: string }> = ({ className }) => {
  const clientData = useSolarStore(s => s.clientData);
  const simulatedItems = useSolarStore(s => s.simulatedItems);
  const loadGrowthFactor = useSolarStore(s => s.loadGrowthFactor);
  const setKWpAlvo = useSolarStore(s => s.setKWpAlvo);
  const kWpAlvo = useSolarStore(s => s.kWpAlvo);

  const activeInvoiceId = useSolarStore(s => s.activeInvoiceId);
  const setActiveInvoice = useSolarStore(s => s.setActiveInvoice);
  const addInvoice = useSolarStore(s => s.addInvoice);
  const removeInvoice = useSolarStore(s => s.removeInvoice);
  const updateActiveInvoice = useSolarStore(s => s.updateActiveInvoice);



  const invoices = clientData.invoices || [];
  const activeInvoice = invoices.find(inv => inv.id === activeInvoiceId) || invoices[0];
  const activeInvoiceAvg = activeInvoice ? (activeInvoice.monthlyHistory.reduce((a, b) => a + b, 0) / 12) : 0;

  const [pendingAvg, setPendingAvg] = React.useState<number | null>(null);
  const [ucToDeleteId, setUcToDeleteId] = React.useState<string | null>(null);
  const [editingUcId, setEditingUcId] = React.useState<string | null>(null);
  
  const hasManualHistory = useMemo(() => {
    if (!activeInvoice || !activeInvoice.monthlyHistory) return false;
    return activeInvoice.monthlyHistory.some(val => val !== activeInvoiceAvg);
  }, [activeInvoice, activeInvoiceAvg]);

  const handleAverageChange = (newVal: number) => {
    if (hasManualHistory) {
      setPendingAvg(newVal);
    } else {
      updateActiveInvoice({ monthlyHistory: Array(12).fill(newVal) });
    }
  };

  const confirmAverageChange = () => {
    if (pendingAvg !== null) {
      updateActiveInvoice({ monthlyHistory: Array(12).fill(pendingAvg) });
      setPendingAvg(null);
    }
  };

  const totalConsumptionMonthly = useMemo(() => {
    const baseHistory = Array(12).fill(0);
    invoices.forEach(inv => {
      const history = (inv.monthlyHistory?.length === 12) ? inv.monthlyHistory : Array(12).fill(0);
      for (let i = 0; i < 12; i++) {
        baseHistory[i] += history[i];
      }
    });

    const simulatedArray = Array(12).fill(0).map(() => {
      return Object.values(simulatedItems.entities).reduce((sum, item) => {
        const duty = item.dutyCycle ?? 1;
        const kwh = ((item.power * duty * item.hoursPerDay * (item.daysPerMonth ?? 30) * item.qty) / 1000);
        return sum + kwh;
      }, 0);
    });

    return baseHistory.map((val, i) => val + simulatedArray[i]);
  }, [invoices, simulatedItems]);

  const totalConsumptionAvg = useMemo(() => {
    const avg = totalConsumptionMonthly.reduce((a, b) => a + b, 0) / 12;
    return avg * (1 + loadGrowthFactor / 100);
  }, [totalConsumptionMonthly, loadGrowthFactor]);

  useEffect(() => {
    const monthlyHsp = clientData.monthlyIrradiation ?? [];
    if (totalConsumptionAvg > 0) {
      const result = calcKWpAlvo(totalConsumptionMonthly, monthlyHsp, loadGrowthFactor);
      setKWpAlvo(result);
    } else {
      setKWpAlvo(0);
    }
  }, [totalConsumptionMonthly, clientData.monthlyIrradiation, loadGrowthFactor, setKWpAlvo, totalConsumptionAvg]);

  const [expandedField, setExpandedField] = React.useState<'connection' | 'voltage' | null>(null);

  const handleDeleteRequest = (id: string) => {
    const targetUC = invoices.find(inv => inv.id === id);
    if (!targetUC) return;

    const hasData = targetUC.monthlyHistory.some(v => v > 0);
    if (hasData) {
      setUcToDeleteId(id);
    } else {
      removeInvoice(id);
    }
  };

  if (!activeInvoice) return null;

  return (
    <div className={cn('relative w-full h-full flex flex-col bg-slate-950 overflow-hidden', className)}>
      
      {/* ── LEVEL 2: INSTALLATION HUB (Navigation Bar) ───────────────────────────── */}
      <div className="bg-slate-900/50 border-b border-slate-800 flex items-center shrink-0 z-20 h-10">
         <div className="flex items-center h-full px-3 border-r border-slate-800 text-slate-500">
            <Factory size={12} />
         </div>
         
         <div className="flex-1 flex items-center overflow-x-auto custom-scrollbar h-full">
            {invoices.map((inv, idx) => {
               const isActive = inv.id === activeInvoiceId;
               const isEditing = editingUcId === inv.id;

               return (
                 <div key={inv.id} className="flex items-center shrink-0 h-full relative group/tab">
                   {isEditing ? (
                     <input
                        autoFocus
                        defaultValue={inv.name}
                        onBlur={(e) => {
                          updateActiveInvoice({ name: e.target.value });
                          setEditingUcId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateActiveInvoice({ name: (e.target as HTMLInputElement).value });
                            setEditingUcId(null);
                          }
                          if (e.key === 'Escape') setEditingUcId(null);
                        }}
                        className="h-full bg-slate-950 text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider px-6 focus:outline-none border-r border-indigo-500/30 min-w-[120px]"
                     />
                   ) : (
                     <button
                       onClick={() => setActiveInvoice(inv.id)}
                       onDoubleClick={() => setEditingUcId(inv.id)}
                       className={cn(
                         "h-full px-6 text-[10px] font-black uppercase tracking-[0.15em] transition-all relative border-r border-slate-800 cursor-text",
                         isActive 
                           ? "bg-slate-950 text-sky-400 shadow-[inset_0_-2px_0_theme(colors.sky.500)]" 
                           : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
                       )}
                     >
                       {inv.name || `UC ${idx + 1}`}
                     </button>
                   )}
                   
                   {!isEditing && isActive && invoices.length > 1 && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); handleDeleteRequest(inv.id); }}
                       className="absolute right-1 top-1 p-0.5 text-slate-700 hover:text-rose-400 rounded-sm transition-all bg-slate-950/30 opacity-0 group-hover/tab:opacity-100"
                       title="Excluir Unidade"
                     >
                       <X size={8} strokeWidth={3} />
                     </button>
                   )}
                 </div>
               );
            })}
            <button
              onClick={() => addInvoice({ name: `UC ${invoices.length + 1}` })}
              className="h-full px-4 flex items-center gap-2 text-slate-500 hover:text-indigo-400 transition-all text-[9px] font-bold uppercase tracking-widest border-r border-slate-800"
            >
              <Plus size={12} /> Nova Unidade
            </button>
         </div>

         {/* ALVO CC - Integrated into Hub Bar */}
         <div className="flex items-center gap-4 px-5 h-full bg-slate-950/80 border-l border-slate-800 shadow-inner shrink-0 group">
            <div className="flex flex-col justify-center">
              <span className="text-[7px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-none mb-0.5">
                Alvo CC
              </span>
              <div className="flex items-baseline gap-1">
                <div className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)] mr-1.5 mb-0.5 animate-pulse" />
                <span className="text-[12px] font-mono font-black text-slate-100 tabular-nums tracking-tighter">
                  {kWpAlvo && kWpAlvo > 0 ? formatNumber(kWpAlvo) : "0.00"}
                </span>
                <span className="text-[8px] font-bold text-slate-500 uppercase ml-0.5">kWp</span>
              </div>
            </div>
         </div>
      </div>

      {/* ── LEVEL 3: ACTIVE METER SETTINGS (UC Strip) ───────────────────────────── */}
      <div className="bg-slate-950/50 border-b border-slate-800/60 flex items-center px-4 py-1.5 shrink-0 gap-6 z-10 overflow-x-auto custom-scrollbar">
          
          {/* NÚMERO DA INSTALAÇÃO */}
          <div className="flex items-center gap-2">
             <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-1.5">
                <Hash size={10} className="text-slate-600" /> Instalação
             </span>
             <div className="flex items-center bg-slate-900 border border-slate-800/80 rounded-sm px-2 py-0.5">
               <input 
                 type="text"
                 placeholder="Número da fatura..."
                 value={activeInvoice.installationNumber || ''}
                 onChange={e => updateActiveInvoice({ installationNumber: e.target.value })}
                 className="bg-transparent text-slate-300 font-mono font-bold text-[10px] focus:outline-none w-24 uppercase placeholder:text-slate-700/60"
               />
             </div>
          </div>

          {/* LIGAÇÃO ELÉTRICA (Flyout) */}
          <div className="flex items-center gap-3 border-l border-slate-800/80 pl-6">
             <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest flex items-center gap-1.5">
                <Ruler size={10} className="text-slate-700" /> Ligação
             </span>
             <div className="flex items-center bg-slate-900 border border-slate-800/80 rounded-[2px] overflow-hidden relative">
                {['monofasico', 'bifasico', 'trifasico'].map((type) => {
                  const isActive = activeInvoice.connectionType === type;
                  const isExpanded = expandedField === 'connection';
                  if (!isActive && !isExpanded) return null;
                  
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        if (!isExpanded) {
                          setExpandedField('connection');
                        } else {
                          updateActiveInvoice({ connectionType: type as any });
                          setExpandedField(null);
                        }
                      }}
                      className={cn(
                        "h-6 px-2.5 text-[9px] font-mono font-bold uppercase transition-all duration-200 border-r border-slate-800/50 last:border-0",
                        isActive 
                          ? "bg-slate-800 text-indigo-400 border-indigo-500/30 z-10" 
                          : "text-slate-500 bg-slate-950/40 hover:text-slate-300 hover:bg-slate-800 animate-in slide-in-from-left-1"
                      )}
                    >
                      {type === 'monofasico' ? 'Mono' : type === 'bifasico' ? 'Bi' : 'Tri'}
                    </button>
                  );
                })}
                {expandedField === 'connection' && (
                  <button 
                    onClick={() => setExpandedField(null)}
                    className="absolute inset-0 z-0"
                  />
                )}
             </div>
          </div>

          {/* NÍVEL DE TENSÃO (Flyout) */}
          <div className="flex items-center gap-2 border-l border-slate-800/80 pl-6">
             <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Tensão</span>
             <div className="flex items-center bg-slate-900 border border-slate-800/80 rounded-[2px] overflow-hidden relative">
                {['127', '220', '380'].map((v) => {
                  const isActive = activeInvoice.voltage === v;
                  const isExpanded = expandedField === 'voltage';
                  if (!isActive && !isExpanded) return null;

                  return (
                    <button
                      key={v}
                      onClick={() => {
                        if (!isExpanded) {
                          setExpandedField('voltage');
                        } else {
                          updateActiveInvoice({ voltage: v });
                          setExpandedField(null);
                        }
                      }}
                      className={cn(
                        "h-6 px-2 text-[9px] font-mono font-bold uppercase transition-all duration-200 border-r border-slate-800/50 last:border-0",
                        isActive 
                          ? "bg-slate-800 text-indigo-400 border-indigo-500/30 z-10" 
                          : "text-slate-500 bg-slate-950/40 hover:text-slate-300 hover:bg-slate-800 animate-in slide-in-from-left-1"
                      )}
                    >
                      {v}V
                    </button>
                  );
                })}
             </div>
          </div>

          {/* DISJUNTOR DE ENTRADA */}
          <div className="flex items-center gap-2 border-l border-slate-800/80 pl-6">
             <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Disjuntor</span>
             <select 
                value={activeInvoice.breakerCurrent || 50}
                onChange={e => updateActiveInvoice({ breakerCurrent: Number(e.target.value) })}
                className="bg-slate-900 border border-slate-800/80 rounded-sm px-1.5 py-0.5 text-slate-200 font-mono font-bold text-[10px] outline-none focus:border-slate-600"
             >
                {BREAKER_OPTIONS.map(val => (
                  <option key={val} value={val}>{val}A</option>
                ))}
             </select>
          </div>

          {/* TARIFA (Individual) */}
          <div className="flex items-center gap-2 border-l border-slate-800/80 pl-6">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-1.5">
                <Activity size={10} className="text-slate-600" /> Tarifa
              </span>
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-sm px-2 py-0.5">
                <span className="text-[9px] text-slate-500 font-mono font-bold mr-1">R$</span>
                <input 
                  type="number"
                  step={0.01}
                  value={activeInvoice.tariffRate || 0.92}
                  onChange={e => updateActiveInvoice({ tariffRate: Number(e.target.value) })}
                  className="w-12 bg-transparent text-slate-200 font-mono font-bold text-[10px] focus:outline-none tabular-nums text-center"
                />
              </div>
          </div>
          
          {/* MÉDIA BASE */}
          <div className="flex items-center gap-3 border-l border-slate-800/80 pl-6">
             <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-1.5">
                <TrendingUp size={10} className="text-slate-600" /> Média Base
             </span>
             <div className="flex items-center bg-slate-900 border border-slate-800 rounded-sm px-2 py-0.5">
               <input 
                 type="number"
                 value={activeInvoiceAvg ? Number(activeInvoiceAvg.toFixed(2)) : 0}
                 onChange={e => handleAverageChange(Number(e.target.value))}
                 className="bg-transparent text-slate-100 font-mono font-bold text-[12px] focus:outline-none w-16 text-center tabular-nums"
               />
               <span className="text-[9px] text-slate-500 font-bold ml-1">kWh</span>
             </div>
          </div>
      </div>

      {/* ── MAIN CONTENT (Visualization & Payload) ───────────────── */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950 p-4 relative gap-4">
         
         <div className="bg-slate-900/50 border border-slate-800 rounded-sm shadow-2xl overflow-hidden flex-1 flex flex-col relative">
            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
               
               {/* Primary Chart Area */}
               <div className="flex-1 min-h-[300px] lg:min-h-0 p-4 lg:p-6 flex flex-col relative">
                  <ConsumptionChart />
               </div>
               
               {/* Simulated Loads Sidebar */}
               <div className="w-full lg:w-[320px] border-t lg:border-t-0 lg:border-l border-slate-800 p-4 flex flex-col overflow-hidden bg-slate-950/40">
                  <SimulatedLoadsPanel 
                    compact 
                    projectionAvg={totalConsumptionAvg} 
                  />
               </div>
             </div>

             {/* DATA OVERRIDE OVERLAY (Confirmation) */}
             {pendingAvg !== null && (
               <div className="absolute inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
                 <div className="w-full max-w-sm bg-slate-900 border border-slate-800 shadow-2xl p-6 relative">
                   
                   <div className="flex items-center gap-3 mb-4">
                     <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-sm">
                       <Info size={18} className="text-amber-400" />
                     </div>
                     <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-100">
                       Ajuste Manual Detectado
                     </h2>
                   </div>

                   <div className="space-y-4">
                     <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                       Esta UC possui dados customizados por mês. Ao definir uma nova média de <span className="text-amber-400 font-bold font-mono text-xs">{formatNumber(pendingAvg)} kWh</span>, o histórico manual será sobrescrito.
                     </p>

                     <div className="grid grid-cols-2 gap-3">
                       <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-sm">
                          <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest block mb-2">Estado Atual</span>
                          <div className="flex items-end gap-0.5 h-6 opacity-30">
                             {[30, 70, 45, 90, 60, 40, 80, 55, 30, 65, 85, 50].map((h, i) => (
                               <div key={i} className="flex-1 bg-slate-600" style={{ height: `${h}%` }} />
                             ))}
                          </div>
                       </div>
                       <div className="p-2.5 bg-amber-900/10 border border-amber-500/20 rounded-sm">
                          <span className="text-[8px] text-amber-500/70 font-black uppercase tracking-widest block mb-2">Novo Padrão</span>
                          <div className="flex items-end gap-0.5 h-6">
                             {Array.from({ length: 12 }).map((_, i) => (
                               <div key={i} className="flex-1 bg-amber-400/40" style={{ height: `65%` }} />
                             ))}
                          </div>
                       </div>
                     </div>
                   </div>

                   <div className="mt-6 flex gap-2">
                     <button 
                       onClick={() => setPendingAvg(null)}
                       className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-all border border-slate-800 rounded-sm"
                     >
                       Cancelar
                     </button>
                     <button 
                       onClick={confirmAverageChange}
                       className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2 group"
                     >
                       <CheckCircle2 size={12} className="group-hover:scale-110 transition-transform" /> Aplicar
                     </button>
                   </div>
                 </div>
               </div>
             )}

             {/* DELETE UC CONFIRMATION OVERLAY */}
             {ucToDeleteId !== null && (
               <div className="absolute inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
                 <div className="w-full max-w-sm bg-slate-900 border border-rose-500/20 shadow-2xl p-6 relative">
                   
                   <div className="flex items-center gap-3 mb-4">
                     <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-sm">
                       <AlertTriangle size={18} className="text-rose-500" />
                     </div>
                     <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                       Excluir Unidade Consumidora?
                     </h2>
                   </div>

                   <p className="text-[10px] text-slate-400 leading-relaxed font-medium mb-6">
                     Você está prestes a remover a <span className="text-rose-400 font-bold font-mono">UC {invoices.findIndex(inv => inv.id === ucToDeleteId) + 1}</span>. Todos os dados de faturas e histórico associados serão perdidos permanentemente.
                   </p>

                   <div className="flex gap-2">
                     <button 
                       onClick={() => setUcToDeleteId(null)}
                       className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-all border border-slate-800 rounded-sm"
                     >
                       Cancelar
                     </button>
                     <button 
                       onClick={() => {
                         removeInvoice(ucToDeleteId);
                         setUcToDeleteId(null);
                       }}
                       className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2 group"
                     >
                       <Trash2 size={12} className="group-hover:scale-110 transition-transform" /> Confirmar Exclusão
                     </button>
                   </div>
                 </div>
               </div>
             )}
          </div>
       </div>

    </div>
  );
};
