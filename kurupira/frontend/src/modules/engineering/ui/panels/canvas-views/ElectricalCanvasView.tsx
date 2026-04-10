import React from 'react';
import { Activity } from 'lucide-react';

export const ElectricalCanvasView: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[60vh] p-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
      <div className="p-4 rounded-full bg-indigo-500/10 mb-4 border border-indigo-500/20">
        <Activity size={32} className="text-indigo-400" />
      </div>
      <h2 className="text-2xl font-black text-slate-300 tracking-tight">Topologia & Diagramas Físicos</h2>
      <p className="text-slate-500 mt-2 max-w-md text-center">
        Em construção (Fase 3). Este painel abrigará a árvore unifilar do sistema, calculadora de bitola DC/AC e modelos interativos de clipagem térmica.
      </p>
    </div>
  );
};
