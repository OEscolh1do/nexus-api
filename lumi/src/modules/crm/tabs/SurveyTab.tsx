import React from 'react';
import { User, Map, Sun } from 'lucide-react';
import { ClientDataPanel } from '../components/ClientDataPanel';
import { GeoLocationWidget } from '../components/GeoLocationWidget';
import { WeatherStats } from '../components/WeatherStats';
import { DenseCard } from '@/components/ui/dense-form';

export const SurveyTab: React.FC = () => {
    return (
        <div className="grid grid-cols-12 gap-4 h-full w-full">
            {/* COLUMN 1: ADMINISTRATIVE DATA (3 cols) */}
            <section className="col-span-3 h-full flex flex-col min-h-0">
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-neonorte-purple/10 to-transparent rounded-t-xl border border-b-0 border-neonorte-purple/20 shrink-0">
                    <User size={14} className="text-neonorte-purple" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-neonorte-purple">Dados Administrativos</span>
                </div>
                <div className="flex-1 bg-white rounded-b-xl border-2 border-neonorte-purple/20 shadow-lg shadow-neonorte-purple/5 overflow-y-auto p-3">
                    <ClientDataPanel />
                </div>
            </section>

            {/* COLUMN 2: GEO LOCATION (6 cols, Map takes priority) */}
            <section className="col-span-6 h-full flex flex-col min-h-0">
                 <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-t-xl border border-b-0 border-emerald-500/20 shrink-0">
                    <Map size={14} className="text-emerald-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Localização</span>
                </div>
                <div className="flex-1 bg-white rounded-b-xl border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10 overflow-hidden relative">
                    <GeoLocationWidget />
                </div>
            </section>

             {/* COLUMN 3: WEATHER STATS (3 cols) */}
             <section className="col-span-3 h-full flex flex-col min-h-0">
                 {/* Header for context */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500/10 to-transparent rounded-t-xl border border-b-0 border-orange-500/20 shrink-0">
                    <Sun size={14} className="text-orange-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Dados Climáticos</span>
                </div>
                 
                 <div className="flex-1 flex flex-col gap-3 h-full min-h-0 bg-white rounded-b-xl border-2 border-orange-500/20 p-3">
                     <WeatherStats />
                     
                     {/* Placeholder for future expansion or just empty space usage */}
                     <DenseCard className="flex-1 bg-slate-50 border-slate-100 flex items-center justify-center text-slate-300 text-xs">
                        <p>Análise de Sombreamento (Em breve)</p>
                     </DenseCard>
                 </div>
            </section>
        </div>
    );
};
