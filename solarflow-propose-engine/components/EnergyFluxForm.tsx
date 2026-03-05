
import React, { useState, useRef } from 'react';
import { InputData, InvoiceData } from '../types';
import { Building2, Plus, Trash2, Activity, ChevronRight, ChevronLeft, Zap, Sparkles, DollarSign, Loader2, FileText, Camera, UploadCloud, CheckCircle } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
  initialData: InputData;
  onBack: () => void;
  onConfirm: (data: InputData) => void;
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const EnergyFluxForm: React.FC<Props> = ({ initialData, onBack, onConfirm }) => {
  const [formData, setFormData] = useState<InputData>(initialData);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string>(initialData.invoices[0].id);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const activeInvoice = formData.invoices.find(inv => inv.id === activeInvoiceId) || formData.invoices[0];

  const handleInvoiceFieldChange = (id: string, field: keyof InvoiceData, value: any) => {
    setFormData(prev => ({
      ...prev,
      invoices: prev.invoices.map(inv => inv.id === id ? { ...inv, [field]: value } : inv)
    }));
  };

  const updateActiveHistory = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      invoices: prev.invoices.map(inv => {
        if (inv.id === activeInvoiceId) {
          const newArray = [...inv.monthlyHistory];
          newArray[index] = parseFloat(value) || 0;
          return { ...inv, monthlyHistory: newArray };
        }
        return inv;
      })
    }));
  };

  const handleAiAnalysis = async (file?: File) => {
    setIsAiAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let contents: any;

      if (file) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
        });
        reader.readAsDataURL(file);
        const base64 = await base64Promise;
        
        contents = {
          parts: [
            { inlineData: { mimeType: file.type, data: base64 } },
            { text: "Você é um especialista em faturas de energia elétrica do Brasil. Extraia desta imagem o histórico de consumo dos últimos 12 meses (kWh), a concessionária, o número da instalação, o tipo de ligação (monofasico, bifasico ou trifasico) e a tarifa atual (R$/kWh). Retorne estritamente em JSON." }
          ]
        };
      } else {
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              monthly_history: { 
                type: Type.ARRAY, 
                items: { type: Type.NUMBER },
                description: "Array com 12 números representando Jan a Dez. Se faltar algum mês, estime baseado na média."
              },
              concessionaire: { type: Type.STRING },
              installation_number: { type: Type.STRING },
              connection_type: { type: Type.STRING, enum: ['monofasico', 'bifasico', 'trifasico'] },
              tariff_rate: { type: Type.NUMBER }
            },
            required: ["monthly_history", "concessionaire", "connection_type", "tariff_rate"]
          }
        }
      });

      const result = JSON.parse(response.text);
      
      setFormData(prev => ({
        ...prev,
        tariffRate: result.tariff_rate || prev.tariffRate,
        invoices: prev.invoices.map(inv => inv.id === activeInvoiceId ? {
          ...inv,
          concessionaire: result.concessionaire || inv.concessionaire,
          installationNumber: result.installation_number || inv.installationNumber,
          connectionType: result.connection_type || inv.connectionType,
          monthlyHistory: result.monthly_history && result.monthly_history.length === 12 ? result.monthly_history : inv.monthlyHistory
        } : inv)
      }));

      setShowAiModal(false);
      alert("Fatura analisada com sucesso! Os dados foram preenchidos.");
    } catch (error) {
      console.error("AI Analysis Error:", error);
      alert("Não foi possível ler esta fatura. Verifique a qualidade da imagem ou insira os dados manualmente.");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleAddInvoice = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setFormData({
      ...formData, 
      invoices: [...formData.invoices, {
        ...formData.invoices[0], 
        id, 
        name: `Unidade ${formData.invoices.length + 1}`, 
        monthlyHistory: Array(12).fill(0),
        installationNumber: ''
      }]
    });
    setActiveInvoiceId(id);
  };

  const handleRemoveInvoice = (id: string) => {
    if (formData.invoices.length === 1) return;
    const newList = formData.invoices.filter(inv => inv.id !== id);
    setFormData({ ...formData, invoices: newList });
    setActiveInvoiceId(newList[0].id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(formData);
  };

  const totalAvgConsumption = formData.invoices.reduce((acc, inv) => {
    const sum = inv.monthlyHistory.reduce((s, val) => s + val, 0);
    return acc + (sum / 12);
  }, 0);

  return (
    <div className="w-full bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-neonorte-deepPurple p-12 flex justify-between items-center relative overflow-hidden neonorte-overlay">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none"><Building2 size={240} className="text-neonorte-green animate-pulse" /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="bg-neonorte-green p-2 rounded-xl text-white"><Sparkles size={20} /></div>
             <span className="text-neonorte-green font-black uppercase text-[10px] tracking-[0.4em]">Fase 02: Fluxo Energético</span>
          </div>
          <h2 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase leading-none italic font-display">Demanda e <br/> <span className="text-neonorte-green">Histórico de Consumo</span></h2>
        </div>
        <div className="relative z-10">
           <button 
             type="button"
             onClick={() => setShowAiModal(true)}
             className="group bg-neonorte-purple hover:bg-neonorte-lightPurple text-white px-8 py-4 rounded-[2rem] flex items-center gap-4 shadow-2xl transition-all active:scale-95"
           >
              <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                <Sparkles size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Preenchimento IA</p>
                <p className="text-sm font-black uppercase tracking-tight">Analisar Fatura</p>
              </div>
           </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-12 space-y-16">
        
        <section className="bg-neonorte-deepPurple rounded-[3rem] p-10 text-white grid grid-cols-1 md:grid-cols-2 gap-10 border border-white/5">
           <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Tarifa Local (R$/kWh)</label>
              <div className="relative">
                 <span className="absolute left-6 top-1/2 -translate-y-1/2 text-neonorte-green font-black">R$</span>
                 <input type="number" step="0.01" value={formData.tariffRate} onChange={e => setFormData({...formData, tariffRate: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 pl-14 pr-8 py-4 rounded-2xl font-black text-neonorte-green outline-none focus:ring-4 focus:ring-neonorte-green/20 font-mono" />
              </div>
           </div>
           <div className="flex items-center justify-center bg-white/5 rounded-[2rem] border border-white/5 p-6">
              <div className="text-center">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Consumo Médio Agregado</p>
                 <p className="text-3xl font-black text-white font-mono">{Math.round(totalAvgConsumption)} <span className="text-xs font-bold text-slate-400">kWh/mês</span></p>
              </div>
           </div>
        </section>

        <section className="space-y-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-neonorte-purple rounded-2xl flex items-center justify-center text-white shadow-xl"><Building2 size={28} /></div>
                  <h3 className="text-2xl font-black text-neonorte-darkPurple uppercase tracking-tighter font-display">Gerenciar Unidades</h3>
                </div>
                <button type="button" onClick={handleAddInvoice} className="bg-slate-100 text-neonorte-purple px-8 py-4 rounded-2xl text-[10px] font-black hover:bg-neonorte-purple hover:text-white transition-all flex items-center gap-3 uppercase tracking-widest active:scale-95 shadow-sm border border-slate-200">
                  <Plus size={18} className="text-neonorte-green" /> Adicionar Unidade Beneficiária
                </button>
            </div>

            <div className="bg-slate-50 rounded-[3.5rem] p-6 border border-slate-100 shadow-inner">
                <div className="flex gap-4 mb-8 overflow-x-auto p-2 scrollbar-hide">
                   {formData.invoices.map(inv => (
                    <div key={inv.id} className="relative group">
                        <button type="button" onClick={() => setActiveInvoiceId(inv.id)} className={`px-8 py-4 rounded-2xl text-[10px] font-black transition-all whitespace-nowrap flex items-center gap-4 uppercase tracking-widest shadow-lg ${activeInvoiceId === inv.id ? 'bg-white text-neonorte-purple scale-105' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}>
                            {inv.name}
                        </button>
                        {formData.invoices.length > 1 && (
                            <button type="button" onClick={() => handleRemoveInvoice(inv.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                  ))}
                </div>

                <div className="bg-white p-10 rounded-[3rem] shadow-sm space-y-12">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase ml-2">Distribuidora Local</label>
                        <input type="text" value={activeInvoice.concessionaire} onChange={e => handleInvoiceFieldChange(activeInvoice.id, 'concessionaire', e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-neonorte-purple" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase ml-2">Padrão de Entrada</label>
                        <select value={activeInvoice.connectionType} onChange={e => handleInvoiceFieldChange(activeInvoice.id, 'connectionType', e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none">
                           <option value="monofasico">Monofásico</option><option value="bifasico">Bifásico</option><option value="trifasico">Trifásico</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase ml-2">Disjuntor (A)</label>
                        <input type="number" value={activeInvoice.breakerCurrent} onChange={e => handleInvoiceFieldChange(activeInvoice.id, 'breakerCurrent', parseFloat(e.target.value))} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none font-mono" />
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <Activity size={20} className="text-neonorte-green" />
                        <h4 className="text-[11px] font-black text-neonorte-darkPurple uppercase tracking-widest">Consumo Mensal Individual (kWh)</h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 font-mono">
                         {MONTH_LABELS.map((m, i) => (
                          <div key={m} className="flex flex-col gap-2 group">
                             <span className="text-[9px] font-black text-slate-400 text-center uppercase tracking-widest group-hover:text-neonorte-purple transition-colors">{m}</span>
                             <input type="number" value={activeInvoice.monthlyHistory[i]} onChange={e => updateActiveHistory(i, e.target.value)} className="w-full bg-slate-50 border border-slate-200 py-4 rounded-xl text-center font-black text-sm focus:border-neonorte-purple focus:bg-white transition-all outline-none" />
                          </div>
                         ))}
                      </div>
                   </div>
                </div>
            </div>
        </section>

        <div className="flex items-center justify-between pt-12 border-t border-slate-100">
          <button type="button" onClick={onBack} className="group flex items-center gap-4 text-slate-400 hover:text-neonorte-purple transition-all px-10 py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Voltar
          </button>
          
          <button type="submit" className="group relative overflow-hidden bg-neonorte-purple hover:bg-neonorte-lightPurple text-white font-black py-6 px-16 rounded-[2rem] shadow-xl shadow-neonorte-purple/20 transition-all active:scale-95 flex items-center gap-6">
            <span className="tracking-[0.2em] uppercase text-lg">Próxima Etapa</span>
            <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </form>

      {/* AI ANALYSIS MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-neonorte-deepPurple/80 backdrop-blur-md" onClick={() => !isAiAnalyzing && setShowAiModal(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="bg-neonorte-purple p-10 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="bg-neonorte-green p-3 rounded-2xl text-white">
                      <Sparkles size={24} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight font-display">Leitura Inteligente</h3>
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Powered by Gemini Vision 3.0</p>
                   </div>
                </div>
                {!isAiAnalyzing && (
                  <button onClick={() => setShowAiModal(false)} className="text-white/50 hover:text-white transition-colors">
                    <Trash2 size={24} />
                  </button>
                )}
             </div>

             <div className="p-10 space-y-8">
                {isAiAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-neonorte-green/20 rounded-full animate-ping"></div>
                      <div className="relative bg-neonorte-green p-6 rounded-full text-white">
                        <Loader2 size={48} className="animate-spin" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-neonorte-darkPurple uppercase font-display">Processando Fatura</h4>
                      <p className="text-slate-500 text-sm font-medium">Nossa IA está extraindo as informações de consumo e padrões técnicos...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                     <div 
                       onClick={() => fileInputRef.current?.click()}
                       className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-16 flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-slate-50 hover:border-neonorte-green transition-all group"
                     >
                        <div className="bg-slate-100 p-6 rounded-[2rem] text-slate-400 group-hover:bg-neonorte-green group-hover:text-white transition-all">
                           <UploadCloud size={48} />
                        </div>
                        <div className="text-center">
                           <p className="text-lg font-black text-neonorte-darkPurple font-display">Clique para Upload</p>
                           <p className="text-sm font-bold text-slate-400">Arraste a foto da fatura aqui (JPG, PNG ou PDF)</p>
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*,application/pdf" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAiAnalysis(file);
                          }}
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-6 rounded-[2rem] flex items-center gap-4">
                           <div className="bg-white p-3 rounded-2xl text-neonorte-green shadow-sm"><FileText size={20}/></div>
                           <p className="text-[10px] font-black text-slate-500 uppercase leading-tight">Suporte a múltiplos formatos</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[2rem] flex items-center gap-4">
                           <div className="bg-white p-3 rounded-2xl text-neonorte-green shadow-sm"><CheckCircle size={20}/></div>
                           <p className="text-[10px] font-black text-slate-500 uppercase leading-tight">Precisão técnica auditada</p>
                        </div>
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
