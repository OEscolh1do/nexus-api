import React, { useState, useMemo } from 'react';
import { ModuleSpecs } from '../types';
import { Box, ArrowRight, Sun, LayoutGrid, Plus, Trash2, CheckCircle, Database, Search } from 'lucide-react';
import { MODULE_DB } from '../data/modules';

interface Props {
  initialData: ModuleSpecs[];
  onConfirm: (data: ModuleSpecs[]) => void;
}

export const ModuleForm: React.FC<Props> = ({ initialData, onConfirm }) => {
  const [modules, setModules] = useState<ModuleSpecs[]>(initialData);
  
  // Selection States
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  // Derived Lists
  const uniqueMakes = useMemo(() => {
    const makes = new Set(MODULE_DB.map(m => m.Fabricante));
    return Array.from(makes).sort();
  }, []);

  const availableModels = useMemo(() => {
    if (!selectedMake) return [];
    return MODULE_DB.filter(m => m.Fabricante === selectedMake).map(m => m.Modelo).sort();
  }, [selectedMake]);

  // Calculate Aggregates
  const totalPowerKwp = modules.reduce((acc, m) => acc + (m.power * m.quantity), 0) / 1000;
  const totalArea = modules.reduce((acc, m) => acc + (m.area * m.quantity), 0);
  const totalCount = modules.reduce((acc, m) => acc + m.quantity, 0);

  const handleAddFromDb = () => {
    if (!selectedMake || !selectedModel) return;

    const dbEntry = MODULE_DB.find(m => m.Fabricante === selectedMake && m.Modelo === selectedModel);
    if (!dbEntry) return;

    const newMod: ModuleSpecs = {
      id: Math.random().toString(36).substr(2, 9),
      quantity: 1, // Default start
      supplier: dbEntry.Fornecedor,
      manufacturer: dbEntry.Fabricante,
      model: dbEntry.Modelo,
      type: dbEntry.Tipo,
      power: dbEntry["Potência"],
      efficiency: Number((dbEntry["ƞ Módulo"] * 100).toFixed(2)), // Convert 0.21 -> 21.00
      cells: dbEntry["Número de células"],
      imp: dbEntry["Imáx"],
      vmp: dbEntry["Vmáx"],
      isc: dbEntry["Isc/Icc"],
      voc: dbEntry["Voc/Vca"],
      weight: dbEntry.Peso,
      area: dbEntry["Área (m²)"],
      dimensions: dbEntry["Dimensões (mm)"],
      inmetroId: dbEntry.Inmetro,
      maxFuseRating: dbEntry["Máx. Corr. Fusível (série)"],
      tempCoeff: dbEntry["Coef. Temperatura/°C"],
      annualDepreciation: Number((dbEntry["Depreciação a.a."] * 100).toFixed(2)) // Convert 0.008 -> 0.8
    };

    setModules([...modules, newMod]);
    // Reset selection is optional, keeping it allows quick multi-add
  };

  const handleRemoveModule = (id: string) => {
     if (modules.length === 1) {
       alert("É necessário ter pelo menos um tipo de módulo.");
       return;
     }
     setModules(modules.filter(m => m.id !== id));
  };

  const handleChange = (id: string, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // const isText = ['supplier', 'manufacturer', 'model', 'type', 'dimensions', 'inmetroId'].includes(name);
    // Logic kept for quantity, though other fields are now read-only in UI
    
    setModules(prev => prev.map(m => {
      if (m.id === id) {
        if (name === 'quantity') {
            return { ...m, quantity: parseFloat(value) || 0 };
        }
        // Other fields shouldn't technically change in this view anymore, but we'll leave it safe
        return m;
      }
      return m;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(modules);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
      <div className="bg-slate-900 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Configuração Técnica (Fase 2)</h2>
          <p className="text-slate-400 text-xs tracking-wider uppercase">Especificações do Painel Fotovoltaico</p>
        </div>
        <div className="text-right">
           <p className="text-[10px] text-slate-400 uppercase">Potência Estimada</p>
           <p className="text-xl font-bold text-orange-500">{totalPowerKwp.toFixed(2)} kWp</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
        
        {/* --- SUMMARY BOX --- */}
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
             <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                <LayoutGrid size={24} />
             </div>
             <div>
               <h4 className="text-orange-900 font-bold text-sm uppercase tracking-wide">Resumo do Arranjo</h4>
               <p className="text-orange-700 text-xs mt-1">
                 Total de Módulos: <strong>{totalCount}</strong> | Área de Telhado: <strong>{totalArea.toFixed(1)} m²</strong>
               </p>
             </div>
          </div>
        </div>

        {/* --- DB SELECTION AREA --- */}
        <div className="bg-slate-100 p-5 rounded-xl border border-slate-200 mb-8">
           <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-4">
             <Database size={14} /> Catálogo de Módulos (Banco de Dados)
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

        {/* --- MODULE LIST --- */}
        <div className="space-y-8">
           {modules.map((mod, index) => (
             <div key={mod.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                
                {/* Header */}
                <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <span className="bg-slate-200 text-slate-600 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">{index + 1}</span>
                       <h3 className="text-sm font-bold text-slate-700">{mod.model}</h3>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveModule(mod.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Remover Módulo"
                    >
                      <Trash2 size={16} />
                    </button>
                 </div>

                 <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                   
                   {/* Main Identity & Qty */}
                   <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
                       <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fornecedor</label>
                          <input type="text" name="supplier" value={mod.supplier} readOnly className="w-full p-2 bg-slate-100 border border-slate-200 rounded font-semibold text-slate-500 cursor-not-allowed" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fabricante</label>
                          <input type="text" name="manufacturer" value={mod.manufacturer} readOnly className="w-full p-2 bg-slate-100 border border-slate-200 rounded font-semibold text-slate-500 cursor-not-allowed" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Modelo</label>
                          <input type="text" name="model" value={mod.model} readOnly className="w-full p-2 bg-slate-100 border border-slate-200 rounded font-semibold text-slate-500 cursor-not-allowed" />
                       </div>
                       <div className="bg-orange-50 p-1 rounded border border-orange-100">
                          <label className="block text-[10px] font-bold text-orange-600 uppercase mb-1 text-center">Quantidade</label>
                          <div className="flex items-center gap-2">
                             <button type="button" onClick={() => handleChange(mod.id, { target: { name: 'quantity', value: String(Math.max(1, mod.quantity - 1)) } } as any)} className="w-8 h-8 rounded bg-white text-orange-600 font-bold border border-orange-200">-</button>
                             <input type="number" name="quantity" value={mod.quantity} onChange={(e) => handleChange(mod.id, e)} className="w-full p-1 bg-transparent text-center font-bold text-xl text-orange-600 outline-none" />
                             <button type="button" onClick={() => handleChange(mod.id, { target: { name: 'quantity', value: String(mod.quantity + 1) } } as any)} className="w-8 h-8 rounded bg-white text-orange-600 font-bold border border-orange-200">+</button>
                          </div>
                       </div>
                   </div>
                   
                   {/* Electrical & Physical */}
                   <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                       <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Potência (W)</label>
                          <input type="number" name="power" value={mod.power} readOnly className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-slate-500 cursor-not-allowed" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Eficiência (%)</label>
                          <input type="number" step="0.1" name="efficiency" value={mod.efficiency} readOnly className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-slate-500 cursor-not-allowed" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dimensões (mm)</label>
                          <input type="text" name="dimensions" value={mod.dimensions} readOnly className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-slate-500 cursor-not-allowed" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Área (m²)</label>
                          <input type="number" step="0.01" name="area" value={mod.area} readOnly className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-slate-500 cursor-not-allowed" />
                       </div>
                   </div>

                   {/* Detailed Electrical */}
                   <div className="md:col-span-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 border-b border-slate-100 pb-1 mb-2"><Sun size={10}/> Detalhes Elétricos (STC)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                        <div>
                           <label className="block text-[9px] font-bold text-slate-400">Imp (A)</label>
                           <input type="number" step="0.1" name="imp" value={mod.imp} readOnly className="w-full p-1.5 text-xs bg-slate-100 border border-slate-200 rounded text-slate-500 cursor-not-allowed" />
                        </div>
                        <div>
                           <label className="block text-[9px] font-bold text-slate-400">Vmp (V)</label>
                           <input type="number" step="0.1" name="vmp" value={mod.vmp} readOnly className="w-full p-1.5 text-xs bg-slate-100 border border-slate-200 rounded text-slate-500 cursor-not-allowed" />
                        </div>
                        <div>
                           <label className="block text-[9px] font-bold text-slate-400">Isc (A)</label>
                           <input type="number" step="0.1" name="isc" value={mod.isc} readOnly className="w-full p-1.5 text-xs bg-slate-100 border border-slate-200 rounded text-slate-500 cursor-not-allowed" />
                        </div>
                        <div>
                           <label className="block text-[9px] font-bold text-slate-400">Voc (V)</label>
                           <input type="number" step="0.1" name="voc" value={mod.voc} readOnly className="w-full p-1.5 text-xs bg-slate-100 border border-slate-200 rounded text-slate-500 cursor-not-allowed" />
                        </div>
                        <div className="md:col-span-2">
                           <label className="block text-[9px] font-bold text-slate-400">Tipo Célula</label>
                           <input type="text" name="type" value={mod.type} readOnly className="w-full p-1.5 text-xs bg-slate-100 border border-slate-200 rounded text-slate-500 cursor-not-allowed" />
                        </div>
                      </div>
                   </div>

                 </div>
             </div>
           ))}

           {modules.length === 0 && (
              <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-xl text-slate-400">
                 <p>Nenhum módulo selecionado.</p>
                 <p className="text-xs">Utilize o catálogo acima para adicionar.</p>
              </div>
           )}
        </div>
         
         <button
           type="submit"
           className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-[0.99] flex items-center justify-center gap-3 mt-8"
         >
           <Box size={20} /> 
           CONFIRMAR MÓDULOS E IR PARA INVERSOR
           <ArrowRight size={20} />
         </button>
      </form>
    </div>
  );
};