import React from 'react';
import { SimulationPreview } from '../components/SimulationPreview';
import { BarChart3 } from 'lucide-react';

export const GenerationAnalysisTab: React.FC = () => {
    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-300">
             {/* Section 1: Header/Controls (Future expansion for Loss inputs) */}
             <section className="shrink-0 flex items-center justify-between pb-2 border-b border-slate-100">
                 <div className="flex items-center gap-2">
                     <BarChart3 size={18} className="text-slate-500" />
                     <h3 className="text-sm font-semibold text-slate-800">Simulação de Performance</h3>
                 </div>
                 {/* Placeholder for "Calculate" button or Loss inputs */}
             </section>

            {/* Section 2: Analysis Content (Reusing Preview for now) */}
            <div className="flex-1 min-h-0 rounded-lg border border-slate-100 bg-slate-50/50 p-2 overflow-hidden">
                <SimulationPreview />
            </div>
        </div>
    );
};
