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
  // CORREÇÃO A9: Seletores estáveis — nunca derivar dentro do selector.
  // Object.values() cria novo array a cada snapshot → infinite loop React 18.
  const entities = useSolarStore(s => s.simulatedItems.entities);
  const simulatedItems = useMemo(() => Object.values(entities), [entities]);
  const addLoadItem = useSolarStore(s => s.addLoadItem);
  const updateLoadItem = useSolarStore(s => s.updateLoadItem);
  const removeLoadItem = useSolarStore(s => s.removeLoadItem);

  // CORREÇÃO: getSimulatedTotal() chamado fora do selector para evitar re-snapshot.
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
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
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
              'text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold',
              item.perfil === 'constante' && 'bg-slate-700 text-slate-300',
              item.perfil === 'verao'     && 'bg-amber-900/40 text-amber-400',
              item.perfil === 'inverno'   && 'bg-sky-900/40 text-sky-400'
            )}>
              {item.perfil}
            </span>

            {/* kWh */}
            <span className="text-sm font-mono text-amber-400 w-20 text-right">
              {calcKwh(item).toFixed(0)} kWh
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
          <div className="flex justify-between items-center px-4 py-2 bg-slate-800/50">
            <span className="text-xs text-slate-400">Total cargas simuladas</span>
            <span className="text-sm font-mono text-amber-400">
              + {totalCargasKwh.toFixed(0)} kWh/mês
            </span>
          </div>
        )}
      </div>

      {/* 5.3 Formulário de adição inline */}
      <div className="mt-3 p-3 bg-slate-900/60 rounded-lg border border-dashed border-slate-700">
        <p className="text-[10px] text-slate-500 mb-3 uppercase tracking-wider font-bold">
          Adicionar Nova Carga Sazonal/Projetada
        </p>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <input 
            placeholder="Nome (ex: Ar-condicionado 12k BTU)"
            value={form.name} 
            onChange={e => setForm(f => ({...f, name: e.target.value}))}
            className="col-span-2 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 placeholder:text-slate-600 font-sans" 
          />

          <input 
            placeholder="Potência (W)" 
            type="number" 
            min={1}
            value={form.power || ''} 
            onChange={e => setForm(f => ({...f, power: Number(e.target.value)}))}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 placeholder:text-slate-600" 
          />

          <select 
            value={form.perfil} 
            onChange={e => setForm(f => ({...f, perfil: e.target.value as any}))}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 appearance-none"
          >
            <option value="constante">Constante</option>
            <option value="verao">Verão</option>
            <option value="inverno">Inverno</option>
          </select>

          <input 
            placeholder="Horas/dia" 
            title="Horas de uso por dia"
            type="number" 
            min={0.5} 
            max={24} 
            step={0.5}
            value={form.hoursPerDay || ''} 
            onChange={e => setForm(f => ({...f, hoursPerDay: Number(e.target.value)}))}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 placeholder:text-slate-600" 
          />

          <input 
            placeholder="Dias/mês" 
            title="Dias de uso por mês"
            type="number" 
            min={1} 
            max={31}
            value={form.daysPerMonth || ''} 
            onChange={e => setForm(f => ({...f, daysPerMonth: Number(e.target.value)}))}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 placeholder:text-slate-600" 
          />
        </div>

        {/* Preview do kWh antes de confirmar */}
        <div className="flex justify-between items-center mt-3">
          <div className="h-4">
            {form.power! > 0 && form.hoursPerDay! > 0 && form.daysPerMonth! > 0 && (
              <p className="text-[11px] text-amber-500/80 font-mono tracking-wide">
                ≈ {calcKwh(form).toFixed(0)} kWh/mês
              </p>
            )}
          </div>
          <button
            onClick={handleAddItem}
            disabled={!form.name || !form.power || form.power <= 0}
            className="px-6 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 text-amber-400 text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-30 disabled:hover:bg-amber-600/20"
          >
            + Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};
