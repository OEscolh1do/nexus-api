import React, { useState, useMemo } from 'react';
import { InverterSpecs } from '@/core/types';
import { Zap, Activity, CheckCircle, ArrowRight, Plus, Trash2, Database } from 'lucide-react';
import { useCatalogStore } from '@/modules/engineering/store/useCatalogStore';

interface Props {
  initialData: InverterSpecs[];
  systemSize: number;
  onConfirm: (data: InverterSpecs[]) => void;
}

export const InverterForm: React.FC<Props> = ({ initialData, systemSize, onConfirm }) => {
  const catalogInverters = useCatalogStore(state => state.inverters);
  const [inverters, setInverters] = useState<InverterSpecs[]>(initialData);

  // Selection States
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  // Derived Lists
  const uniqueMakes = useMemo(() => {
    const makes = new Set(catalogInverters.map((i: any) => i.manufacturer));
    return Array.from(makes).sort();
  }, [catalogInverters]);

  const availableModels = useMemo(() => {
    if (!selectedMake) return [];
    return catalogInverters.filter((i: any) => i.manufacturer === selectedMake).map((i: any) => i.model).sort();
  }, [selectedMake, catalogInverters]);

  // Calculates total nominal AC power of all inverters
  const totalInverterPower = inverters.reduce((acc, inv) => acc + (inv.nominalPower * inv.quantity), 0);
  const overloadRatio = totalInverterPower > 0 ? (systemSize / totalInverterPower) : 0;
  
  // Status of the sizing
  const isUndersized = overloadRatio > 1.35; // Danger zone
  const isOptimal = overloadRatio >= 0.75 && overloadRatio <= 1.35;

  const handleAddFromDb = () => {
    if (!selectedMake || !selectedModel) return;

    const dbEntry = catalogInverters.find((i: any) => i.manufacturer === selectedMake && i.model === selectedModel);
    if (!dbEntry) return;

    const newInv: InverterSpecs = {
      id: Math.random().toString(36).substr(2, 9),
      quantity: 1,
      manufacturer: dbEntry.manufacturer,
      model: dbEntry.model,
      maxInputVoltage: dbEntry.maxInputVoltage ?? Math.max(...dbEntry.mppts.map(m => m.maxInputVoltage)),
      minInputVoltage: Math.min(...dbEntry.mppts.map(m => m.minMpptVoltage)),
      maxInputCurrent: Math.max(...dbEntry.mppts.map(m => m.maxCurrentPerMPPT)),
      outputVoltage: dbEntry.outputVoltage ?? 220,
      outputFrequency: dbEntry.outputFrequency ?? 60,
      maxOutputCurrent: dbEntry.maxOutputCurrent ?? 0,
      nominalPower: dbEntry.nominalPowerW / 1000,
      maxEfficiency: dbEntry.efficiency?.euro ?? 0,
      weight: dbEntry.weight ?? 0,
      connectionType: dbEntry.connectionType ?? '',
    };
    setInverters([...inverters, newInv]);
  };

  const handleRemoveInverter = (id: string) => {
    if (inverters.length === 1) {
      alert("É necessário ter pelo menos um inversor.");
      return;
    }
    setInverters(inverters.filter(i => i.id !== id));
  };

  const handleChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setInverters(prev => prev.map(inv => {
      if (inv.id === id) {
        if (name === 'quantity') {
             return { ...inv, quantity: parseFloat(value) || 0 };
        }
        return inv;
      }
      return inv;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(inverters);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
      <div className="bg-slate-900 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Configuração Técnica (Fase 3)</h2>
          <p className="text-slate-400 text-xs tracking-wider uppercase">Especificações do(s) Inversor(es)</p>
        </div>
        <div className="text-right">
           <p className="text-[10px] text-slate-400 uppercase">Potência Fotovoltaica</p>
           <p className="text-xl font-bold text-orange-500">{systemSize.toFixed(2)} kWp</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
         
         {/* Sizing Monitor */}
         <div className={`mb-6 p-4 rounded-xl border flex flex-col md:flex-row items-center gap-4 ${isOptimal ? 'bg-green-50 border-green-200' : isUndersized ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className={`p-2 rounded-full ${isOptimal ? 'bg-green-100 text-green-600' : isUndersized ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
               <Activity size={24} />
            </div>
            <div className="flex-1">
               <h4 className="font-bold text-sm text-slate-800 uppercase">Status do Dimensionamento (Overload)</h4>
               <p className="text-xs text-slate-600 mt-1">
                 Potência Inversores: <strong>{totalInverterPower.toFixed(2)} kW</strong> vs. Módulos: <strong>{systemSize.toFixed(2)} kWp</strong>. 
                 Relação: <strong>{(overloadRatio * 100).toFixed(0)}%</strong>
               </p>
               {isUndersized && <p className="text-xs font-bold text-red-600 mt-1">ATENÇÃO: Sistema subdimensionado. Adicione mais potência de inversor.</p>}
            </div>
         </div>

         {/* --- DB SELECTION AREA --- */}
         <div className="bg-slate-100 p-5 rounded-xl border border-slate-200 mb-8">
            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-4">
              <Database size={14} /> Catálogo de Inversores (Banco de Dados)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
               <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fabricante</label>
                  <select 
                    className="w-full p-2 bg-white border border-slate-300 rounded text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={selectedMake}
                    onChange={(e) => { setSelectedMake(e.target.value); setSelectedModel(''); }}
                  >
                    <option value="">Selecione...</option>
                    {uniqueMakes.map(make => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
               </div>
               <div className="md:col-span-5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Modelo</label>
                  <select 
                    className="w-full p-2 bg-white border border-slate-300 rounded text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={!selectedMake}
                  >
                    <option value="">{selectedMake ? 'Selecione o Modelo...' : 'Selecione o Fabricante Primeiro'}</option>
                    {availableModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
               </div>
               <div className="md:col-span-3">
                  <button 
                    type="button"
                    onClick={handleAddFromDb}
                    disabled={!selectedModel}
                    className="w-full py-2 bg-slate-800 text-white rounded font-bold text-sm hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Adicionar
                  </button>
               </div>
            </div>
         </div>

         <div className="space-y-8">
            {inverters.map((inv, index) => (
              <div key={inv.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                 {/* Item Header */}
                 <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <span className="bg-slate-200 text-slate-600 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">{index + 1}</span>
                       <div className="w-10 h-10 rounded border border-slate-200 overflow-hidden bg-white flex-shrink-0 flex items-center justify-center p-0.5">
                         <img 
                            src={inv.imageUrl || '/assets/images/solar-inverter.png'} 
                            alt={inv.model} 
                            className="max-w-full max-h-full object-contain"
                         />
                       </div>
                       <h3 className="text-sm font-bold text-slate-700">{inv.model}</h3>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveInverter(inv.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Remover Inversor"
                    >
                      <Trash2 size={16} />
                    </button>
                 </div>

                 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Basic Info & Quantity */}
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                       <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fabricante</label>
                          <input type="text" name="manufacturer" value={inv.manufacturer} readOnly className="w-full p-2 bg-slate-100 border border-slate-200 rounded font-semibold text-slate-500 cursor-not-allowed" />
                       </div>
                       <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Modelo</label>
                          <input type="text" name="model" value={inv.model} readOnly className="w-full p-2 bg-slate-100 border border-slate-200 rounded font-semibold text-slate-500 cursor-not-allowed" />
                       </div>
                       <div className="bg-orange-50 p-1 rounded border border-orange-100">
                          <label className="block text-[10px] font-bold text-orange-600 uppercase mb-1 text-center">Quantidade</label>
                          <div className="flex items-center gap-2">
                             <button type="button" onClick={() => handleChange(inv.id, { target: { name: 'quantity', value: String(Math.max(1, inv.quantity - 1)) } } as any)} className="w-8 h-8 rounded bg-white text-orange-600 font-bold border border-orange-200">-</button>
                             <input type="number" name="quantity" value={inv.quantity} onChange={(e) => handleChange(inv.id, e)} className="w-full p-1 bg-transparent text-center font-bold text-xl text-orange-600 outline-none" />
                             <button type="button" onClick={() => handleChange(inv.id, { target: { name: 'quantity', value: String(inv.quantity + 1) } } as any)} className="w-8 h-8 rounded bg-white text-orange-600 font-bold border border-orange-200">+</button>
                          </div>
                       </div>
                    </div>

                    {/* DC Inputs */}
                    <div className="space-y-2">
                       <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 border-b border-slate-100 pb-1"><Zap size={10}/> Entrada CC</h4>
                       <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400">V. Máx</label>
                            <input type="number" name="maxInputVoltage" value={inv.maxInputVoltage} readOnly className="w-full p-1.5 text-xs bg-slate-100 border border-slate-200 rounded text-slate-500 cursor-not-allowed" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400">V. Start</label>
                            <input type="number" name="minInputVoltage" value={inv.minInputVoltage} readOnly className="w-full p-1.5 text-xs bg-slate-100 border border-slate-200 rounded text-slate-500 cursor-not-allowed" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400">I. Máx (A)</label>
                            <input type="number" name="maxInputCurrent" value={inv.maxInputCurrent} readOnly className="w-full p-1.5 text-xs bg-slate-100 border border-slate-200 rounded text-slate-500 cursor-not-allowed" />
                          </div>
                       </div>
                    </div>

                    {/* AC Outputs */}
                    <div className="space-y-2">
                       <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 border-b border-slate-100 pb-1"><Activity size={10}/> Saída CA</h4>
                       <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400">Potência (kW)</label>
                            <input type="number" name="nominalPower" value={inv.nominalPower} readOnly className="w-full p-1.5 text-xs bg-slate-100 border border-slate-200 rounded font-bold text-slate-500 cursor-not-allowed" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400">Ligação</label>
                            <input type="text" name="connectionType" value={inv.connectionType} readOnly className="w-full p-1.5 text-xs bg-slate-100 border border-slate-200 rounded text-slate-500 cursor-not-allowed" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400">Tensão (V)</label>
                            <input type="number" name="outputVoltage" value={inv.outputVoltage} readOnly className="w-full p-1.5 text-xs bg-slate-100 border border-slate-200 rounded text-slate-500 cursor-not-allowed" />
                          </div>
                          <div>
                             <label className="block text-[9px] font-bold text-slate-400">Eficiência (%)</label>
                             <input type="number" step="0.1" name="maxEfficiency" value={inv.maxEfficiency} readOnly className="w-full p-1.5 text-xs bg-slate-100 border border-slate-200 rounded text-slate-500 cursor-not-allowed" />
                          </div>
                       </div>
                    </div>

                 </div>
              </div>
            ))}

            {inverters.length === 0 && (
              <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-xl text-slate-400">
                 <p>Nenhum inversor selecionado.</p>
                 <p className="text-xs">Utilize o catálogo acima para adicionar.</p>
              </div>
            )}
         </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-[0.99] flex items-center justify-center gap-3 mt-8"
          >
            <CheckCircle size={20} /> 
            FINALIZAR E GERAR PDF
            <ArrowRight size={20} />
          </button>
      </form>
    </div>
  );
};