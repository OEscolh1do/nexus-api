import React, { useEffect, useState, useMemo } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';

import { useCatalogStore } from '../../../store/useCatalogStore';
import { useTechKPIs } from '../../../hooks/useTechKPIs';
import { mapCatalogToSpecs } from '../../../utils/catalogMappers';
import { calculateCorrectedVoltage } from '../../../utils/electricalMath';
import { parsePanOnd } from '@/utils/pvsystParser';
import { mapPanToModule } from '@/utils/panToModuleMapper';
import { Package, Search, Info, CheckCircle, AlertCircle, AlertTriangle, X, Upload } from 'lucide-react';
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

export const ModuleCanvasView: React.FC = () => {
  const projectModules = useSolarStore(selectModules);
  const kWpAlvo = useSolarStore(s => s.kWpAlvo);
  const setModules = useSolarStore(s => s.setModules);

  const { 
    modules: catalogModules, 
    isLoading, 
    error, 
    fetchCatalog,
    addCustomModule
  } = useCatalogStore();

  const [searchTerm, setSearchTerm] = useState('');
  const { kpi, formulas, prValueAdditive } = useTechKPIs();
  const activeModule = projectModules[0] || null;

  const [pendingModule, setPendingModule] = useState<any | null>(null);
  const [replaceQty, setReplaceQty] = useState<number>(1);
  const [hoveredItem, setHoveredItem] = useState<any | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const parsed = parsePanOnd(text);
      const mappedModule = mapPanToModule(parsed, file.name);
      
      addCustomModule(mappedModule);
      setSearchTerm(mappedModule.model); // Força a busca a encontrar o recém adicionado
    } catch (err) {
      console.error("Falha ao parsear .PAN", err);
      // Aqui idealmente seria um toast, mas logando para garantir segurança
      alert("Arquivo .PAN inválido ou corrompido.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() 
            ? <span key={i} className="bg-amber-500/30 text-amber-200">{part}</span> 
            : part
        )}
      </span>
    );
  };

  useEffect(() => {
    if (catalogModules.length === 0) {
      fetchCatalog();
    }
  }, [catalogModules.length, fetchCatalog]);

  const filteredModules = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return catalogModules.filter(m => 
      m.model.toLowerCase().includes(term) || 
      m.manufacturer.toLowerCase().includes(term) ||
      m.electrical.pmax.toString().includes(term)
    );
  }, [catalogModules, searchTerm]);

  const applySelection = (item: any, qty: number) => {
    const specs = mapCatalogToSpecs(item);
    const newModules = Array.from({ length: qty }).map(() => ({
       ...specs,
       id: Math.random().toString(36).substring(2, 9)
    }));
    setModules(newModules);
    setPendingModule(null);
  };

  const handleSelectModule = (item: any) => {
    if (activeModule?.manufacturer === item.manufacturer && activeModule?.model === item.model) return;
    const pmod = item.electrical.pmax;
    const targetWp = (kWpAlvo ?? 0) * 1000;
    const suggested = Math.max(1, Math.ceil(targetWp / pmod));
    setReplaceQty(suggested);
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
      
      {/* HEADER */}
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
           <InstrumentMetric label="Meta de Projeto" value={(kWpAlvo || 0).toFixed(2)} unit="kWp" color="sky" />
           <div className="relative">
             <InstrumentMetric label="Capacidade Atual" value={totalInstaladoKWp.toFixed(2)} unit="kWp" color={dimensionamentoPercent >= 95 ? "emerald" : "amber"} />
             {hoveredItem && (
               <div className={cn("absolute -bottom-4 right-0 text-[8px] font-black tabular-nums tracking-widest", ((hoveredItem.electrical.pmax * (kWpAlvo ? Math.ceil((kWpAlvo*1000)/hoveredItem.electrical.pmax) : 1)) / 1000) >= (kWpAlvo || 0) ? "text-emerald-500" : "text-amber-500")}>
                 PREV: {((hoveredItem.electrical.pmax * (kWpAlvo ? Math.ceil((kWpAlvo*1000)/hoveredItem.electrical.pmax) : 1)) / 1000).toFixed(2)}
               </div>
             )}
           </div>
           <div className="relative">
             <InstrumentMetric label="Status Alvo" value={Math.round(dimensionamentoPercent)} unit="%" color={dimensionamentoPercent >= 110 ? "rose" : dimensionamentoPercent >= 95 ? "emerald" : "amber"} />
             {hoveredItem && (
               <div className="absolute -bottom-4 right-0 text-[8px] font-black tabular-nums tracking-widest text-slate-400">
                 PREV: {Math.round((((hoveredItem.electrical.pmax * (kWpAlvo ? Math.ceil((kWpAlvo*1000)/hoveredItem.electrical.pmax) : 1)) / 1000) / (kWpAlvo || 1)) * 100)}%
               </div>
             )}
           </div>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-4 flex-1 min-h-0 items-start">
        
        {/* ESQUERDA: CATÁLOGO */}
        <div className="flex flex-col gap-4 h-full overflow-y-auto pr-2 custom-scrollbar border border-slate-800/40 rounded-none bg-slate-900/10 p-6">
           <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-950/80 backdrop-blur-md z-10 pb-4 border-b border-slate-800/50">
              <div className="flex flex-col gap-1">
                <input 
                  type="file" 
                  accept=".pan" 
                  ref={fileInputRef} 
                  onChange={handlePanUpload} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-amber-500 hover:text-amber-500 text-slate-400 text-[9px] font-black uppercase tracking-widest transition-colors group rounded-sm"
                  title="Importar Arquivo PVSyst (.PAN)"
                >
                  <Upload size={12} className="group-hover:-translate-y-0.5 transition-transform" />
                  IMPORTAR .PAN
                </button>
              </div>
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

           {isLoading ? (
              <NeonorteLoader size="panel" message="Sincronizando catálogo..." />
           ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-red-500 gap-3">
                <AlertCircle size={32} />
                <span className="text-sm font-medium">{error}</span>
                <button onClick={() => fetchCatalog()} className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs rounded hover:bg-slate-800 transition-colors">Tentar novamente</button>
              </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredModules.map(item => {
                  const isSelected = activeModule?.manufacturer === item.manufacturer && activeModule?.model === item.model;
                  const pmod = item.electrical.pmax;
                  const targetWp = (kWpAlvo ?? 0) * 1000;
                  const minQty = Math.ceil(targetWp / pmod);
                  const prDecimal = Number(prValueAdditive) / 100;
                  const irr = useSolarStore.getState().clientData.monthlyIrradiation;
                  const hspReal = (irr && irr.length > 0) ? (irr.reduce((a: number, b: number) => a + b, 0) / 12) : 4.5;
                  const estGen = (pmod * minQty * hspReal * 30 * prDecimal) / 1000;

                  return (
                    <div 
                      key={item.id} 
                      onClick={() => handleSelectModule(item)}
                      onMouseEnter={() => setHoveredItem(item)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={cn("bg-slate-900/40 border p-0 rounded-none transition-all cursor-pointer group relative overflow-hidden", isSelected ? "border-amber-500 bg-amber-950/10 ring-1 ring-amber-500/30" : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/60")}
                    >
                       <div className="flex justify-between items-center px-3 py-2 border-b border-slate-800/50 bg-slate-950/40">
                          <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-sm font-mono font-black">{minQty} UN</span>
                          <div className="flex items-center gap-2">
                            {item.id.startsWith('PAN_') && (
                              <span className="text-[7px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1 py-0.5 rounded-sm font-black uppercase tracking-widest">
                                CUSTOM
                              </span>
                            )}
                            <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">ID: {item.id.slice(0, 6)}</span>
                          </div>
                       </div>
                       <div className="p-4">
                          <h3 className="font-black text-slate-100 truncate pr-4 uppercase tracking-wider text-[11px] font-mono">
                            {highlightText(item.manufacturer, searchTerm)} <span className="text-amber-500">{item.electrical.pmax}WP</span>
                          </h3>
                          <p className="text-[9px] text-slate-500 truncate mt-0.5 font-bold uppercase tracking-tighter">{highlightText(item.model, searchTerm)}</p>
                          <div className="mt-4 grid grid-cols-2 gap-2">
                             <div className="flex flex-col border-l border-slate-800 pl-2">
                                <span className="text-[7px] text-slate-600 uppercase font-black tracking-widest leading-none mb-1">Eficiência</span>
                                <span className="text-[10px] text-emerald-500 font-mono font-bold tracking-tighter">{((item.electrical.efficiency ?? 0) * 100).toFixed(2)}%</span>
                             </div>
                             <div className="flex flex-col border-l border-slate-800 pl-2">
                                <span className="text-[7px] text-slate-600 uppercase font-black tracking-widest leading-none mb-1">Geração Est.</span>
                                <span className="text-[10px] text-amber-500 font-mono font-bold tracking-tighter">{estGen.toFixed(1)} <span className="text-[7px]">kWh</span></span>
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
             </div>
           )}
        </div>

        {/* DIREITA: SPECS */}
        <div className="h-full flex flex-col gap-4">
           <div className="flex-1 bg-slate-900/20 border border-slate-800 p-0 rounded-none flex flex-col overflow-y-auto custom-scrollbar">
              <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/40">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] flex items-center gap-2">
                  <Info size={12} className="text-amber-500" /> Ficha Técnica de Engenharia
                </span>
              </div>
              
              {activeModule ? (
                (() => {
                  const qty = projectModules.length;
                  const totalPmax = (qty * activeModule.power) / 1000;
                  const totalWeight = qty * (activeModule.weight || 25);
                  const totalArea = qty * (activeModule.area || 2.5) * 1.05; 
                  const vocMaxUnit = calculateCorrectedVoltage(activeModule.voc, activeModule.tempCoeff, 10);
                  const vmpMinUnit = calculateCorrectedVoltage(activeModule.vmp, activeModule.tempCoeff, 70);

                  return (
                    <div className="space-y-0 flex-1 flex flex-col">
                      <div className="p-5 bg-slate-950 border-b border-slate-800">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[8px] text-slate-600 uppercase font-black tracking-widest">Hardware Selecionado</span>
                          <span className="text-[9px] bg-amber-600 text-slate-950 px-2 py-0.5 rounded-none font-mono font-black tabular-nums">{qty} UNIDADES</span>
                        </div>
                        <span className="block text-[13px] font-black text-slate-100 truncate leading-tight uppercase tracking-widest font-mono">{activeModule.manufacturer} {activeModule.power}WP</span>
                        <span className="text-[9px] font-bold text-slate-500 truncate mt-1 block uppercase tracking-tight font-sans">{activeModule.model}</span>
                      </div>

                      <div className="p-5 space-y-8">
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
                              <div className="w-1 h-1 bg-amber-500" />
                              <span className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em]">Parâmetros Elétricos</span>
                           </div>
                           <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                              <div className="flex flex-col group/formula" title={formulas.dcPower}>
                                <span className="text-[8px] text-slate-500 uppercase font-bold mb-1 flex items-center justify-between">Potência DC <span className="text-[7px] opacity-0 group-hover/formula:opacity-100 text-amber-500 transition-opacity">Formula: un * Wp</span></span>
                                <span className="text-xs font-mono font-black text-amber-400 tabular-nums tracking-tight">{totalPmax.toFixed(2)} <span className="text-[7px] text-amber-700/60 font-bold">kWp</span></span>
                              </div>
                              <div className="flex flex-col group/formula" title={formulas.estimatedGeneration}>
                                <span className="text-[8px] text-slate-500 uppercase font-bold mb-1 flex items-center justify-between">Geração Est. <span className="text-[7px] opacity-0 group-hover/formula:opacity-100 text-emerald-500 transition-opacity">Formula: Pmax * HSP * PR</span></span>
                                <span className="text-xs font-mono font-black text-emerald-400 tabular-nums tracking-tight">{Math.round(kpi.estimatedGeneration).toLocaleString('pt-BR')} <span className="text-[7px] text-emerald-700/60 font-bold">kWh</span></span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Tensão Voc</span>
                                <span className="text-xs font-mono font-bold text-slate-200 tabular-nums tracking-tight">{activeModule.voc.toFixed(2)} <span className="text-[7px] text-slate-600 font-black">V</span></span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Corrente Isc</span>
                                <span className="text-xs font-mono font-bold text-slate-200 tabular-nums tracking-tight">{activeModule.isc.toFixed(2)} <span className="text-[7px] text-slate-600 font-black">A</span></span>
                              </div>
                           </div>
                           <div className="mt-2">
                              <div className="flex justify-between items-center mb-1.5 text-[8px] uppercase font-black tracking-[0.1em]"><span className="text-slate-500">Aderência à Meta</span><span className={cn("font-mono", (totalPmax / (kWpAlvo || 1)) >= 0.95 ? "text-emerald-500" : "text-amber-500")}>{(((totalPmax) / (kWpAlvo || 1)) * 100).toFixed(1)}%</span></div>
                              <div className="w-full bg-slate-950 border border-slate-800/50 h-1.5 px-0.5 flex items-center"><div className={cn("h-0.5 transition-all duration-700", (totalPmax / (kWpAlvo || 1)) >= 0.95 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.3)]")} style={{ width: `${Math.min(((totalPmax) / (kWpAlvo || 1)) * 100, 100)}%` }} /></div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
                              <div className="w-1 h-1 bg-sky-500" />
                              <span className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em]">Mecânica e Layout</span>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col"><span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Peso do Arranjo</span><span className="text-xs font-mono font-bold text-slate-300 tabular-nums">{totalWeight.toFixed(1)} <span className="text-[7px] text-slate-600 font-black">kg</span></span></div>
                              <div className="flex flex-col"><span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Área Ocupada</span><span className="text-xs font-mono font-bold text-slate-300 tabular-nums">{totalArea.toFixed(1)} <span className="text-[7px] text-slate-600 font-black">m²</span></span></div>
                              <div className="flex flex-col col-span-2"><span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Geometria Unitária</span><span className="text-[10px] font-mono font-bold text-sky-400/80 tracking-tight">{activeModule.dimensions || 'N/A'}</span></div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
                              <div className="w-1 h-1 bg-rose-500" />
                              <span className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em]">Fronteiras Térmicas</span>
                           </div>
                           <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                              <div className="flex flex-col" title="Tensão corrigida para 10°C"><span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Voc Máx (10°C)</span><span className="text-xs font-mono font-bold text-rose-300/90 tabular-nums">{vocMaxUnit.toFixed(1)} <span className="text-[7px] text-slate-600 font-black">V</span></span></div>
                              <div className="flex flex-col" title="Tensão corrigida para 70°C"><span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Vmp Mín (70°C)</span><span className="text-xs font-mono font-bold text-rose-300/90 tabular-nums">{vmpMinUnit.toFixed(1)} <span className="text-[7px] text-slate-600 font-black">V</span></span></div>
                              <div className="flex flex-col col-span-2 border-t border-slate-800/30 pt-2"><span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Coef. Temperatura (Voc)</span><span className="text-xs font-mono font-bold text-slate-400 tabular-nums">{activeModule.tempCoeff || '-0.30'} <span className="text-[7px] text-slate-600 font-black">%/°C</span></span></div>
                           </div>
                        </div>
                      </div>

                      <div className="mt-auto p-5 border-t border-slate-800/60 bg-slate-950/40">
                         <div className="flex items-start gap-3 text-slate-400">
                           <Info size={14} className="shrink-0 mt-0.5 text-amber-500/50" />
                           <div className="flex flex-col gap-1">
                             <p className="text-[10px] leading-relaxed font-medium uppercase tracking-tight">Meta Sugerida: <strong className="text-slate-200">{(kWpAlvo ?? 0).toFixed(2)} kWp</strong></p>
                             <p className="text-[9px] text-slate-600 italic font-medium">Dados baseados nas condições padrão de teste (STC).</p>
                           </div>
                         </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <Package size={32} className="text-slate-800 mb-2" />
                  <p className="text-sm text-slate-400 italic">Selecione um módulo no catálogo para visualizar os detalhes técnicos.</p>
                </div>
              )}
           </div>
        </div>
      </div>

      <Dialog open={!!pendingModule} onOpenChange={(open) => !open && setPendingModule(null)}>
        <DialogContent className="bg-slate-950 border border-slate-800 p-8 rounded-none shadow-2xl max-w-md ring-1 ring-white/5 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
          <DialogHeader>
            <div className="flex items-center gap-3 text-amber-500 mb-2"><AlertTriangle size={24} className="animate-pulse" /><DialogTitle className="text-slate-100 font-black uppercase tracking-tighter text-2xl leading-none">Substituir Módulos?</DialogTitle></div>
            <DialogDescription className="text-slate-400 text-xs leading-relaxed font-medium">O projeto já possui módulos instalados. A substituição removerá todos os itens atuais para priorizar o novo modelo tecnológico selecionado.</DialogDescription>
          </DialogHeader>

          {pendingModule && (
            <div className="space-y-4 mt-6">
              <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-none relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 bg-amber-500/10 text-amber-500/50"><Package size={32} strokeWidth={1} /></div>
                  <span className="block text-[8px] text-slate-500 uppercase font-black mb-1.5 tracking-[0.2em] relative z-10">Especificação do Novo Modelo</span>
                  <h4 className="text-slate-100 font-bold text-lg uppercase tracking-tight relative z-10">{pendingModule.manufacturer} - {pendingModule.electrical.pmax}Wp</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 relative z-10">{pendingModule.model}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4">
                 <div className="flex flex-col gap-2">
                    <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest ml-1">Quantidade de Módulos</span>
                    <div className="flex items-center gap-2">
                       <button onClick={() => setReplaceQty(q => Math.max(1, q - 1))} className="h-10 w-10 flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-500/50 transition-all shrink-0">-1</button>
                       <div className="flex-1 min-w-0"><JogScrubber value={replaceQty} onChange={setReplaceQty} min={1} max={5000} step={1} sensitivity={0.4} className="h-10" /></div>
                       <button onClick={() => setReplaceQty(q => q + 1)} className="h-10 w-10 flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-500/50 transition-all shrink-0">+1</button>
                    </div>
                 </div>
                 <div className="flex flex-col gap-2 justify-end">
                    <div className="p-2.5 bg-slate-900/40 border border-slate-800/60 rounded-none flex flex-col items-end h-10 justify-center px-4 relative overflow-hidden group">
                       <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/20 group-hover:bg-amber-500/40 transition-colors" />
                       <div className="flex items-baseline gap-2">
                          <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">NOVO TOTAL:</span>
                          <span className="text-lg font-black text-amber-400 font-mono tabular-nums tracking-tighter">{((replaceQty * pendingModule.electrical.pmax) / 1000).toFixed(2)}</span>
                          <span className="text-[8px] font-bold text-amber-600/60 uppercase">kWp</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-amber-500/5 border-l-2 border-amber-500/40 p-3 flex gap-3">
                 <AlertCircle size={14} className="text-amber-500/60 shrink-0 mt-0.5" />
                 <p className="text-[9px] text-slate-400 leading-normal font-medium">Meta atual: <strong className="text-slate-200">{(kWpAlvo || 0).toFixed(2)} kWp</strong>. Ajuste a quantidade para alinhar com a expectativa de geração.</p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-8 flex gap-3 sm:gap-3">
            <button onClick={() => setPendingModule(null)} className="flex-1 px-4 py-3 text-slate-300 hover:text-slate-100 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-none text-xs font-bold transition-all flex items-center justify-center gap-2 group uppercase tracking-widest"><X size={14} className="group-hover:rotate-90 transition-transform" /> CANCELAR</button>
            <button onClick={() => applySelection(pendingModule, replaceQty)} className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-none text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-900/40 active:scale-[0.98] uppercase tracking-widest"><CheckCircle size={16} /> CONFIRMAR SUBSTITUIÇÃO</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
