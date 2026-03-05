
import React, { useState, useMemo, useEffect } from 'react';
import { ModuleSpecs, InverterSpecs, EngineeringSettings } from '../types';
// Added Activity to the imports to fix the "Cannot find name 'Activity'" error
import { Box, Sun, LayoutGrid, Plus, Trash2, CheckCircle, Zap, DollarSign, CreditCard, TrendingUp, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { MODULE_DB } from '../data/modules';
import { INVERTER_DB } from '../data/inverters';

interface Props {
  initialModules: ModuleSpecs[];
  initialInverters: InverterSpecs[];
  settings: EngineeringSettings;
  onBack: () => void;
  onConfirm: (modules: ModuleSpecs[], inverters: InverterSpecs[], manualKitPrice: number) => void;
}

export const TechnicalForm: React.FC<Props> = ({ initialModules, initialInverters, settings, onBack, onConfirm }) => {
  const [modules, setModules] = useState<ModuleSpecs[]>(initialModules);
  const [inverters, setInverters] = useState<InverterSpecs[]>(initialInverters);
  
  const totalPowerKwp = useMemo(() => modules.reduce((acc, m) => acc + (m.power * m.quantity), 0) / 1000, [modules]);
  
  const [manualKitPrice, setManualKitPrice] = useState<number>(totalPowerKwp * settings.referenceKitPricePerKwp);
  const [hasManualEdit, setHasManualEdit] = useState(false);

  useEffect(() => {
    if (!hasManualEdit) {
      setManualKitPrice(totalPowerKwp * settings.referenceKitPricePerKwp);
    }
  }, [totalPowerKwp, settings.referenceKitPricePerKwp, hasManualEdit]);

  const [modMake, setModMake] = useState('');
  const [modModel, setModModel] = useState('');
  const [invMake, setInvMake] = useState('');
  const [invModel] = useState('');

  const totalInvPower = useMemo(() => inverters.reduce((acc, i) => acc + (i.nominalPower * i.quantity), 0), [inverters]);
  const overloadRatio = totalInvPower > 0 ? (totalPowerKwp / totalInvPower) : 0;
  
  const isOptimal = overloadRatio >= 0.75 && overloadRatio <= 1.45;

  const moduleMakes = useMemo(() => Array.from(new Set(MODULE_DB.map(m => m.Fabricante))).sort(), []);
  const moduleModels = useMemo(() => modMake ? MODULE_DB.filter(m => m.Fabricante === modMake).map(m => m.Modelo).sort() : [], [modMake]);
  const inverterMakes = useMemo(() => Array.from(new Set(INVERTER_DB.map(i => i.Fabricante))).sort(), []);
  const inverterModels = useMemo(() => invMake ? INVERTER_DB.filter(i => i.Fabricante === invMake).map(i => i.Modelo).sort() : [], [invMake]);

  const handleAddModule = () => {
    const db = MODULE_DB.find(m => m.Modelo === modModel);
    if (!db) return;
    setModules([...modules, {
      id: Math.random().toString(36).substr(2, 9),
      quantity: 1,
      supplier: db.Fornecedor,
      manufacturer: db.Fabricante,
      model: db.Modelo,
      type: db.Tipo,
      power: db["Potência"],
      efficiency: Number((db["ƞ Módulo"] * 100).toFixed(2)),
      cells: db["Número de células"],
      imp: db.Imáx,
      vmp: db.Vmáx,
      isc: db["Isc/Icc"],
      voc: db["Voc/Vca"],
      weight: db.Peso,
      area: db["Área (m²)"],
      dimensions: db["Dimensões (mm)"],
      inmetroId: db.Inmetro,
      maxFuseRating: db["Máx. Corr. Fusível (série)"],
      tempCoeff: db["Coef. Temperatura/°C"],
      annualDepreciation: Number((db["Depreciação a.a."] * 100).toFixed(2))
    }]);
  };

  const handleAddInverter = (modelName: string) => {
    const db = INVERTER_DB.find(i => i.Modelo === modelName);
    if (!db) return;
    setInverters([...inverters, {
      id: Math.random().toString(36).substr(2, 9),
      quantity: 1,
      manufacturer: db.Fabricante,
      model: db.Modelo,
      maxInputVoltage: db["Tensão máxima de entrada"],
      minInputVoltage: db["Tensão mínima de entrada"],
      maxInputCurrent: db["Corrente Máxima de entrada"],
      outputVoltage: db["Tensão de saída"],
      outputFrequency: db["Frequência de saída"],
      maxOutputCurrent: db["Corrente Máxima de Saída"],
      nominalPower: db["Potência Nominal"] / 1000,
      maxEfficiency: db["Eficiência Máxima"] > 1 ? db["Eficiência Máxima"] : db["Eficiência Máxima"] * 100,
      weight: db.Peso,
      connectionType: db.Ligação
    }]);
  };

  const handleQtyChange = (list: 'mod' | 'inv', id: string, delta: number) => {
    const setter = list === 'mod' ? setModules : setInverters;
    setter(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getInstallment = (numParcelas: number) => {
    const FATOR_BASE = 0.95;
    const TAXA_JUROS = 0.01;
    const CARENCIA = 6;
    
    const valorBase = manualKitPrice / FATOR_BASE;
    let valorTotal = valorBase;

    if (numParcelas > CARENCIA) {
        const mesesComJuros = numParcelas - CARENCIA;
        valorTotal = valorBase * Math.pow(1 + TAXA_JUROS, mesesComJuros);
    }
    
    return valorTotal / numParcelas;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER TÉCNICO SEM INVESTIMENTO TOTAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sticky top-6 z-40">
         <div className={`lg:col-span-12 p-6 rounded-[2.5rem] shadow-2xl border flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl ${isOptimal ? 'bg-slate-900/95 border-slate-700' : 'bg-orange-600/90 border-orange-400'}`}>
            <div className="flex items-center gap-5">
               <div className="bg-white/10 p-3 rounded-2xl text-white shadow-inner"><Activity size={24} /></div>
               <div className="text-white">
                  <p className="text-[9px] uppercase font-black opacity-50 tracking-widest mb-1">Dimensionamento Ativo</p>
                  <h3 className="text-xl font-black">{totalPowerKwp.toFixed(2)} kWp <span className="text-white/30 mx-2">|</span> Overload: {(overloadRatio * 100).toFixed(0)}%</h3>
               </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 bg-white/5 p-4 rounded-3xl border border-white/10">
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign size={10} className="text-orange-400" /> Valor do Kit (Hardware)
                  </label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 font-black text-sm">R$</span>
                     <input 
                        type="number" 
                        value={manualKitPrice} 
                        onChange={(e) => {
                          setManualKitPrice(parseFloat(e.target.value) || 0);
                          setHasManualEdit(true);
                        }}
                        className="bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-lg font-black text-white outline-none focus:ring-2 focus:ring-orange-500 w-48 tabular-nums" 
                        placeholder="0,00"
                     />
                  </div>
               </div>
            </div>
            
            <button onClick={() => onConfirm(modules, inverters, manualKitPrice)} disabled={modules.length === 0 || inverters.length === 0} className="bg-orange-500 text-white px-10 py-5 rounded-2xl font-black hover:bg-orange-400 transition-all shadow-xl disabled:opacity-20 uppercase text-xs tracking-widest flex items-center gap-3 group">
               Confirmar Engenharia
               <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* COLUNA MÓDULOS */}
        <section className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden">
           <div className="bg-slate-900 p-8 flex items-center gap-4 border-b border-slate-800">
              <div className="bg-orange-500 p-2.5 rounded-xl text-white"><Box size={24} /></div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Módulos Fotovoltaicos</h2>
           </div>
           <div className="p-8 space-y-8">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                 <div className="grid grid-cols-2 gap-4 mb-4">
                    <select value={modMake} onChange={e => { setModMake(e.target.value); setModModel(''); }} className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-black bg-white outline-none focus:ring-4 focus:ring-orange-500/10">
                       <option value="">Marca...</option>
                       {moduleMakes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={modModel} onChange={e => setModModel(e.target.value)} disabled={!modMake} className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-black bg-white outline-none disabled:opacity-50">
                       <option value="">Modelo...</option>
                       {moduleModels.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                 </div>
                 <button onClick={handleAddModule} disabled={!modModel} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-orange-600 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest">
                    <Plus size={16} /> Adicionar Módulo
                 </button>
              </div>

              <div className="space-y-4">
                 {modules.map(m => (
                    <div key={m.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-lg flex items-center justify-between group">
                       <div className="flex-1">
                          <h4 className="font-black text-slate-900 text-sm mb-1">{m.model}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.manufacturer} • {m.power}Wp</p>
                       </div>
                       <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                          <button onClick={() => handleQtyChange('mod', m.id, -1)} className="w-8 h-8 rounded-lg hover:bg-orange-500 hover:text-white transition-colors text-slate-400 font-black">-</button>
                          <span className="text-lg font-black text-slate-800 min-w-[2ch] text-center">{m.quantity}</span>
                          <button onClick={() => handleQtyChange('mod', m.id, 1)} className="w-8 h-8 rounded-lg hover:bg-orange-500 hover:text-white transition-colors text-slate-400 font-black">+</button>
                       </div>
                       <button onClick={() => setModules(modules.filter(x => x.id !== m.id))} className="ml-4 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* COLUNA INVERSORES */}
        <section className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden">
           <div className="bg-slate-900 p-8 flex items-center gap-4 border-b border-slate-800">
              <div className="bg-yellow-500 p-2.5 rounded-xl text-white"><Zap size={24} /></div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Inversores de Frequência</h2>
           </div>
           <div className="p-8 space-y-8">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                 <div className="grid grid-cols-2 gap-4 mb-4">
                    <select value={invMake} onChange={e => { setInvMake(e.target.value); }} className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-black bg-white outline-none focus:ring-4 focus:ring-yellow-500/10">
                       <option value="">Marca...</option>
                       {inverterMakes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={invModel} onChange={e => handleAddInverter(e.target.value)} disabled={!invMake} className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-black bg-white outline-none disabled:opacity-50">
                       <option value="">Modelo...</option>
                       {inverterModels.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                 </div>
              </div>

              <div className="space-y-4">
                 {inverters.map(i => (
                    <div key={i.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-lg flex items-center justify-between group">
                       <div className="flex-1">
                          <h4 className="font-black text-slate-900 text-sm mb-1">{i.model}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{i.manufacturer} • {i.nominalPower}kW</p>
                       </div>
                       <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                          <button onClick={() => handleQtyChange('inv', i.id, -1)} className="w-8 h-8 rounded-lg hover:bg-yellow-500 hover:text-white transition-colors text-slate-400 font-black">-</button>
                          <span className="text-lg font-black text-slate-800 min-w-[2ch] text-center">{i.quantity}</span>
                          <button onClick={() => handleQtyChange('inv', i.id, 1)} className="w-8 h-8 rounded-lg hover:bg-yellow-500 hover:text-white transition-colors text-slate-400 font-black">+</button>
                       </div>
                       <button onClick={() => setInverters(inverters.filter(x => x.id !== i.id))} className="ml-4 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                    </div>
                 ))}
              </div>
           </div>
        </section>
      </div>

      {/* FOOTER FINANCEIRO SEM INVESTIMENTO TOTAL */}
      <section className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-slate-900"><TrendingUp size={24}/> <h4 className="text-sm font-black uppercase tracking-widest">Resumo Comercial do Kit</h4></div>
             <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase">Kit de Equipamentos (À Vista)</span> 
                  <span className="font-black text-slate-700">{formatMoney(manualKitPrice)}</span>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-3 text-slate-900"><CreditCard size={24}/> <h4 className="text-sm font-black uppercase tracking-widest">Parcelamento Kit (Cartão)</h4></div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">6 Meses (Sem Juros Adic.)</p>
                   <p className="text-xs font-black text-slate-900">{formatMoney(getInstallment(6))}/mês</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">12 Meses (1% am &gt; 6)</p>
                   <p className="text-xs font-black text-slate-900">{formatMoney(getInstallment(12))}/mês</p>
                </div>
             </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 flex flex-col justify-center items-center text-center">
             <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-orange-500 mb-4 animate-bounce">
                <CheckCircle size={32} />
             </div>
             <h4 className="text-sm font-black text-slate-900 uppercase mb-2">Engenharia Validada</h4>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Padrão NBR-5410 de segurança e eficiência fotovoltaica.</p>
          </div>
      </section>

      {/* RODAPÉ DE NAVEGAÇÃO PADRONIZADO */}
      <div className="flex items-center justify-between pt-12 border-t border-slate-200">
        <button type="button" onClick={onBack} className="group flex items-center gap-4 text-slate-400 hover:text-slate-900 transition-all px-10 py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Voltar
        </button>
        
        <button onClick={() => onConfirm(modules, inverters, manualKitPrice)} disabled={modules.length === 0 || inverters.length === 0} className="group relative overflow-hidden bg-orange-600 hover:bg-orange-500 text-white font-black py-6 px-16 rounded-[2rem] shadow-xl shadow-orange-600/20 transition-all active:scale-95 flex items-center gap-6 disabled:opacity-20">
          <span className="tracking-[0.2em] uppercase text-lg">Próxima Etapa</span>
          <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
    </div>
  );
};
