import React, { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useSolarStore } from '@/core/state/solarStore';
import { calcKWpAlvo } from '@/core/state/slices/journeySlice';
import { ConsumptionChart } from './consumption/ConsumptionChart';
import { SimulatedLoadsPanel } from './consumption/SimulatedLoadsPanel';
import { UCCompletionRing } from './consumption/UCCompletionRing';
import { TrendingUp, Plus, Ruler, Info, CheckCircle2, Trash2, X, AlertTriangle, Hash, Activity, DollarSign, Cable } from 'lucide-react';

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
    // Precisão de 1 kWh para evitar disparos falsos por arredondamento
    return activeInvoice.monthlyHistory.some(val => Math.abs(val - activeInvoiceAvg) > 1);
  }, [activeInvoice, activeInvoiceAvg]);

  // --- LOCAL STATE PARA EDIÇÃO FLUIDA ---
  const [localAvg, setLocalAvg] = React.useState<string>(
    activeInvoiceAvg > 0 ? Math.round(activeInvoiceAvg).toString() : ''
  );

  const isAvgFocused = React.useRef(false);

  // Sincroniza local -> store quando mudar de UC ou quando a média mudar externamente (apenas se não estiver focado)
  useEffect(() => {
    if (isAvgFocused.current) return;
    
    const roundedStore = Math.round(activeInvoiceAvg);
    const currentLocal = localAvg === '' ? 0 : Number(localAvg);
    
    if (Math.abs(roundedStore - currentLocal) > 0.1) {
      setLocalAvg(activeInvoiceAvg > 0 ? Math.round(activeInvoiceAvg).toString() : '');
    }
  }, [activeInvoiceAvg, activeInvoiceId]);

  const handleAverageChange = (newVal: number) => {
    if (hasManualHistory) {
      setPendingAvg(newVal);
    } else {
      updateActiveInvoice({ monthlyHistory: Array(12).fill(newVal) });
    }
  };

  const onAvgBlur = () => {
    const num = localAvg === '' ? 0 : Number(localAvg);
    // Só dispara se houver mudança real
    if (Math.abs(num - activeInvoiceAvg) > 0.1) {
      handleAverageChange(num);
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
      <div className="bg-slate-900/50 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center shrink-0 z-20 min-h-[3.5rem] lg:h-14">

        {/* TOP ROW / MAIN NAVIGATION (UCs) */}
        <div className="flex items-center flex-1 min-w-0 h-14 lg:h-full">
          {/* Prefixo — ícone + badge de contagem + completion ring */}
          <div className="flex flex-col items-center justify-center gap-0.5 px-3 h-full border-r border-slate-800 shrink-0">
            <UCCompletionRing
              monthlyHistory={activeInvoice?.monthlyHistory}
              connectionType={activeInvoice?.connectionType}
              voltage={activeInvoice?.voltage}
              tariffRate={activeInvoice?.tariffRate}
              installationNumber={activeInvoice?.installationNumber}
              size={22}
            />
            <span className="text-[8px] text-slate-600 font-black tabular-nums leading-none">
              {invoices.length} UC
            </span>
          </div>

          {/* Abas de UC */}
          <div className="flex-1 flex items-stretch overflow-x-auto custom-scrollbar h-full">
            {invoices.map((inv, idx) => {
              const isActive = inv.id === activeInvoiceId;
              const isEditing = editingUcId === inv.id;
              const avg = inv.monthlyHistory?.length === 12
                ? Math.round(inv.monthlyHistory.reduce((a: number, b: number) => a + b, 0) / 12)
                : 0;
              const voltageLabel = inv.voltage ? ` · ${inv.voltage}V` : '';

              return (
                <div key={inv.id} className="flex items-stretch shrink-0 h-full relative group/tab">
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
                      className="bg-slate-950 text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider px-5 focus:outline-none border-r border-indigo-500/30 min-w-[120px] self-stretch"
                    />
                  ) : (
                    <button
                      onClick={() => setActiveInvoice(inv.id)}
                      onDoubleClick={() => setEditingUcId(inv.id)}
                      className={cn(
                        "flex flex-col justify-center px-5 pr-7 pt-1 transition-all relative border-r border-slate-800 text-left",
                        isActive
                          ? "bg-slate-950 border-t-2 border-t-sky-500"
                          : "border-t-2 border-t-transparent hover:bg-slate-900/40 hover:border-t-slate-700",
                        "min-w-[140px] sm:min-w-[160px]"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.6)] dot-breathe shrink-0" />
                        )}
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-[0.12em] leading-none whitespace-nowrap",
                          isActive ? "text-sky-400" : "text-slate-500 group-hover/tab:text-slate-300"
                        )}>
                          {inv.name || `UC ${idx + 1}`}
                        </span>
                      </div>
                      <div className={cn(
                        "text-[9px] font-mono tabular-nums leading-none mt-1",
                        isActive ? "text-slate-500" : "text-slate-700 group-hover/tab:text-slate-600"
                      )}>
                        {avg > 0 ? `${avg} kWh${voltageLabel}` : 'Sem dados'}
                      </div>
                    </button>
                  )}

                  {!isEditing && isActive && invoices.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteRequest(inv.id); }}
                      className="absolute right-1 top-1.5 p-0.5 text-slate-700 hover:text-rose-400 rounded-sm transition-all opacity-0 group-hover/tab:opacity-100"
                      title="Excluir Unidade"
                    >
                      <X size={8} strokeWidth={3} />
                    </button>
                  )}
                </div>
              );
            })}

            <div className="flex items-center px-2 sm:px-3 border-l lg:border-r border-slate-800 h-full shrink-0">
              <button
                onClick={() => addInvoice({ name: `UC ${invoices.length + 1}` })}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 border border-dashed border-slate-700 hover:border-indigo-500/60 text-slate-600 hover:text-indigo-400 rounded-sm transition-all text-[9px] font-black uppercase tracking-widest"
              >
                <Plus size={10} strokeWidth={2.5} /> 
                <span className="hidden min-[450px]:inline">Nova UC</span>
              </button>
            </div>
          </div>
        </div>

        {/* ALVO CC — Hero Metric with shimmer */}
        <div className="flex items-center justify-between lg:justify-start gap-3 px-5 py-2 lg:py-0 h-12 lg:h-full bg-gradient-to-r from-indigo-500/5 to-transparent border-t lg:border-t-0 lg:border-l border-slate-800 shadow-inner shrink-0">
          <div className="flex flex-col justify-center">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em] leading-none mb-1">
              Alvo CC
            </span>
            <div className="flex items-baseline gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] mr-0.5 mb-0.5 dot-breathe" />
              <span
                key={kWpAlvo?.toFixed(2)}
                className="text-[16px] lg:text-[18px] font-mono font-black text-indigo-400 tabular-nums kwp-shimmer rounded-sm px-1 -ml-1"
              >
                {kWpAlvo && kWpAlvo > 0 ? formatNumber(kWpAlvo) : "0.00"}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase ml-0.5">kWp</span>
            </div>
          </div>
          <div className="lg:hidden">
            <TrendingUp size={14} className="text-indigo-500/40" />
          </div>
        </div>
      </div>

      {/* ── LEVEL 3: ACTIVE METER SETTINGS (UC Strip) ───────────────────────────── */}
      <div className="bg-slate-950/50 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center shrink-0 z-10 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">

        {/* ── GRUPO: ELÉTRICO ─────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-4 py-3 lg:py-1.5 shrink-0 overflow-x-auto scrollbar-hide scroll-mask-h">
          {/* Badge de Seção */}
          <div className="flex items-center gap-1.5 px-2 py-1 lg:py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-sm shrink-0 w-fit">
            <Cable size={9} className="text-indigo-400" />
            <span className="text-[8px] text-indigo-400 font-black uppercase tracking-[0.15em]">Elétrico</span>
          </div>

          {/* NÚMERO DA INSTALAÇÃO */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest flex items-center gap-1">
              <Hash size={9} className="text-slate-700" /> Inst.
            </span>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-sm px-2 h-11 lg:h-7">
              <input
                type="text"
                placeholder="Nº fatura..."
                value={activeInvoice.installationNumber || ''}
                onChange={e => updateActiveInvoice({ installationNumber: e.target.value })}
                className="bg-transparent text-slate-300 font-mono font-bold text-[10px] focus:outline-none w-20 uppercase placeholder:text-slate-700/60"
              />
            </div>
          </div>

          {/* LIGAÇÃO ELÉTRICA (Flyout) */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest flex items-center gap-1">
              <Ruler size={9} className="text-slate-700" /> Ligação
            </span>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-[2px] overflow-hidden relative h-11 lg:h-7">
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
                      "h-full px-2.5 text-[9px] font-mono font-bold uppercase transition-all duration-200 border-r border-slate-800 last:border-0",
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
                <button onClick={() => setExpandedField(null)} className="absolute inset-0 z-0" />
              )}
            </div>
          </div>

          {/* NÍVEL DE TENSÃO (Flyout) */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Tensão</span>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-[2px] overflow-hidden relative h-11 lg:h-7">
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
                      "h-full px-2 text-[9px] font-mono font-bold uppercase transition-all duration-200 border-r border-slate-800 last:border-0",
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
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Disjuntor</span>
            <select
              value={activeInvoice.breakerCurrent || 50}
              onChange={e => updateActiveInvoice({ breakerCurrent: Number(e.target.value) })}
              className="bg-slate-900 border border-slate-800 rounded-sm px-1.5 h-11 lg:h-7 text-slate-200 font-mono font-bold text-[10px] outline-none focus:border-indigo-500/40 transition-colors"
            >
              {BREAKER_OPTIONS.map(val => (
                <option key={val} value={val}>{val}A</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── GRUPO: TARIFÁRIO ────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-4 py-3 lg:py-1.5 shrink-0 overflow-x-auto scrollbar-hide scroll-mask-h">
          {/* Badge de Seção */}
          <div className="flex items-center gap-1.5 px-2 py-1 lg:py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-sm shrink-0 w-fit">
            <DollarSign size={9} className="text-emerald-400" />
            <span className="text-[8px] text-emerald-400 font-black uppercase tracking-[0.15em]">Tarifário</span>
          </div>

          {/* TARIFA */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest flex items-center gap-1">
              <Activity size={9} className="text-slate-700" /> Tarifa
            </span>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-sm px-2 h-11 lg:h-7">
              <span className="text-[9px] text-slate-500 font-mono font-bold mr-1">R$</span>
              <input
                type="number"
                step={0.01}
                inputMode="decimal"
                value={activeInvoice.tariffRate || 0.92}
                onChange={e => updateActiveInvoice({ tariffRate: Number(e.target.value) })}
                className="w-12 bg-transparent text-emerald-300 font-mono font-bold text-[10px] focus:outline-none tabular-nums text-center"
              />
            </div>
          </div>

          {/* MÉDIA BASE */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest flex items-center gap-1">
              <TrendingUp size={9} className="text-slate-700" /> Média
            </span>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-sm px-2 h-11 lg:h-7">
              <input
                type="number"
                inputMode="numeric"
                data-field="average-consumption"
                placeholder="0"
                value={localAvg}
                onFocus={() => { isAvgFocused.current = true; }}
                onChange={e => setLocalAvg(e.target.value)}
                onBlur={() => {
                  isAvgFocused.current = false;
                  onAvgBlur();
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="bg-transparent text-emerald-200 font-mono font-black text-[12px] focus:outline-none w-16 text-center tabular-nums placeholder:text-slate-800"
              />
              <span className="text-[9px] text-slate-500 font-bold ml-1">kWh</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT (Visualization & Payload) ───────────────── */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950 p-4 relative gap-4">
         
         <div className="bg-slate-900/50 border border-slate-800 rounded-sm shadow-2xl overflow-y-auto lg:overflow-hidden flex-1 flex flex-col relative custom-scrollbar">
            <div className="flex flex-col lg:flex-row lg:flex-1 lg:min-h-0">
               
               {/* Primary Chart Area */}
               <div className="flex-1 min-h-[300px] lg:min-h-0 p-4 lg:p-6 flex flex-col relative">
                  <ConsumptionChart />
               </div>
               
               {/* Simulated Loads Sidebar */}
               <div id="simulated-loads-panel" className="w-full lg:w-[320px] border-t lg:border-t-0 lg:border-l border-slate-800 p-4 flex flex-col overflow-hidden bg-slate-950/40">
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
