
import React, { useState } from 'react';
import { Zap, Plus, X, Sparkles, Loader2, UploadCloud } from 'lucide-react';
import { DenseCard, DenseButton } from '@/components/ui/dense-form';
import { useSolarStore } from '@/core/state/solarStore';
import { NumericFormat } from 'react-number-format';

import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceData } from '@/core/types';
import { cn } from '@/lib/utils';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];


interface ConsumptionManagerProps {
  /** Controlled State: active invoice ID */
  activeInvoiceId?: string;
  /** Callback when invoice selection changes */
  onInvoiceSelect?: (id: string) => void;
}

export const ConsumptionManager: React.FC<ConsumptionManagerProps> = ({
  activeInvoiceId: externalActiveId,
  onInvoiceSelect
}) => {
  const clientData = useSolarStore(state => state.clientData);
  const updateClientData = useSolarStore(state => state.updateClientData);

  // Internal State (fallback if not controlled)
  const [internalActiveId, setInternalActiveId] = useState<string>(
    clientData.invoices?.[0]?.id || ''
  );

  // Determine active ID: Controlled vs Uncontrolled
  const activeInvoiceId = externalActiveId !== undefined ? externalActiveId : internalActiveId;

  // Helper to change active ID
  const handleSetActiveId = (id: string) => {
    if (onInvoiceSelect) {
      onInvoiceSelect(id);
    } else {
      setInternalActiveId(id);
    }
  };

  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Ensure there is always at least one invoice active to prevent crashes
  const invoices = clientData.invoices?.length > 0 ? clientData.invoices : [{
    id: 'temp', name: 'Nova UC', monthlyHistory: Array(12).fill(0), monthlyHistoryPeak: Array(12).fill(0), monthlyHistoryOffPeak: Array(12).fill(0)
  } as unknown as InvoiceData];

  const activeInvoice = invoices.find(inv => inv.id === activeInvoiceId) || invoices[0];

  // Helper function to create safe arrays if they don't exist
  const safeHistory = (arr: number[] | undefined) => arr?.length === 12 ? arr : Array(12).fill(0);

  // Derived state for Group Mode based on rateGroup
  // Simple heuristic: A4 is green tariff (Group A), B1 is Conventional (Group B)
  const isGroupA = activeInvoice.rateGroup === 'A4';

  const handleGroupToggle = () => {
    const newGroup = isGroupA ? 'B1' : 'A4';
    updateInvoice(activeInvoice.id, {
      rateGroup: newGroup,
      // If switching to A, ensure arrays exist
      monthlyHistoryPeak: isGroupA ? undefined : safeHistory(activeInvoice.monthlyHistoryPeak),
      monthlyHistoryOffPeak: isGroupA ? undefined : safeHistory(activeInvoice.monthlyHistoryOffPeak),
    });
  };

  // Compute global average and update store
  const saveInvoicesAndRecalculate = (newInvoices: InvoiceData[]) => {
    const newTotalSum = newInvoices.reduce((acc, inv) => {
      const hist = inv.monthlyHistory?.length === 12 ? inv.monthlyHistory : Array(12).fill(0);
      return acc + hist.reduce((a, b) => a + b, 0);
    }, 0);
    updateClientData({
      invoices: newInvoices,
      averageConsumption: newTotalSum > 0 ? newTotalSum / 12 : 0
    });
  };

  const updateInvoice = (id: string, partial: Partial<InvoiceData>) => {
    const newInvoices = clientData.invoices.map(inv => inv.id === id ? { ...inv, ...partial } : inv);
    saveInvoicesAndRecalculate(newInvoices);
  };

  const handleAddInvoice = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const newInvoice: InvoiceData = {
      id,
      name: `UC ${clientData.invoices.length + 1}`,
      monthlyHistory: Array(12).fill(0),
      monthlyHistoryPeak: Array(12).fill(0),
      monthlyHistoryOffPeak: Array(12).fill(0),
      installationNumber: '',
      concessionaire: clientData.invoices[0]?.concessionaire || '',
      connectionType: 'monofasico',
      breakerCurrent: 0,
      rateGroup: 'B1',
      voltage: '127/220V'
    };
    saveInvoicesAndRecalculate([...clientData.invoices, newInvoice]);
    handleSetActiveId(id);
  };

  const handleRemoveInvoice = (id: string) => {
    if (clientData.invoices.length <= 1) return;
    const newInvoices = clientData.invoices.filter(inv => inv.id !== id);
    saveInvoicesAndRecalculate(newInvoices);
    if (activeInvoiceId === id) handleSetActiveId(newInvoices[0].id);
  };

  // Generic updater for history arrays
  const updateHistoryValue = (
    index: number,
    valStr: string,
    field: 'total' | 'peak' | 'offPeak'
  ) => {
    const value = parseFloat(valStr) || 0;

    // Create copies
    const currentTotal = [...safeHistory(activeInvoice.monthlyHistory)];
    const currentPeak = [...safeHistory(activeInvoice.monthlyHistoryPeak)];
    const currentOffPeak = [...safeHistory(activeInvoice.monthlyHistoryOffPeak)];

    if (field === 'total') {
      currentTotal[index] = value;
      // In Group B, we just update total. logic implies peak/offpeak irrelevant or zeroed?
      // Let's keep them as is or zero them? For now, independent.
    } else if (field === 'peak') {
      currentPeak[index] = value;
      // Auto-calc Total
      currentTotal[index] = value + currentOffPeak[index];
    } else if (field === 'offPeak') {
      currentOffPeak[index] = value;
      // Auto-calc Total
      currentTotal[index] = currentPeak[index] + value;
    }

    updateInvoice(activeInvoice.id, {
      monthlyHistory: currentTotal,
      monthlyHistoryPeak: currentPeak,
      monthlyHistoryOffPeak: currentOffPeak
    });
  };

  // AI Logic (Kept from original, potentially needs updates for new structure but keeping consistent for now)
  const handleAiAnalysis = async (file?: File) => {
    if (!file) return;
    setIsAiAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GOOGLE_AI_API_KEY || '' });
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      const contents = {
        parts: [
          { inlineData: { mimeType: file.type, data: base64 } },
          { text: "Você é um especialista em faturas de energia elétrica. Extraia: histórico de consumo (12 meses, kWh), concessionária, número da instalação, tipo de ligação (monofasico/bifasico/trifasico) e tarifa (R$/kWh). Retorne JSON." }
        ]
      };

      const modelId = 'gemini-1.5-flash';
      const response = await ai.models.generateContent({
        model: modelId,
        contents: contents.parts,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              monthly_history: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              concessionaire: { type: Type.STRING },
              installation_number: { type: Type.STRING },
              connection_type: { type: Type.STRING, enum: ['monofasico', 'bifasico', 'trifasico'] },
              tariff_rate: { type: Type.NUMBER }
            }
          }
        }
      });

      const responseAny = response as any;
      const responseText = typeof responseAny.text === 'function' ? responseAny.text() : responseAny.text || '{}';
      const data = JSON.parse(responseText as string);

      updateClientData({ tariffRate: data.tariff_rate || clientData.tariffRate });
      updateInvoice(activeInvoiceId, {
        concessionaire: (data.concessionaire as string) || activeInvoice.concessionaire,
        installationNumber: (data.installation_number as string) || activeInvoice.installationNumber,
        connectionType: (data.connection_type as "monofasico" | "bifasico" | "trifasico") || activeInvoice.connectionType,
        monthlyHistory: data.monthly_history?.length === 12 ? (data.monthly_history as number[]) : activeInvoice.monthlyHistory
      });

      setShowAiModal(false);
    } catch (e) {
      console.error(e);
      alert('Erro na analise da fatura.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Calculations
  const history = safeHistory(activeInvoice.monthlyHistory);
  const historyPeak = safeHistory(activeInvoice.monthlyHistoryPeak);
  const historyOffPeak = safeHistory(activeInvoice.monthlyHistoryOffPeak);

  const totalConsumption = history.reduce((a, b) => a + b, 0);

  const totalPeak = historyPeak.reduce((a, b) => a + b, 0);
  const totalOffPeak = historyOffPeak.reduce((a, b) => a + b, 0);

  return (
    <div className="h-full flex flex-col space-y-2">

      {/* 1. Header Block: Tabs & Group Toggle & IA */}
      <div className="flex flex-col gap-2 shrink-0">
        {/* UC Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {invoices.map(inv => (
            <button
              key={inv.id}
              onClick={() => handleSetActiveId(inv.id)}
              className={cn(
                "relative group px-3 py-1.5 rounded text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-2",
                activeInvoiceId === inv.id
                  ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              )}
            >
              <Zap size={10} className={activeInvoiceId === inv.id ? "text-yellow-400" : "text-slate-400"} />
              {inv.name}
              {invoices.length > 1 && (
                <span
                  onClick={(e) => { e.stopPropagation(); handleRemoveInvoice(inv.id); }}
                  className="ml-1 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500 hover:text-white rounded-full transition-all"
                >
                  <X size={8} />
                </span>
              )}
            </button>
          ))}
          <button onClick={handleAddInvoice} className="px-2 py-1.5 rounded border border-dashed border-slate-300 text-slate-400 hover:text-neonorte-purple hover:border-neonorte-purple transition-all">
            <Plus size={12} />
          </button>
        </div>

        {/* Toolbar: Technical Header & IA Action */}
        <DenseCard className="p-2 flex justify-between items-center bg-white shadow-sm border-slate-200">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            {/* Toggle Group A/B */}
            <div className="bg-slate-100 p-0.5 rounded-lg flex text-[10px] font-bold shadow-inner shrink-0">
              <button
                onClick={() => isGroupA && handleGroupToggle()}
                className={cn(
                  "px-3 py-1 rounded-md transition-all flex items-center gap-1.5",
                  !isGroupA ? "bg-white text-orange-600 shadow-sm ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <span>Grupo B</span>
                {!isGroupA && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
              </button>
              <button
                onClick={() => !isGroupA && handleGroupToggle()}
                className={cn(
                  "px-3 py-1 rounded-md transition-all flex items-center gap-1.5",
                  isGroupA ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <span>Grupo A</span>
                {isGroupA && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            {/* Voltage & Breaker */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col w-12 shrink-0">
                <label className="text-[7px] font-bold text-slate-400 uppercase leading-none mb-0.5">Tensão</label>
                <input
                  value={activeInvoice.voltage || '127/220V'}
                  onChange={(e) => updateInvoice(activeInvoice.id, { voltage: e.target.value })}
                  className="bg-transparent text-[10px] font-bold text-slate-700 outline-none hover:text-slate-900 p-0 w-full placeholder:text-slate-300"
                  placeholder="220V"
                />
              </div>
              <div className="flex flex-col w-10 shrink-0">
                <label className="text-[7px] font-bold text-slate-400 uppercase leading-none mb-0.5">Disj.</label>
                <div className="flex items-center gap-0.5">
                  <input
                    type="number"
                    value={activeInvoice.breakerCurrent || ''}
                    onChange={(e) => updateInvoice(activeInvoice.id, { breakerCurrent: parseFloat(e.target.value) || 0 })}
                    className="bg-transparent text-[10px] font-bold text-slate-700 outline-none hover:text-slate-900 p-0 w-full placeholder:text-slate-300"
                    placeholder="0"
                  />
                  <span className="text-[9px] text-slate-400 font-bold">A</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Extract Button (Icon Only Variant available too, but user asked for button action) */}
          <DenseButton
            onClick={() => setShowAiModal(true)}
            variant="ghost"
            size="sm"
            className="text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 h-7 text-[10px] px-2 gap-1.5"
            icon={<Sparkles size={10} />}
          >
            Extrair PDF
          </DenseButton>
        </DenseCard>
      </div>

      {/* 2. Main Data Table (High Density / No Scroll) */}
      <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-0 relative">

        {/* Table Header */}
        <div className="flex items-center bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wider h-7 shrink-0 px-2 gap-2">
          <div className="w-8 text-center">Mês</div>

          {isGroupA ? (
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="text-center text-blue-600">Ponta (kWh)</div>
              <div className="text-center text-cyan-600">Fora Ponta (kWh)</div>
            </div>
          ) : (
            <div className="flex-1 text-center text-orange-600">
              Consumo (kWh)
            </div>
          )}
        </div>

        {/* Table Body - Flex Column Distribution (Zero Scroll) */}
        <div className="flex-1 flex flex-col justify-between p-1">
          {MONTH_LABELS.map((month, idx) => (
            <div key={month} className="flex items-center gap-2 hover:bg-slate-50 rounded px-1 transition-colors flex-1 min-h-0">
              {/* Month Label */}
              <div className="w-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                {month}
              </div>

              {/* Inputs */}
              <div className="flex-1 h-full max-h-[28px] py-0.5">
                {isGroupA ? (
                  <div className="h-full grid grid-cols-2 gap-2">
                    <NumericFormat
                      className="w-full h-full text-center text-xs font-mono font-medium text-blue-700 bg-blue-50/30 border border-transparent hover:border-blue-200 focus:border-blue-400 rounded outline-none transition-all placeholder:text-blue-200"
                      placeholder="-"
                      value={historyPeak[idx] || ''}
                      onValueChange={(values) => updateHistoryValue(idx, (values.floatValue || 0).toString(), 'peak')}
                      onFocus={(e) => e.target.select()}
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={0}
                      allowNegative={false}
                    />
                    <NumericFormat
                      className="w-full h-full text-center text-xs font-mono font-medium text-cyan-700 bg-cyan-50/30 border border-transparent hover:border-cyan-200 focus:border-cyan-400 rounded outline-none transition-all placeholder:text-cyan-200"
                      placeholder="-"
                      value={historyOffPeak[idx] || ''}
                      onValueChange={(values) => updateHistoryValue(idx, (values.floatValue || 0).toString(), 'offPeak')}
                      onFocus={(e) => e.target.select()}
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={0}
                      allowNegative={false}
                    />
                  </div>
                ) : (
                  <NumericFormat
                    className="w-full h-full text-center text-xs font-mono font-medium text-slate-700 bg-slate-100/50 border border-transparent hover:border-orange-200 focus:border-orange-400 rounded outline-none transition-all placeholder:text-slate-300"
                    placeholder="-"
                    value={history[idx] || ''}
                    onValueChange={(values) => updateHistoryValue(idx, (values.floatValue || 0).toString(), 'total')}
                    onFocus={(e) => e.target.select()}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={0}
                    allowNegative={false}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Totals */}
        <div className="bg-slate-900 text-white flex items-center justify-between py-1.5 px-3 text-[10px] font-mono shrink-0">
          <div className="font-bold text-slate-400 uppercase tracking-wider mr-2">
            Total (Ano)
          </div>

          {isGroupA ? (
            <div className="flex gap-4">
              <span className="text-blue-300 font-bold">{totalPeak.toLocaleString('pt-BR')} <span className="opacity-50 text-[8px]">P</span></span>
              <span className="text-cyan-300 font-bold">{totalOffPeak.toLocaleString('pt-BR')} <span className="opacity-50 text-[8px]">FP</span></span>
              <span className="text-white font-bold border-l border-white/20 pl-4">{totalConsumption.toLocaleString('pt-BR')} <span className="opacity-50 text-[8px]">kWh</span></span>
            </div>
          ) : (
            <div className="flex gap-4 items-center">
              <div className="text-slate-400">
                Média: <span className="text-white">{(totalConsumption / 12).toFixed(0)}</span>
              </div>
              <div className="text-orange-300 font-bold border-l border-white/20 pl-4">
                {totalConsumption.toLocaleString('pt-BR')} <span className="opacity-50 text-[8px]">kWh</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-xl overflow-hidden shadow-2xl animate-in zoom-in">
            <div className="bg-neonorte-purple p-3 text-white flex justify-between">
              <h3 className="text-sm font-bold flex gap-2 items-center"><Sparkles size={14} /> Leitura Inteligente</h3>
              <button onClick={() => setShowAiModal(false)}><X size={14} /></button>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              {isAiAnalyzing ? (
                <><Loader2 size={32} className="animate-spin text-neonorte-green" /><p className="text-xs">Analisando pixels...</p></>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed rounded-lg p-8 flex flex-col items-center text-slate-400 cursor-pointer hover:bg-slate-50 hover:border-neonorte-green">
                  <UploadCloud size={24} />
                  <p className="text-xs font-bold mt-2">Upload Fatura</p>
                  <input type="file" ref={fileInputRef} hidden accept="image/*,application/pdf" onChange={(e) => handleAiAnalysis(e.target.files?.[0])} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
