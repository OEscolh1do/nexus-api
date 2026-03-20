/**
 * =============================================================================
 * ENERGY FLUX FORM - DENSE LAYOUT (REFATORADO)
 * =============================================================================
 *
 * MUDANÇAS:
 * ❌ Removido: Header gigante com ícone animado
 * ❌ Removido: Botões Voltar/Avançar internos
 * ❌ Removido: Blocos coloridos por trimestre (ocupavam muito espaço)
 * ✅ Mantido: Lógica de IA para análise de faturas
 * ✅ Mantido: Multi-unidades (tabs de faturas)
 * ✅ Novo: Grid compacto 6x2 para os 12 meses
 *
 * =============================================================================
 */

import React, { useState, useRef } from 'react';
import { InputData, InvoiceData } from '@/core/types';
import { 
  Building2, Plus, Zap, Sparkles, Loader2, 
  UploadCloud, CheckCircle, X
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import {
  DenseFormGrid,
  DenseCard,
  DenseInput,
  DenseSelect,
  DenseStat,
  DenseButton,
  DenseDivider
} from '@/components/ui/dense-form';

// =============================================================================
// TIPOS E CONSTANTES
// =============================================================================

interface Props {
  initialData: InputData;
  onBack: () => void;
  onConfirm: (data: InputData) => void;
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const CONNECTION_OPTIONS = [
  { value: 'monofasico', label: 'Monofásico' },
  { value: 'bifasico', label: 'Bifásico' },
  { value: 'trifasico', label: 'Trifásico' },
];



// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const EnergyFluxForm: React.FC<Props> = ({ initialData, onConfirm }) => {
  const [formData, setFormData] = useState<InputData>(initialData);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string>(initialData.invoices[0].id);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const activeInvoice = formData.invoices.find(inv => inv.id === activeInvoiceId) || formData.invoices[0];

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  
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

  const handleAddInvoice = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setFormData({
      ...formData, 
      invoices: [...formData.invoices, {
        ...formData.invoices[0], 
        id, 
        name: `UC ${formData.invoices.length + 1}`, 
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

  // ===========================================================================
  // AI ANALYSIS
  // ===========================================================================
  
  const handleAiAnalysis = async (file?: File) => {
    if (!file) return;
    setIsAiAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;
      
      const contents = {
        parts: [
          { inlineData: { mimeType: file.type, data: base64 } },
          { text: "Você é um especialista em faturas de energia elétrica do Brasil. Extraia desta imagem o histórico de consumo dos últimos 12 meses (kWh), a concessionária, o número da instalação, o tipo de ligação (monofasico, bifasico ou trifasico) e a tarifa atual (R$/kWh). Retorne estritamente em JSON." }
        ]
      };

      const response = await ai.models.generateContent({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
                description: "Array com 12 números representando Jan a Dez."
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

      const result = JSON.parse(response.text ?? '{}');
      
      setFormData(prev => ({
        ...prev,
        tariffRate: result.tariff_rate || prev.tariffRate,
        invoices: prev.invoices.map(inv => inv.id === activeInvoiceId ? {
          ...inv,
          concessionaire: result.concessionaire || inv.concessionaire,
          installationNumber: result.installation_number || inv.installationNumber,
          connectionType: result.connection_type || inv.connectionType,
          monthlyHistory: result.monthly_history?.length === 12 ? result.monthly_history : inv.monthlyHistory
        } : inv)
      }));

      setShowAiModal(false);

    } catch (error) {
      console.error("AI Analysis Error:", error);
      alert("Erro na leitura. Verifique a imagem ou insira manualmente.");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // ===========================================================================
  // COMPUTED VALUES
  // ===========================================================================
  
  const totalAvgConsumption = formData.invoices.reduce((acc, inv) => {
    const sum = inv.monthlyHistory.reduce((s, val) => s + val, 0);
    return acc + (sum / 12);
  }, 0);

  const activeAvgConsumption = activeInvoice.monthlyHistory.reduce((a, b) => a + b, 0) / 12;
  const activeMaxConsumption = Math.max(...activeInvoice.monthlyHistory);
  const activeMinConsumption = Math.min(...activeInvoice.monthlyHistory.filter(v => v > 0)) || 0;

  // ===========================================================================
  // FORM SUBMIT
  // ===========================================================================
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(formData);
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================
  
  return (
    <form onSubmit={handleSubmit} className="animate-in fade-in duration-300">
      <DenseFormGrid className="gap-4">

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* COLUNA ESQUERDA: Dados da Fatura + Unidades */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="col-span-12 lg:col-span-4 space-y-4">

          {/* Card: Parâmetros Globais */}
          <DenseCard>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap size={12} className="text-orange-500" />
              Parâmetros de Energia
            </h4>
            <DenseFormGrid>
              <DenseInput
                label="Tarifa (R$/kWh)"
                type="number"
                step="0.01"
                value={formData.tariffRate}
                onChange={e => setFormData({...formData, tariffRate: parseFloat(e.target.value) || 0})}
                colSpan={6}
              />
              <DenseStat
                label="Consumo Médio Total"
                value={Math.round(totalAvgConsumption)}
                unit="kWh"
                colSpan={6}
                variant={totalAvgConsumption > 0 ? 'success' : 'default'}
              />
            </DenseFormGrid>
          </DenseCard>

          {/* Card: Unidades Consumidoras */}
          <DenseCard>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Building2 size={12} className="text-neonorte-purple" />
                Unidades Consumidoras
              </h4>
              <DenseButton
                type="button"
                onClick={handleAddInvoice}
                variant="ghost"
                size="sm"
                icon={<Plus size={14} />}
              >
                Nova UC
              </DenseButton>
            </div>

            {/* Tabs de Unidades */}
            <div className="flex flex-wrap gap-1 mb-4">
              {formData.invoices.map(inv => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => setActiveInvoiceId(inv.id)}
                  className={`
                    relative group px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                    ${activeInvoiceId === inv.id 
                      ? 'bg-neonorte-purple text-white' 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }
                  `}
                >
                  {inv.name}
                  {formData.invoices.length > 1 && (
                    <span
                      onClick={(e) => { e.stopPropagation(); handleRemoveInvoice(inv.id); }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X size={10} />
                    </span>
                  )}
                </button>
              ))}
            </div>

            <DenseDivider />

            {/* Dados da Unidade Ativa */}
            <DenseFormGrid className="mt-3">
              <DenseInput
                label="Nome da UC"
                value={activeInvoice.name}
                onChange={e => handleInvoiceFieldChange(activeInvoice.id, 'name', e.target.value)}
                colSpan={6}
              />
              <DenseInput
                label="Nº Instalação"
                value={activeInvoice.installationNumber}
                onChange={e => handleInvoiceFieldChange(activeInvoice.id, 'installationNumber', e.target.value)}
                colSpan={6}
              />
              <DenseInput
                label="Concessionária"
                value={activeInvoice.concessionaire}
                onChange={e => handleInvoiceFieldChange(activeInvoice.id, 'concessionaire', e.target.value)}
                colSpan={12}
              />
              <DenseSelect
                label="Tipo de Ligação"
                value={activeInvoice.connectionType}
                onChange={e => handleInvoiceFieldChange(activeInvoice.id, 'connectionType', e.target.value)}
                options={CONNECTION_OPTIONS}
                colSpan={6}
              />
              <DenseInput
                label="Disjuntor (A)"
                type="number"
                value={activeInvoice.breakerCurrent}
                onChange={e => handleInvoiceFieldChange(activeInvoice.id, 'breakerCurrent', parseFloat(e.target.value) || 0)}
                colSpan={6}
              />
            </DenseFormGrid>
          </DenseCard>

          {/* Card: Estatísticas da UC */}
          <DenseCard className="bg-slate-50">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Estatísticas da UC
            </h4>
            <DenseFormGrid>
              <DenseStat label="Média" value={Math.round(activeAvgConsumption)} unit="kWh" colSpan={4} />
              <DenseStat label="Máximo" value={activeMaxConsumption} unit="kWh" colSpan={4} variant="warning" />
              <DenseStat label="Mínimo" value={activeMinConsumption} unit="kWh" colSpan={4} />
            </DenseFormGrid>
          </DenseCard>

        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* COLUNA DIREITA: Histórico de Consumo (12 meses) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="col-span-12 lg:col-span-8 space-y-4">

          {/* Card: Grid de Consumo Mensal */}
          <DenseCard>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Zap size={12} className="text-orange-500" />
                Consumo Mensal (kWh)
              </h4>
              <DenseButton
                type="button"
                onClick={() => setShowAiModal(true)}
                variant="secondary"
                size="sm"
                icon={<Sparkles size={14} />}
              >
                Analisar Fatura com IA
              </DenseButton>
            </div>

            {/* Grid 6x2 para os 12 meses */}
            <div className="grid grid-cols-6 gap-2">
              {MONTH_LABELS.map((month, i) => (
                <div key={month} className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 text-center uppercase">
                    {month}
                  </label>
                  <input
                    type="number"
                    value={activeInvoice.monthlyHistory[i]}
                    onChange={e => updateActiveHistory(i, e.target.value)}
                    className="w-full h-9 px-2 text-sm font-bold text-center rounded-lg border border-slate-200 focus:border-neonorte-green focus:ring-2 focus:ring-neonorte-green/20 outline-none transition-all"
                  />
                </div>
              ))}
            </div>

            {/* Mini Chart Visual (barras simples) */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-end gap-1 h-16">
                {activeInvoice.monthlyHistory.map((val, i) => {
                  const maxVal = Math.max(...activeInvoice.monthlyHistory, 1);
                  const height = (val / maxVal) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-neonorte-green/60 to-neonorte-green rounded-t transition-all"
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${MONTH_LABELS[i]}: ${val} kWh`}
                    />
                  );
                })}
              </div>
              <div className="flex gap-1 mt-1">
                {MONTH_LABELS.map(m => (
                  <span key={m} className="flex-1 text-[8px] text-slate-400 text-center">{m}</span>
                ))}
              </div>
            </div>
          </DenseCard>

          {/* Botão Confirmar */}
          <div className="flex justify-end">
            <DenseButton
              type="submit"
              variant="primary"
              icon={<CheckCircle size={16} />}
              className="px-6"
            >
              Confirmar Consumo
            </DenseButton>
          </div>
        </div>

      </DenseFormGrid>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Análise IA */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showAiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => !isAiAnalyzing && setShowAiModal(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-neonorte-purple p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Análise Inteligente</h3>
                  <p className="text-[10px] text-white/60">Powered by Gemini Vision</p>
                </div>
              </div>
              {!isAiAnalyzing && (
                <button 
                  onClick={() => setShowAiModal(false)} 
                  className="text-white/60 hover:text-white p-1"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {isAiAnalyzing ? (
                <div className="flex flex-col items-center py-8 space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-neonorte-green/20 rounded-full animate-ping" />
                    <div className="relative bg-neonorte-green p-4 rounded-full text-white">
                      <Loader2 size={32} className="animate-spin" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">Processando fatura...</p>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center gap-4 cursor-pointer hover:bg-slate-50 hover:border-neonorte-green transition-all"
                >
                  <div className="bg-slate-100 p-4 rounded-xl text-slate-400">
                    <UploadCloud size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700">Clique para upload</p>
                    <p className="text-xs text-slate-400">JPG, PNG ou PDF</p>
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
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
