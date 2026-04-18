import React, { useState, useMemo } from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { LoadItem } from '@/core/state/slices/clientSlice';
import { Pencil, Trash2, AirVent, Refrigerator, ShowerHead, WashingMachine, Microwave, Car, Plus } from 'lucide-react';


// Library of common electrical loads with realistic engineering data
const LOAD_PRESETS = [
  { name: 'Ar-condicionado 12k BTU', power: 1200, hoursPerDay: 8, icon: AirVent },
  { name: 'Geladeira Duplex', power: 150, hoursPerDay: 24, icon: Refrigerator },
  { name: 'Chuveiro Elétrico', power: 5500, hoursPerDay: 0.5, icon: ShowerHead },
  { name: 'Lavadora de Roupas', power: 500, hoursPerDay: 1, icon: WashingMachine },
  { name: 'Micro-ondas', power: 1200, hoursPerDay: 0.2, icon: Microwave },
  { name: 'Carregador VE', power: 7000, hoursPerDay: 4, icon: Car },
];

const calcKwh = (item: Partial<LoadItem>) => {
  if (!item.power || !item.hoursPerDay || !item.daysPerMonth) return 0;
  const duty = item.dutyCycle ?? 1;
  const qty = item.qty ?? 1;
  return (item.power * duty * item.hoursPerDay * item.daysPerMonth * qty) / 1000;
};

export const SimulatedLoadsPanel: React.FC = () => {
  const entities = useSolarStore(s => s.simulatedItems.entities);
  const simulatedItems = useMemo(() => Object.values(entities), [entities]);
  const addLoadItem = useSolarStore(s => s.addLoadItem);
  const updateLoadItem = useSolarStore(s => s.updateLoadItem);
  const removeLoadItem = useSolarStore(s => s.removeLoadItem);

  const totalCargasKwh = useMemo(() => {
    return simulatedItems.reduce((acc, item) => {
      const duty = item.dutyCycle ?? 1;
      const days = item.daysPerMonth ?? 30;
      return acc + ((item.power * duty * item.hoursPerDay * days * item.qty) / 1000);
    }, 0);
  }, [simulatedItems]);

  const [editingItem, setEditingItem] = useState<string | null>(null);

  // Form State
  const defaultFormState: Partial<LoadItem> = {
    name: '',
    power: 0,
    hoursPerDay: 8,
    daysPerMonth: 30,
    qty: 1,
    dutyCycle: 1,
  };
  const [form, setForm] = useState<Partial<LoadItem>>(defaultFormState);

  const handleAddItem = () => {
    if (!form.name || !form.power || form.power <= 0) return;
    addLoadItem({
      id: crypto.randomUUID(),
      name: form.name,
      power: form.power,
      perfil: 'constante',
      hoursPerDay: form.hoursPerDay!,
      daysPerMonth: form.daysPerMonth!,
      qty: form.qty!,
      dutyCycle: form.dutyCycle!,
    } as LoadItem);
    setForm(defaultFormState);
  };

  const applyPreset = (preset: typeof LOAD_PRESETS[0]) => {
    setForm({
      ...defaultFormState,
      name: preset.name,
      power: preset.power,
      hoursPerDay: preset.hoursPerDay,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      
      {/* ── SELEÇÃO RÁPIDA (PRESETS) ────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] text-slate-500 uppercase font-black tracking-widest ml-1">Biblioteca de Cargas Comuns</span>
        <div className="flex flex-wrap gap-2">
          {LOAD_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-sm hover:border-sky-500/50 hover:bg-slate-800 transition-all group"
            >
              <preset.icon size={12} className="text-slate-500 group-hover:text-sky-500 transition-colors" />
              <span className="text-[11px] text-slate-300 font-bold uppercase tracking-tight">{preset.name.split(' ')[0]}</span>
              <span className="text-[11px] text-slate-600 font-mono tracking-tighter tabular-nums">{preset.power}W</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden shadow-inner">
        {/* Header da Tabela */}
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-950/50 border-b border-slate-800">
           <span className="text-[11px] text-slate-500 uppercase font-black tracking-widest flex-1">Identificação da Carga</span>
           <span className="text-[11px] text-slate-500 uppercase font-black tracking-widest w-24 text-right">Consumo Mensal</span>
           <span className="w-12"></span>
        </div>

        {/* Lista de itens */}
        <div className="max-h-[300px] overflow-y-auto custom-scrollbar overflow-x-auto">
          <div className="min-w-[400px] xl:min-w-0">
            {simulatedItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800/40 last:border-0 hover:bg-slate-800/30 group transition-colors">
                
                {/* Nome + Detalhes Técnicos */}
                <div className="flex-1 min-w-0">
                  {editingItem === item.id ? (
                    <input 
                      autoFocus
                      defaultValue={item.name}
                      onBlur={(e) => {
                        updateLoadItem(item.id, { name: e.target.value });
                        setEditingItem(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          updateLoadItem(item.id, { name: (e.target as HTMLInputElement).value });
                          setEditingItem(null);
                        }
                      }}
                      className="w-full bg-slate-950 border border-sky-500/50 rounded-sm px-2 py-1 text-xs text-sky-300 focus:outline-none font-mono"
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-200 truncate uppercase tracking-tight">{item.name}</p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-1 font-mono uppercase tracking-tighter tabular-nums">
                    {item.power}W · {item.hoursPerDay}h/dia · {item.daysPerMonth}D/MÊS {item.qty > 1 && `· QTY:${item.qty}`}
                  </p>
                </div>

                {/* kWh Instrument */}
                <div className="w-24 flex flex-col items-end">
                   <span className="text-sm font-mono text-sky-500 tabular-nums font-black leading-none italic">
                     {calcKwh(item).toFixed(2)}
                   </span>
                   <span className="text-[11px] font-black text-sky-600/50 uppercase tracking-widest">kWh/mês</span>
                </div>

                {/* Ações */}
                <div className="w-12 flex justify-end gap-1 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                    className="p-1 hover:text-sky-400 text-slate-600 transition-colors"
                    title="Editar Nome"
                  >
                    <Pencil size={11} />
                  </button>
                  <button 
                    onClick={() => removeLoadItem(item.id)}
                    className="p-1 hover:text-red-400 text-slate-600 transition-colors"
                    title="Remover Carga"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}

            {simulatedItems.length === 0 && (
              <div className="py-8 text-center bg-slate-950/20">
                 <p className="text-[11px] text-slate-600 font-bold uppercase tracking-widest italic">Nenhuma carga simulada ativa</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer de Soma */}
        {simulatedItems.length > 0 && (
          <div className="flex justify-between items-center px-4 py-2.5 bg-slate-950 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500 uppercase font-black tracking-widest">Total de Incremento de Carga</span>
            <div className="flex items-baseline gap-1.5">
               <span className="text-xs font-mono text-sky-500 tabular-nums font-black animate-pulse">
                + {totalCargasKwh.toFixed(2)}
              </span>
              <span className="text-[11px] font-bold text-sky-600/50 uppercase">kWh/mês</span>
            </div>
          </div>
        )}
      </div>

      {/* Formulário de Adição "Plaquetado" */}
      <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-sm relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-1 h-full bg-sky-500/20" />
        
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4 items-end">
          {/* Campo: Identificação */}
          <div className="col-span-12 sm:col-span-6 xl:col-span-12 2xl:col-span-5 flex flex-col gap-1">
            <label className="text-[11px] uppercase font-black text-slate-500 tracking-widest ml-1">Identificação da Carga</label>
            <input 
              placeholder="Ex: Ar-condicionado Pav. 1"
              value={form.name} 
              onChange={e => setForm(f => ({...f, name: e.target.value}))}
              className="w-full h-9 bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50 font-sans uppercase tracking-tight" 
            />
          </div>

          <div className="col-span-6 sm:col-span-3 xl:col-span-4 2xl:col-span-2 flex flex-col gap-1 items-center">
            <label className="text-[11px] uppercase font-black text-slate-500 tracking-widest">Potência (W)</label>
            <input 
              type="number" 
              min={1}
              value={form.power || ''} 
              onChange={e => setForm(f => ({...f, power: Number(e.target.value)}))}
              className="w-full h-9 bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-xs text-sky-400 focus:outline-none focus:border-sky-500/50 font-mono text-center tabular-nums" 
            />
          </div>

          <div className="col-span-6 sm:col-span-3 xl:col-span-4 2xl:col-span-3 flex flex-col gap-1 items-center">
            <label className="text-[11px] uppercase font-black text-slate-500 tracking-widest">Uso (H/Dia)</label>
            <div className="flex items-center w-full">
               <button onClick={() => setForm(f => ({...f, hoursPerDay: Math.max(0.1, (f.hoursPerDay || 8) - 0.5)}))} className="w-8 h-9 bg-slate-950 border border-slate-800 border-r-0 text-slate-500 hover:text-sky-500 font-bold active:bg-slate-800 transition-colors">−</button>
               <input 
                type="number" 
                value={form.hoursPerDay || ''} 
                onChange={e => setForm(f => ({...f, hoursPerDay: Number(e.target.value)}))}
                className="flex-1 h-9 bg-slate-950 border border-slate-800 text-center text-xs text-slate-200 font-mono outline-none focus:border-sky-500/30" 
              />
              <button onClick={() => setForm(f => ({...f, hoursPerDay: Math.min(24, (f.hoursPerDay || 8) + 0.5)}))} className="w-8 h-9 bg-slate-950 border border-slate-800 border-l-0 text-slate-500 hover:text-sky-500 font-bold active:bg-slate-800 transition-colors">+</button>
            </div>
          </div>

          <div className="col-span-12 2xl:col-span-2">
            <button
              onClick={handleAddItem}
              disabled={!form.name || !form.power || form.power <= 0}
              className="w-full h-9 bg-sky-600 hover:bg-sky-500 text-slate-950 text-[11px] font-black uppercase tracking-widest rounded-sm transition-all disabled:opacity-20 shadow-lg shadow-sky-900/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>
        </div>

        {/* Impacto Preventivo */}
        {form.power! > 0 && form.hoursPerDay! > 0 && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/40">
            <span className="text-[11px] text-slate-500 uppercase font-black tracking-[0.2em]">Impacto Nominal:</span>
            <span className="text-[11px] font-mono font-black text-sky-500 border-b border-sky-500/30 tabular-nums">
              {calcKwh(form).toFixed(2)} KWH/MÊS
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
