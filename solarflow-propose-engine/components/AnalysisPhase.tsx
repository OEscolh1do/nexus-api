
import React, { useEffect, useState, useMemo } from 'react';
import { ProposalData } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { fetchWeatherAnalysis } from '../services/weatherService';
import {
   Activity, Sun, MapPin, Loader2,
   TrendingUp, Calendar, Zap, BarChart3,
   Clock, ChevronRight, ChevronLeft, Table as TableIcon
} from 'lucide-react';
import {
   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
   ResponsiveContainer, AreaChart, Area
} from 'recharts';

interface Props {
   data: ProposalData;
   preloadedAnalysis: any;
   isPreloading: boolean;
   onBack: () => void;
   onConfirm: (updatedData: ProposalData) => void;
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const AnalysisPhase: React.FC<Props> = ({ data, preloadedAnalysis, isPreloading, onBack, onConfirm }) => {
   const [loading, setLoading] = useState(!preloadedAnalysis);
   const [error, setError] = useState<string | null>(null);
   const [analysisResult, setAnalysisResult] = useState<any>(preloadedAnalysis);

   useEffect(() => {
      // Se já temos os dados pré-carregados, apenas usamos eles.
      if (preloadedAnalysis) {
         setAnalysisResult(preloadedAnalysis);
         setLoading(false);
         return;
      }

      // Caso o usuário chegue aqui antes do background fetch terminar ou se falhou
      if (!isPreloading && !preloadedAnalysis) {
         const fetchAnalysis = async () => {
            setLoading(true);
            try {
               const result = await fetchWeatherAnalysis(data.lat, data.lng, data.city, data.state, process.env.API_KEY || '');
               setAnalysisResult(result);
            } catch (err) {
               console.error("Critical Analysis Error:", err);
               setError("Falha na sincronização meteorológica. Revertendo para dados médios de engenharia.");
            } finally {
               setLoading(false);
            }
         };
         fetchAnalysis();
      }
   }, [data, preloadedAnalysis, isPreloading]);

   const metrics = useMemo(() => {
      if (!analysisResult || analysisResult.hsp_monthly.length !== 12) return null;

      const hspMonthly = analysisResult.hsp_monthly;
      const PR = 0.75;
      const monthlyGen = hspMonthly.map((hsp: number, i: number) => data.systemSize * hsp * DAYS_IN_MONTH[i] * PR);
      const annualTotal = monthlyGen.reduce((a, b) => a + b, 0);
      const monthlyAvg = annualTotal / 12;
      const dailyAvg = annualTotal / 365;

      const chartData = MONTH_LABELS.map((m, i) => ({
         month: m,
         geracao: Math.round(monthlyGen[i]),
         consumo: Math.round(data.monthlyConsumption[i]),
         hsp: hspMonthly[i]
      }));

      return {
         monthlyGen,
         annualTotal,
         monthlyAvg,
         dailyAvg,
         chartData
      };
   }, [analysisResult, data.systemSize, data.monthlyConsumption]);

   const handleApply = () => {
      if (metrics && analysisResult) {
         const avgHsp = analysisResult.hsp_monthly.reduce((a: number, b: number) => a + b, 0) / 12;

         const updatedData: ProposalData = {
            ...data,
            monthlyGeneration: metrics.monthlyGen,
            irradiationLocal: avgHsp,
            irradiationSource: analysisResult.irradiation_source || "NASA POWER",
            avgMonthlyGeneration: metrics.monthlyAvg,
            chartData: metrics.chartData.map(d => ({
               month: d.month,
               consumption: d.consumo,
               generation: d.geracao
            }))
         };

         onConfirm(updatedData);
      } else {
         onConfirm(data);
      }
   };

   if (loading || (isPreloading && !analysisResult)) {
      return (
         <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-20 flex flex-col items-center justify-center text-center space-y-8">
            <div className="relative flex items-center justify-center">
               <div className="absolute w-32 h-32 bg-neonorte-purple/10 rounded-full animate-ping"></div>
               <Loader2 size={80} className="text-neonorte-purple animate-spin" />
               <Sun size={32} className="absolute text-neonorte-green" />
            </div>
            <div className="space-y-2">
               <h2 className="text-3xl font-black text-neonorte-darkPurple uppercase tracking-tighter font-display">Sincronização Meteorológica</h2>
               <p className="text-slate-500 font-medium">Cruzando coordenadas com bases globais de irradiação solar...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-700 pb-20">

         <div className="bg-neonorte-deepPurple rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5 neonorte-overlay">
            <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] pointer-events-none rotate-12">
               <Sun size={400} />
            </div>

            <div className="relative z-10 space-y-10">
               <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                     <div className="bg-gradient-to-br from-neonorte-green to-neonorte-darkGreen p-3 rounded-2xl shadow-lg shadow-neonorte-green/20">
                        <Activity size={28} />
                     </div>
                     <div>
                        <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-1 font-display">Engenharia de Performance</h2>
                        <p className="text-white/50 text-xs font-bold uppercase tracking-[0.2em]">Análise Dinâmica do Potencial Fotovoltaico</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
                     <MapPin size={20} className="text-neonorte-green" />
                     <div className="text-left">
                        <p className="text-[10px] font-black text-white/30 uppercase">Local de Instalação</p>
                        <p className="text-sm font-bold text-white leading-none">{analysisResult?.location_name || data.city}, {data.state}</p>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
                  {[
                     { label: 'Geração Anual', value: metrics?.annualTotal, unit: 'kWh', icon: TrendingUp, color: 'text-neonorte-green', sub: 'Total Projetado' },
                     { label: 'Média Mensal', value: metrics?.monthlyAvg, unit: 'kWh', icon: Calendar, color: 'text-white', sub: 'Auto-suficiência' },
                     { label: 'Média Diária', value: metrics?.dailyAvg, unit: 'kWh', icon: Clock, color: 'text-white', sub: 'Produção Diária' },
                     { label: 'HSP Médio', value: (analysisResult?.hsp_monthly.reduce((a: number, b: number) => a + b, 0) / 12), unit: 'kWh/m²', icon: Sun, color: 'text-neonorte-green-light', sub: 'Eficiência Solar' }
                  ].map((m, i) => (
                     <div key={i} className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl hover:bg-white/[0.05] transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                           <m.icon size={20} className={m.color} />
                           <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{m.label}</span>
                        </div>
                        <p className={`text-3xl font-black ${m.color}`}>
                           {m.value?.toLocaleString('pt-BR', { maximumFractionDigits: i === 3 ? 2 : 0 })}
                           <span className="text-xs font-medium ml-1 opacity-60">{m.unit}</span>
                        </p>
                        <div className="mt-2 h-1 w-8 bg-neonorte-green/30 rounded-full group-hover:w-12 transition-all"></div>
                     </div>
                  ))}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-8">
                     <div className="bg-white rounded-[2rem] p-8 shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                           <div className="flex items-center gap-2">
                              <Sun size={20} className="text-neonorte-green" />
                              <h4 className="text-sm font-black text-neonorte-darkPurple uppercase tracking-tight font-display">Curva de Irradiação Anual (HSP)</h4>
                           </div>
                           <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-3 py-1 rounded-full font-mono">{analysisResult?.irradiation_source}</span>
                        </div>
                        <div className="h-[280px] w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={metrics?.chartData}>
                                 <defs>
                                    <linearGradient id="colorHsp" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#05CD46" stopOpacity={0.4} />
                                       <stop offset="95%" stopColor="#05CD46" stopOpacity={0} />
                                    </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                 <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} dy={10} />
                                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                 <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', fontFamily: 'Consolas, monospace' }} />
                                 <Area type="monotone" dataKey="hsp" name="HSP" stroke="#05CD46" strokeWidth={4} fillOpacity={1} fill="url(#colorHsp)" animationDuration={1000} />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     <div className="bg-white rounded-[2rem] p-8 shadow-2xl">
                        <div className="flex items-center gap-2 mb-6">
                           <TableIcon size={20} className="text-neonorte-purple" />
                           <h4 className="text-sm font-black text-neonorte-darkPurple uppercase tracking-tight font-display">Irradiação Mensal (HSP)</h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 font-mono">
                           {metrics?.chartData.map((d, i) => (
                              <div key={i} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-center hover:bg-neonorte-purple hover:text-white transition-all">
                                 <p className="text-[10px] font-black uppercase mb-1">{d.month}</p>
                                 <p className="text-base font-black">{d.hsp.toFixed(2)}</p>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="bg-white rounded-[2rem] p-8 shadow-2xl h-fit">
                     <div className="flex items-center gap-2 mb-8">
                        <BarChart3 size={20} className="text-neonorte-purple" />
                        <h4 className="text-sm font-black text-neonorte-darkPurple uppercase tracking-tight font-display">Equilíbrio Energético (kWh)</h4>
                     </div>
                     <div className="h-[280px] w-full mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={metrics?.chartData} barGap={8}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                              <Tooltip cursor={{ fill: '#f8fafc', radius: 8 }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                              <Bar dataKey="geracao" name="Geração" fill="#05CD46" radius={[6, 6, 0, 0]} />
                              <Bar dataKey="consumo" name="Consumo" fill="#64147D" opacity={0.3} radius={[6, 6, 0, 0]} />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>

                     <div className="space-y-4 font-mono">
                        <div className="flex items-center justify-between p-4 bg-neonorte-green/10 rounded-2xl border border-neonorte-green/20">
                           <div className="flex items-center gap-3">
                              <div className="bg-neonorte-green p-2 rounded-xl text-white"><Zap size={16} /></div>
                              <div>
                                 <p className="text-[10px] font-black text-neonorte-darkGreen uppercase leading-none">Pico de Geração</p>
                                 <p className="text-sm font-bold text-neonorte-darkPurple">{MONTH_LABELS[analysisResult?.hsp_monthly.indexOf(Math.max(...analysisResult?.hsp_monthly))]}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-lg font-black text-neonorte-darkPurple">{metrics ? Math.max(...metrics.monthlyGen).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '-'} <span className="text-xs">kWh</span></p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {error && <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl text-xs text-red-200 text-center font-bold">{error}</div>}

               <div className="flex items-center justify-between pt-12 border-t border-white/10">
                  <button type="button" onClick={onBack} className="group flex items-center gap-4 text-white/50 hover:text-white transition-all px-10 py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest">
                     <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Voltar
                  </button>

                  <button onClick={handleApply} className="group relative overflow-hidden bg-neonorte-green hover:bg-neonorte-lightGreen text-neonorte-deepPurple font-black py-6 px-16 rounded-[2rem] shadow-xl shadow-neonorte-green/20 transition-all active:scale-95 flex items-center gap-6">
                     <span className="tracking-[0.2em] uppercase text-lg font-display">Gerar Proposta Final</span>
                     <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};
