import React, { useEffect, useState, useMemo } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';

import { useCatalogStore } from '../../../store/useCatalogStore';
import { useTechKPIs } from '../../../hooks/useTechKPIs';
import { mapCatalogToSpecs } from '../../../utils/catalogMappers';
import { calculateCorrectedVoltage } from '../../../utils/electricalMath';
import { Package, Search, Info, CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { NeonorteLoader } from '@/components/ui/NeonorteLoader';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/simple-dialog';
import { JogScrubber } from '@/components/ui/JogScrubber';

const InstrumentMetric: React.FC<{ label: string; value: string | number; unit: string; color?: 'amber' | 'emerald' | 'rose' | 'sky' }> = ({ label, value, unit, color = "amber" }) => {
  const colors = {
    amber: 'text-amber-500 border-l-amber-500 bg-amber-500/5',
    emerald: 'text-emerald-500 border-l-emerald-500 bg-emerald-500/5',
    rose: 'text-rose-500 border-l-rose-500 bg-rose-500/5',
    sky: 'text-sky-500 border-l-sky-500 bg-sky-500/5',
  };
  
  return (
    <div className="flex flex-col items-end group">
      <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1 group-hover:text-slate-400 transition-colors">{label}</span>
      <div className={cn("px-3 py-1 border-l-2 shadow-inner min-w-[80px] flex items-baseline justify-end gap-1.5", colors[color])}>
        <span className="text-lg font-mono font-black tabular-nums tracking-tighter leading-none">{value}</span>
        <span className="text-[9px] font-bold opacity-60 uppercase">{unit}</span>
      </div>
    </div>
  );
};


/**
 * MODULE CANVAS VIEW (Ato 2)
 * Versão 3.7.1 - Engineering Tool Aesthetic
 * 
 * Responsabilidade: Escolha técnica do módulo solar (Equipment Selection).
 * Layout: 75/25 Grid.
 */
export const ModuleCanvasView: React.FC = () => {
  // Store de Projeto
  const projectModules = useSolarStore(selectModules);
  const kWpAlvo = useSolarStore(s => s.kWpAlvo);
  const setModules = useSolarStore(s => s.setModules);

  
  // Store de Catálogo (DB)
  const { 
    modules: catalogModules, 
    isLoading, 
    error, 
    fetchCatalog 
  } = useCatalogStore();

  const [searchTerm, setSearchTerm] = useState('');
  
  const { kpi, formulas, prValueAdditive } = useTechKPIs();
  
  const activeModule = projectModules[0] || null;

  // Estado para fluxo de substituição
  const [pendingModule, setPendingModule] = useState<any | null>(null);
  const [replaceQty, setReplaceQty] = useState<number>(1);

  // 1. Busca inicial do catálogo
  useEffect(() => {
    if (catalogModules.length === 0) {
      fetchCatalog();
    }
  }, [catalogModules.length, fetchCatalog]);

  // 2. Filtragem de Módulos
  const filteredModules = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return catalogModules.filter(m => 
      m.model.toLowerCase().includes(term) || 
      m.manufacturer.toLowerCase().includes(term) ||
      m.electrical.pmax.toString().includes(term)
    );
  }, [catalogModules, searchTerm]);

  // 3. Handlers
  const applySelection = (item: any, qty: number) => {
    const specs = mapCatalogToSpecs(item);
    
    // Cria array com instâncias individuais conforme padrão do system
    const newModules = Array.from({ length: qty }).map(() => ({
       ...specs,
       id: Math.random().toString(36).substring(2, 9)
    }));

    setModules(newModules);
    setPendingModule(null);
  };

  const handleSelectModule = (item: any) => {
    // Se o módulo clicado já for o ativo, não faz nada
    if (activeModule?.manufacturer === item.manufacturer && activeModule?.model === item.model) {
      return;
    }

    // Calcula quantidade sugerida inicial
    const pmod = item.electrical.pmax;
    const targetWp = (kWpAlvo ?? 0) * 1000;
    const suggested = Math.max(1, Math.ceil(targetWp / pmod));
    setReplaceQty(suggested);

    // Se houver módulos no projeto, pede confirmação
    if (projectModules.length > 0) {
      setPendingModule(item);
    } else {
      applySelection(item, suggested);
    }
  };


  const totalInstaladoKWp = (projectModules.length * (activeModule?.power || 0)) / 1000;
  const dimensionamentoPercent = (kWpAlvo && kWpAlvo > 0) ? (totalInstaladoKWp / kWpAlvo) * 100 : 0;


  return (
    <div className="w-full h-full flex flex-col bg-slate-950 p-4 gap-4 overflow-hidden">
      
      {/* HEADER DE INSTRUMENTAÇÃO */}
      <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/60 px-6 py-4 rounded-sm shrink-0 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-600" />
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Package size={14} className="text-amber-500" />
            <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest">Dimensionamento de Módulos</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Equipamentos selecionados para atingir o alvo de geração</p>
        </div>

        <div className="flex items-center gap-8">
           <InstrumentMetric 
             label="Meta de Projeto" 
             value={(kWpAlvo || 0).toFixed(2)} 
             unit="kWp" 
             color="sky" 
           />

           <InstrumentMetric 
             label="Capacidade Atual" 
             value={totalInstaladoKWp.toFixed(2)} 
             unit="kWp" 
             color={dimensionamentoPercent >= 95 ? "emerald" : "amber"} 
           />
           <InstrumentMetric 
             label="Status Alvo" 
             value={Math.round(dimensionamentoPercent)} 
             unit="%" 
             color={dimensionamentoPercent >= 110 ? "rose" : dimensionamentoPercent >= 95 ? "emerald" : "amber"} 
           />
        </div>
      </div>

      {/* GRID PRINCIPAL 75/25 */}

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-4 flex-1 min-h-0 items-start">
        
        {/* Painel A — Esquerda (75%) : CATÁLOGO */}
        <div className="flex flex-col gap-4 h-full overflow-y-auto pr-2 custom-scrollbar border border-slate-800/40 rounded-none bg-slate-900/10 p-6">
           <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-950/80 backdrop-blur-md z-10 pb-4 border-b border-slate-800/50">
              <div className="flex flex-col" />
             
             <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={14} />
               <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="BUSCAR MARCA OU Wp..."
                 className="bg-slate-950 border border-slate-800 rounded-none px-10 py-2 text-[10px] text-slate-300 font-mono uppercase tracking-widest focus:outline-none focus:border-amber-500/50 w-64 transition-all"
               />
             </div>
           </div>

           {/* LISTA DE MÓDULOS */}
           {isLoading ? (
              <NeonorteLoader size="panel" message="Sincronizando catálogo..." />
           ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-red-500 gap-3">
                <AlertCircle size={32} />
                <span className="text-sm font-medium">{error}</span>
                <button 
                  onClick={() => fetchCatalog()}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs rounded hover:bg-slate-800 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredModules.map(item => {
                  const isSelected = activeModule?.manufacturer === item.manufacturer && activeModule?.model === item.model;
                  
                  // Dimensionamento Preventivo (Heurística)
                  const pmod = item.electrical.pmax;
                  const targetWp = (kWpAlvo ?? 0) * 1000;
                  const minQty = Math.ceil(targetWp / pmod);
                  
                  const prDecimal = Number(prValueAdditive) / 100;
                  const irr = useSolarStore.getState().clientData.monthlyIrradiation;
                  const hspReal = (irr && irr.length > 0)
                    ? (irr.reduce((a: number, b: number) => a + b, 0) / 12)
                    : 4.5;
                  const estGen = (pmod * minQty * hspReal * 30 * prDecimal) / 1000;

                  const calcMemory = `Memória de Cálculo:
(${minQty} un x ${pmod}Wp) / 1000 = ${(minQty * pmod / 1000).toFixed(2)} kWp
${(minQty * pmod / 1000).toFixed(2)} kWp x ${hspReal.toFixed(2)} HSP x 30 dias x ${prValueAdditive}% PR = ${estGen.toFixed(1)} kWh/mês`;

                  return (
                    <div 
                      key={item.id} 
                      onClick={() => handleSelectModule(item)}
                      className={cn(
                        "bg-slate-900/40 border p-0 rounded-none transition-all cursor-pointer group relative overflow-hidden",
                        isSelected 
                          ? "border-amber-500 bg-amber-950/10 ring-1 ring-amber-500/30" 
                          : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                      )}
                    >
                       {/* Header da Plaqueta */}
                       <div className="flex justify-between items-center px-3 py-2 border-b border-slate-800/50 bg-slate-950/40">
                          <div className="flex gap-1">
                            <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-sm font-mono font-black" title="Qtd. p/ Alvo">
                              {minQty} UN
                            </span>
                          </div>
                          <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">ID: {item.id.slice(0, 6)}</span>
                       </div>

                       <div className="p-4">
                          <h3 className="font-black text-slate-100 truncate pr-4 uppercase tracking-wider text-[11px] font-mono">
                            {item.manufacturer} <span className="text-amber-500">{item.electrical.pmax}WP</span>
                          </h3>
                          <p className="text-[9px] text-slate-500 truncate mt-0.5 font-bold uppercase tracking-tighter">{item.model}</p>
                          
                          <div className="mt-4 grid grid-cols-2 gap-2">
                             <div className="flex flex-col border-l border-slate-800 pl-2">
                                <span className="text-[7px] text-slate-600 uppercase font-black tracking-widest leading-none mb-1">Eficiência</span>
                                <span className="text-[10px] text-emerald-500 font-mono font-bold tracking-tighter">
                                   {((item.electrical.efficiency ?? 0) * 100).toFixed(2)}%
                                </span>
                             </div>
                             <div className="flex flex-col border-l border-slate-800 pl-2">
                                <span className="text-[7px] text-slate-600 uppercase font-black tracking-widest leading-none mb-1">Geração Est.</span>
                                <span className="text-[10px] text-amber-500 font-mono font-bold tracking-tighter cursor-help" title={calcMemory}>
                                   {estGen.toFixed(1)} <span className="text-[7px]">kWh</span>
                                </span>
                             </div>
                          </div>
                       </div>

                       {isSelected && (
                          <div className="absolute top-[2px] right-2 flex items-center gap-1.5">
                            <span className="text-[6px] text-amber-500 font-black uppercase tracking-[0.2em]">Ativo</span>
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                          </div>
                       )}
                    </div>
                  );
                })}

                {filteredModules.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-600 italic">
                    Nenhum módulo encontrado para "{searchTerm}".
                  </div>
                )}
             </div>
           )}
        </div>

         {/* Painel B — Direita (25%) : SPECS */}
        <div className="h-full flex flex-col gap-4">
           <div className="flex-1 bg-slate-900/20 border border-slate-800 p-0 rounded-none flex flex-col overflow-y-auto custom-scrollbar">
              <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/40">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] flex items-center gap-2">
                  <Info size={12} className="text-amber-500" />
                  Ficha Técnica de Engenharia
                </span>
              </div>
              
              {activeModule ? (() => {
                const qty = projectModules.length;
                const totalPmax = (qty * activeModule.power) / 1000;
                const totalWeight = qty * (activeModule.weight || 25);
                const totalArea = qty * (activeModule.area || 2.5) * 1.05; // 5% de margem industrial
                const totalVoc = qty * activeModule.voc;

                // CÁLCULOS TÉRMICOS (v3.9.5)
                // Usando Tmin=10°C (Inverno BR) e Tmax=70°C (Célula Operação)
                const vocMaxUnit = calculateCorrectedVoltage(activeModule.voc, activeModule.tempCoeff, 10);
                const vmpMinUnit = calculateCorrectedVoltage(activeModule.vmp, activeModule.tempCoeff, 70);
                const iscTotal = activeModule.isc; // Referência STC do modelo

                return (
                  <div className="space-y-0 flex-1 flex flex-col">
                    {/* EQUIPAMENTO SELECIONADO */}
                    <div className="p-5 bg-slate-950 border-b border-slate-800">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[8px] text-slate-600 uppercase font-black tracking-widest">Hardware Selecionado</span>
                        <span className="text-[9px] bg-amber-600 text-slate-950 px-2 py-0.5 rounded-none font-mono font-black tabular-nums">
                          {qty} UNIDADES
                        </span>
                      </div>
                      <span className="block text-[13px] font-black text-slate-100 truncate leading-tight uppercase tracking-widest font-mono">
                        {activeModule.manufacturer} {activeModule.power}WP
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 truncate mt-1 block uppercase tracking-tight font-sans">{activeModule.model}</span>
                    </div>

                    <div className="p-5 space-y-6">

                    {/* BLOCO MECÂNICO */}
                    <div className="space-y-3">
                       <span className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em] border-b border-slate-800 block pb-1">Dados Mecânicos</span>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col">
                            <span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Peso Total</span>
                            <span className="text-xs font-mono font-bold text-slate-300 tabular-nums">{totalWeight.toFixed(1)} <span className="text-[7px] text-slate-600 uppercase">kg</span></span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Área Est. (Líquida)</span>
                            <span className="text-xs font-mono font-bold text-slate-300 tabular-nums">{totalArea.toFixed(1)} <span className="text-[7px] text-slate-600 uppercase">m²</span></span>
                          </div>
                       </div>
                    </div>

                    {/* BLOCO ELÉTRICO */}
                    <div className="space-y-3">
                       <span className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em] border-b border-slate-800 block pb-1">Resumo Elétrico (STC)</span>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col cursor-help" title={formulas.dcPower}>
                            <span className="text-[8px] text-amber-600 uppercase font-bold mb-1">Potência DC</span>
                            <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">{totalPmax.toFixed(2)} <span className="text-[7px] text-amber-700">kWP</span></span>
                          </div>
                          <div className="flex flex-col cursor-help" title={formulas.estimatedGeneration}>
                            <span className="text-[8px] text-emerald-600 uppercase font-bold mb-1">Geração Est.</span>
                            <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">{Math.round(kpi.estimatedGeneration).toLocaleString('pt-BR')} <span className="text-[7px] text-emerald-700">kWH</span></span>
                          </div>
                          <div className="flex flex-col col-span-2 mt-1">
                            <span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Tensão em Série (Total STC)</span>
                            <span className="text-xs font-mono font-bold text-slate-100 tabular-nums">{totalVoc.toFixed(1)} <span className="text-[7px] text-slate-600">V</span></span>
                          </div>

                          <div className="flex flex-col col-span-2 mt-4">
                             <div className="flex justify-between items-center mb-2 text-[8px] uppercase font-black tracking-[0.1em]">
                                <span className="text-slate-500">Status de Dimensionamento vs Alvo</span>
                                <span className="text-slate-300 font-mono">
                                   {(((totalPmax) / (kWpAlvo || 1)) * 100).toFixed(1)}%
                                </span>
                             </div>
                             <div className="w-full bg-slate-950 border border-slate-800 h-2 px-0.5 flex items-center">
                                <div 
                                  className={cn(
                                    "h-1 transition-all duration-500",
                                    (totalPmax / (kWpAlvo || 1)) >= 0.95 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                                  )}
                                  style={{ width: `${Math.min(((totalPmax) / (kWpAlvo || 1)) * 100, 100)}%` }}
                                />
                             </div>
                          </div>
                       </div>
                    </div>
                    {/* BLOCO TÉRMICO & OPERACIONAL */}
                    <div className="space-y-3">
                       <span className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em] border-b border-slate-800 block pb-1">Dinâmica Operacional</span>
                       <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          <div className="flex flex-col" title="Tensão máxima de circuito aberto corrigida para 10°C (Pior caso frio)">
                            <span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Voc Máx (10°C)</span>
                            <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">{vocMaxUnit.toFixed(1)} <span className="text-[7px] text-slate-600">V</span></span>
                          </div>
                          <div className="flex flex-col" title="Tensão de máxima potência estimada para operação a 70°C (Pior caso quente)">
                            <span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Vmp Mín (70°C)</span>
                            <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">{vmpMinUnit.toFixed(1)} <span className="text-[7px] text-slate-600">V</span></span>
                          </div>
                          <div className="flex flex-col col-span-2 border-t border-slate-800/20 pt-2" title="Corrente de curto-circuito em condições padrão (STC)">
                            <span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Corrente Isc (STC)</span>
                            <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">{iscTotal.toFixed(2)} <span className="text-[7px] text-slate-600">A</span></span>
                          </div>
                       </div>
                    </div>
                 </div>

                  <div className="mt-auto pt-6 border-t border-slate-800/60">
                     <div className="flex items-start gap-2 text-slate-400">
                       <Info size={14} className="shrink-0 mt-0.5" />
                       <div className="flex flex-col gap-1">
                         <p className="text-[11px] leading-relaxed">
                           Dimensionamento sugerido: <strong>{(kWpAlvo ?? 0).toFixed(2)} kWp</strong>.
                         </p>
                          <p className="text-xs text-slate-400 font-medium italic">
                            {activeModule.dimensions}
                          </p>
                       </div>
                     </div>
                    </div>
                  </div>
                );
                })() : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <Package size={32} className="text-slate-800 mb-2" />
                  <p className="text-sm text-slate-400 italic">Selecione um módulo no catálogo para visualizar os detalhes técnicos.</p>
                </div>
              )}
           </div>
        </div>

      </div>


      {/* DIÁLOGO DE CONFIRMAÇÃO DE SUBSTITUIÇÃO */}
      <Dialog open={!!pendingModule} onOpenChange={(open) => !open && setPendingModule(null)}>
        <DialogContent className="bg-slate-950 border border-slate-800 p-8 rounded-none shadow-2xl max-w-md ring-1 ring-white/5 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
          
          <div className="mb-6">
            <DialogHeader>
              <div className="flex items-center gap-3 text-amber-500 mb-2">
                <AlertTriangle size={24} className="animate-pulse" />
                <DialogTitle className="text-slate-100 font-black uppercase tracking-tighter text-2xl leading-none">
                  Substituir Módulos?
                </DialogTitle>
              </div>
              <DialogDescription className="text-slate-400 text-xs leading-relaxed font-medium">
                O projeto já possui módulos instalados. A substituição removerá todos os itens atuais para priorizar o novo modelo tecnológico selecionado.
              </DialogDescription>
            </DialogHeader>
          </div>

          {pendingModule && (
            <div className="space-y-4">
              {/* Card do Novo Modelo */}
              <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-none relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 bg-amber-500/10 text-amber-500/50">
                    <Package size={32} strokeWidth={1} />
                  </div>
                  <span className="block text-[8px] text-slate-500 uppercase font-black mb-1.5 tracking-[0.2em] relative z-10">Especificação do Novo Modelo</span>
                  <h4 className="text-slate-100 font-bold text-lg uppercase tracking-tight relative z-10">
                    {pendingModule.manufacturer} - {pendingModule.electrical.pmax}Wp
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 relative z-10">{pendingModule.model}</p>
              </div>

              {/* Seletor de Quantidade e Impacto DC */}
              <div className="grid grid-cols-2 gap-3">
                 <div className="flex flex-col gap-1.5 flex-1">
                    <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest ml-1">Quantidade Final (Arraste p/ Ajustar)</span>
                    <JogScrubber 
                      value={replaceQty}
                      onChange={setReplaceQty}
                      min={1}
                      max={5000}
                      step={1}
                      sensitivity={0.5}
                      className="h-10"
                    />
                 </div>


                 <div className="flex flex-col gap-1.5 justify-end">
                    <div className="p-2.5 bg-slate-950 border border-slate-800/50 rounded-none flex flex-col items-end">
                       <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Nova Potência DC</span>
                       <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-amber-400 font-mono tabular-nums tracking-tighter">
                            {((replaceQty * pendingModule.electrical.pmax) / 1000).toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold text-amber-600 uppercase">kWp</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-amber-900/10 border border-amber-500/20 p-2.5 rounded-none flex gap-2.5">
                 <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                 <p className="text-[10px] text-amber-200/70 leading-normal font-medium italic">
                   A meta atual de dimensionamento é <strong>{(kWpAlvo || 0).toFixed(2)} kWp</strong>. Ajuste a quantidade conforme necessário.
                 </p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-8 flex gap-3 sm:gap-3">
            <button 
              onClick={() => setPendingModule(null)}
              className="flex-1 px-4 py-3 text-slate-300 hover:text-slate-100 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-none text-xs font-bold transition-all flex items-center justify-center gap-2 group uppercase tracking-widest"
            >
              <X size={14} className="group-hover:rotate-90 transition-transform" /> CANCELAR
            </button>
            <button 
              onClick={() => applySelection(pendingModule, replaceQty)}
              className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-none text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-900/40 active:scale-[0.98] uppercase tracking-widest"
            >
              <CheckCircle size={16} /> CONFIRMAR SUBSTITUIÇÃO
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};
