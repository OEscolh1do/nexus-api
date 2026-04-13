import React, { useState, useMemo } from 'react';
import { Cpu, Sun, Plus } from 'lucide-react';
import { useCatalogStore } from '../store/useCatalogStore';
import type { ModuleCatalogItem } from '@/core/schemas/moduleSchema';
import type { InverterCatalogItem } from '@/core/schemas/inverterSchema';

// =============================================================================
// ADD INVERTER PROMPT — Shown when topology is empty
// =============================================================================

interface AddInverterPromptProps {
  onAdd: (item: InverterCatalogItem) => void;
}

export const AddInverterPrompt: React.FC<AddInverterPromptProps> = ({ onAdd }) => {
  const { inverters } = useCatalogStore();
  const [brand, setBrand] = useState('');
  const [modelId, setModelId] = useState('');

  const brands = useMemo(() =>
    [...new Set(inverters.map((i: InverterCatalogItem) => i.manufacturer))].sort(),
    [inverters]
  );

  const modelsForBrand = useMemo(() =>
    inverters.filter((i: InverterCatalogItem) => i.manufacturer === brand),
    [inverters, brand]
  );

  const selectedItem = inverters.find((i: InverterCatalogItem) => i.id === modelId);

  const handleAdd = () => {
    if (selectedItem) {
      onAdd(selectedItem);
      setBrand('');
      setModelId('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 text-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
        <Cpu size={20} className="text-emerald-500" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-300">Comece adicionando um inversor</p>
        <p className="text-[9px] text-slate-500 mt-0.5">Selecione a marca e o modelo abaixo</p>
      </div>

      {/* Brand Select */}
      <div className="w-full max-w-[200px]">
        <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 block text-left">Marca</label>
        <select
          value={brand}
          onChange={(e) => { setBrand(e.target.value); setModelId(''); }}
          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-[10px] text-slate-200 outline-none focus:border-emerald-500/50 transition-colors appearance-none cursor-pointer"
        >
          <option value="">Selecione a marca...</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Model Select */}
      {brand && (
        <div className="w-full max-w-[200px] animate-in fade-in slide-in-from-top-1 duration-150">
          <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 block text-left">Modelo</label>
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-[10px] text-slate-200 outline-none focus:border-emerald-500/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="">Selecione o modelo...</option>
            {modelsForBrand.map((inv: InverterCatalogItem) => (
              <option key={inv.id} value={inv.id}>
                {inv.model} — {inv.nominalPowerW / 1000}kW | {inv.mppts?.length || 1} MPPT
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Add Button */}
      {selectedItem && (
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-md transition-colors animate-in fade-in slide-in-from-bottom-1 duration-150"
        >
          <Plus size={12} /> Adicionar Inversor
        </button>
      )}
    </div>
  );
};

// =============================================================================
// ADD MODULE TO MPPT — Inline cascading select for modules
// =============================================================================

interface AddModuleInlineProps {
  onAdd: (item: ModuleCatalogItem, qty: number) => void;
  onClose: () => void;
}

export const AddModuleInline: React.FC<AddModuleInlineProps> = ({ onAdd, onClose }) => {
  const { modules } = useCatalogStore();
  const [brand, setBrand] = useState('');
  const [modelId, setModelId] = useState('');
  const [qty, setQty] = useState(1);

  const brands = useMemo(() =>
    [...new Set(modules.map((m: ModuleCatalogItem) => m.manufacturer))].sort(),
    [modules]
  );

  const modelsForBrand = useMemo(() =>
    modules.filter((m: ModuleCatalogItem) => m.manufacturer === brand),
    [modules, brand]
  );

  const selectedItem = modules.find((m: ModuleCatalogItem) => m.id === modelId);

  const handleAdd = () => {
    if (selectedItem) {
      onAdd(selectedItem, qty);
      onClose();
    }
  };

  return (
    <div className="p-2 bg-slate-900/80 border border-slate-700 rounded-lg space-y-1.5 animate-in fade-in zoom-in-95 duration-150 mx-1 my-1">
      <div className="flex items-center gap-1.5 mb-1">
        <Sun size={10} className="text-amber-500" />
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Adicionar Módulos</span>
        <button onClick={onClose} className="ml-auto text-slate-600 hover:text-slate-300 text-[10px] font-bold px-1">✕</button>
      </div>

      {/* Brand */}
      <select
        value={brand}
        onChange={(e) => { setBrand(e.target.value); setModelId(''); }}
        className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-200 outline-none focus:border-amber-500/50 transition-colors"
      >
        <option value="">Marca...</option>
        {brands.map(b => <option key={b} value={b}>{b}</option>)}
      </select>

      {/* Model */}
      {brand && (
        <select
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-200 outline-none focus:border-amber-500/50 transition-colors"
        >
          <option value="">Modelo...</option>
          {modelsForBrand.map((mod: ModuleCatalogItem) => (
            <option key={mod.id} value={mod.id}>
              {mod.model} — {mod.electrical?.pmax || 0}W
            </option>
          ))}
        </select>
      )}

      {/* Qty + Add */}
      {selectedItem && (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center border border-slate-800 rounded overflow-hidden">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-1.5 py-0.5 text-slate-400 hover:bg-slate-800 text-[10px]">−</button>
            <span className="px-2 py-0.5 text-[10px] font-bold text-slate-200 bg-slate-950 min-w-[24px] text-center tabular-nums">{qty}</span>
            <button onClick={() => setQty(Math.min(99, qty + 1))} className="px-1.5 py-0.5 text-slate-400 hover:bg-slate-800 text-[10px]">+</button>
          </div>
          <button
            onClick={handleAdd}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-bold rounded transition-colors"
          >
            <Plus size={10} /> Adicionar {qty}x
          </button>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// ADD INVERTER INLINE — For adding more inverters when topology is not empty
// =============================================================================

interface AddInverterInlineProps {
  onAdd: (item: InverterCatalogItem) => void;
}

export const AddInverterInline: React.FC<AddInverterInlineProps> = ({ onAdd }) => {
  const { inverters } = useCatalogStore();
  const [isOpen, setIsOpen] = useState(false);
  const [brand, setBrand] = useState('');
  const [modelId, setModelId] = useState('');

  const brands = useMemo(() =>
    [...new Set(inverters.map((i: InverterCatalogItem) => i.manufacturer))].sort(),
    [inverters]
  );

  const modelsForBrand = useMemo(() =>
    inverters.filter((i: InverterCatalogItem) => i.manufacturer === brand),
    [inverters, brand]
  );

  const selectedItem = inverters.find((i: InverterCatalogItem) => i.id === modelId);

  const handleAdd = () => {
    if (selectedItem) {
      onAdd(selectedItem);
      setBrand('');
      setModelId('');
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 mt-1 mx-2 border border-dashed border-slate-800 hover:border-emerald-500/40 rounded-lg text-[9px] text-slate-600 hover:text-emerald-400 font-bold transition-colors"
      >
        <Plus size={10} /> Inversor
      </button>
    );
  }

  return (
    <div className="p-2 bg-slate-900/80 border border-slate-700 rounded-lg space-y-1.5 animate-in fade-in zoom-in-95 duration-150 mx-1 my-1">
      <div className="flex items-center gap-1.5 mb-1">
        <Cpu size={10} className="text-emerald-500" />
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Novo Inversor</span>
        <button onClick={() => { setIsOpen(false); setBrand(''); setModelId(''); }} className="ml-auto text-slate-600 hover:text-slate-300 text-[10px] font-bold px-1">✕</button>
      </div>

      <select
        value={brand}
        onChange={(e) => { setBrand(e.target.value); setModelId(''); }}
        className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-200 outline-none focus:border-emerald-500/50 transition-colors"
      >
        <option value="">Marca...</option>
        {brands.map(b => <option key={b} value={b}>{b}</option>)}
      </select>

      {brand && (
        <select
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-200 outline-none focus:border-emerald-500/50 transition-colors"
        >
          <option value="">Modelo...</option>
          {modelsForBrand.map((inv: InverterCatalogItem) => (
            <option key={inv.id} value={inv.id}>
              {inv.model} — {inv.nominalPowerW / 1000}kW | {inv.mppts?.length || 1} MPPT
            </option>
          ))}
        </select>
      )}

      {selectedItem && (
        <button onClick={handleAdd} className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold rounded transition-colors">
          <Plus size={10} /> Adicionar
        </button>
      )}
    </div>
  );
};
