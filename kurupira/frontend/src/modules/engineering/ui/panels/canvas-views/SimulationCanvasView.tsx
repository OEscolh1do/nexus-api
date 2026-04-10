import React from 'react';
import { BarChart3 } from 'lucide-react';

export const SimulationCanvasView: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[60vh] p-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
      <div className="p-4 rounded-full bg-teal-500/10 mb-4 border border-teal-500/20">
        <BarChart3 size={32} className="text-teal-400" />
      </div>
      <h2 className="text-2xl font-black text-slate-300 tracking-tight">Motor Analítico de Simulação</h2>
      <p className="text-slate-500 mt-2 max-w-md text-center">
        Em construção (Fase 4). Este painel abrigará a curva diária de geração teórica e o Load Simulator (Carrinho de Cargas Futuras).
      </p>
    </div>
  );
};
