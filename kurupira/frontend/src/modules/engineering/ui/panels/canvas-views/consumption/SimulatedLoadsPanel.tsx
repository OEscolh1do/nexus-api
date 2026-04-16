import React, { useState, useMemo } from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { LoadItem } from '@/core/state/slices/clientSlice';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';


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

  // Form State for new inline insertion
  const defaultFormState: Partial<LoadItem> = {
    name: '',
    power: 0,
    perfil: 'constante',
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
      perfil: form.perfil,
      hoursPerDay: form.hoursPerDay!,
      daysPerMonth: form.daysPerMonth!,
      qty: form.qty!,
      dutyCycle: form.dutyCycle!,
    } as LoadItem);
    setForm(defaultFormState);
  };

  return (
    <div className="flex flex-col">
      <div className="bg-slate-900 rounded-sm border border-slate-800 overflow-hidden">
        {/* Lista de itens */}
        {simulatedItems.map(item => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/40 group">
            
            {/* Nome + perfil */}
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
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-amber-300 focus:outline-none focus:border-amber-500"
                />
              ) : (
                <p className="text-sm text-slate-200 truncate">{item.name}</p>
              )}
              <p className="text-[10px] text-slate-500 mt-0.5">
                {item.hoursPerDay}h/dia · {item.daysPerMonth} dias {item.qty > 1 && `· ${item.qty} unid.`}
              </p>
            </div>

            {/* Badge de perfil */}
            <span className={cn(
              'text-[8px] px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold font-mono',
              item.perfil === 'constante' && 'bg-slate-800 text-slate-400 border border-slate-700',
              item.perfil === 'verao'     && 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
              item.perfil === 'inverno'   && 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
            )}>
              {item.perfil}
            </span>

            {/* kWh */}
            <span className="text-xs font-mono text-amber-500 w-24 text-right tabular-nums font-bold">
              {calcKwh(item).toFixed(0)} <span className="text-[10px] font-normal opacity-40">kWh</span>
            </span>

            {/* Ações (visíveis no hover) */}
            <div className="flex gap-1 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                className="p-1 hover:text-amber-400 text-slate-500 transition-colors"
                title="Renomear"
              >
                <Pencil size={12} />
              </button>
              <button 
                onClick={() => removeLoadItem(item.id)}
                className="p-1 hover:text-red-400 text-slate-500 transition-colors"
                title="Excluir"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}

        {/* Total */}
        {simulatedItems.length > 0 && (
          <div className="flex justify-between items-center px-4 py-3 bg-slate-950/40 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Total Simulated Load</span>
            <span className="text-sm font-mono text-amber-400 tabular-nums font-bold">
              + {totalCargasKwh.toFixed(0)} <span className="text-xs font-normal opacity-50">kWh/mês</span>
            </span>
          </div>
        )}
      </div>

      {/* 5.3 Formulário de adição inline */}
      <div className="mt-4 p-4 bg-slate-900/40 rounded-sm border border-slate-800">
        <p className="text-[10px] text-slate-500 mb-4 uppercase tracking-widest font-bold flex items-center gap-2">
          <span className="w-1 h-3 bg-amber-500/40" />
          Projetar Nova Demanda Sazonal
        </p>

        <div className="grid grid-cols-12 gap-3 mb-4">
          <div className="col-span-12 xl:col-span-5">
            <input 
              placeholder="Tag da Carga (ex: Ar-condicionado Pav 1)"
              value={form.name} 
              onChange={e => setForm(f => ({...f, name: e.target.value}))}
              className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 placeholder:text-slate-700 font-sans" 
            />
          </div>

          <div className="col-span-4 xl:col-span-2">
            <input 
              placeholder="Potência (W)" 
              type="number" 
              min={1}
              value={form.power || ''} 
              onChange={e => setForm(f => ({...f, power: Number(e.target.value)}))}
              className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 font-mono" 
            />
          </div>

          <div className="col-span-4 xl:col-span-2">
            <select 
              value={form.perfil} 
              onChange={e => setForm(f => ({...f, perfil: e.target.value as any}))}
              className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-xs text-slate-400 focus:outline-none focus:border-amber-500/50 appearance-none uppercase font-mono tracking-tighter"
            >
              <option value="constante">Constante</option>
              <option value="verao">Verão</option>
              <option value="inverno">Inverno</option>
            </select>
          </div>

          <div className="col-span-2 xl:col-span-1">
            <input 
              placeholder="H/D" 
              title="Horas/dia"
              type="number" 
              value={form.hoursPerDay || ''} 
              onChange={e => setForm(f => ({...f, hoursPerDay: Number(e.target.value)}))}
              className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 font-mono" 
            />
          </div>

          <div className="col-span-2 xl:col-span-2">
            <button
              onClick={handleAddItem}
              disabled={!form.name || !form.power || form.power <= 0}
              className="w-full h-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all disabled:opacity-20"
            >
              + Commit
            </button>
          </div>
        </div>

        {/* Preview do kWh antes de confirmar */}
        {form.power! > 0 && form.hoursPerDay! > 0 && (
          <div className="flex items-center gap-2 text-[10px] text-amber-500/50 font-mono uppercase tracking-widest">
            <span className="w-1 h-1 bg-amber-500/30 rounded-full" />
            Impacto Estimado: {calcKwh(form).toFixed(1)} kWh/mês
          </div>
        )}
      </div>
    </div>
  );
};
