import React, { useMemo } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../../../store/useTechStore';
import { CRESESB_DB } from '@/data/irradiation/cresesbData';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import { BarChart3, Sun, Zap } from 'lucide-react'; 

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const SimulationCanvasView: React.FC = () => {
  // Store Global Data
  const monthlyConsumption = useSolarStore((state) => state.clientData.invoices[0]?.monthlyHistory || Array(12).fill(state.clientData.averageConsumption || 0));
  const hsp = useSolarStore((state) => state.clientData.monthlyIrradiation || Array(12).fill(0));
  const irradiationCity = useSolarStore((state) => state.clientData.irradiationCity);
  
  // Handlers
  const updateMonthlyConsumption = useSolarStore((state) => state.updateMonthlyConsumption);
  const setIrradiationData = useSolarStore((state) => state.setIrradiationData);
  
  const modules = useSolarStore(selectModules);
  const getPerformanceRatio = useTechStore((state) => state.getPerformanceRatio);

  const prDecimal = getPerformanceRatio();
  const totalPowerKw = modules.reduce((acc, m) => acc + m.power, 0) / 1000;

  // Calculadora de Inteligência (BI Aggregators)
  const dashboardStats = useMemo(() => {
    let sumConsumption = 0;
    let sumGeneration = 0;

    const barData = MONTHS.map((month, index) => {
      const consumoMensal = monthlyConsumption[index] || 0;
      
      const hspValue = hsp[index] || 0;
      // Geração Normativa Mes a Mes = Potência Real DC * HSP Medio * Dias do Mês * Eficiencia Total
      const geracaoEstimada = totalPowerKw * hspValue * DAYS_IN_MONTH[index] * prDecimal;

      sumConsumption += consumoMensal;
      sumGeneration += geracaoEstimada;

      return {
        month,
        "Consumo (kWh)": consumoMensal,
        "Geração (kWh)": geracaoEstimada
      };
    });

    const netBalance = sumGeneration - sumConsumption;
    const coveragePercentage = sumConsumption > 0 ? (sumGeneration / sumConsumption) * 100 : 0;

    // Capping Cobertura a max 150% pro gráfico de rosca pra nao estourar loop.
    const radialData = [{
      name: 'Cobertura',
      value: Math.min(coveragePercentage, 150),
      fill: coveragePercentage >= 100 ? '#10b981' : '#f43f5e'
    }];

    return { 
      barData, 
      radialData,
      totalConsumption: sumConsumption, 
      totalGeneration: sumGeneration, 
      netBalance, 
      coveragePercentage 
    };
  }, [monthlyConsumption, hsp, prDecimal, totalPowerKw]);

  // UI Helpers
  const isPositiveBalance = dashboardStats.netBalance >= 0;

  return (
    <div className="w-full min-h-full p-6 md:p-10 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <BarChart3 size={24} className="text-indigo-400" />
              </div>
              <h1 className="text-3xl font-black text-slate-100 tracking-tight">Dashboard de Geração</h1>
            </div>
            <p className="text-slate-500 font-medium max-w-xl">
              Comparativo paramétrico de geração projetada contra fatura histórica atual.
            </p>
          </div>
        </header>

        {/* TOP ROW: KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          {/* Card Consumo */}
          <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col justify-center">
            <span className="text-xs font-bold text-emerald-500/70 uppercase tracking-widest mb-2">Total Consolidado (Base)</span>
            <span className="text-3xl font-black text-emerald-400">
               {Math.round(dashboardStats.totalConsumption).toLocaleString('pt-BR')} <span className="text-base text-emerald-600 font-bold">kWh/ano</span>
            </span>
          </div>

          {/* Card Geração */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Energia Estimada Produzida</span>
            <span className="text-3xl font-black text-slate-300">
               {Math.round(dashboardStats.totalGeneration).toLocaleString('pt-BR')} <span className="text-base text-slate-500 font-bold">kWh/ano</span>
            </span>
          </div>

          {/* Card Balanço Líquido */}
          <div className={`p-6 rounded-2xl border flex flex-col justify-center ${isPositiveBalance ? 'bg-teal-950/20 border-teal-500/30' : 'bg-rose-950/20 border-rose-500/20'}`}>
            <span className={`text-xs font-bold uppercase tracking-widest mb-2 ${isPositiveBalance ? 'text-teal-500/70' : 'text-rose-500/70'}`}>
              Balanço Físico (Sobra/Falta)
            </span>
            <span className={`text-3xl font-black ${isPositiveBalance ? 'text-teal-400' : 'text-rose-400'}`}>
               {isPositiveBalance ? '+' : ''}{Math.round(dashboardStats.netBalance).toLocaleString('pt-BR')} <span className="text-base opacity-70 font-bold">kWh/ano</span>
            </span>
          </div>

        </div>

        {/* MIDDLE ROW: CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart (BarCharts Lado-a-Lado) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col h-[400px]">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Matriz Mensal: Consumo vs Geração</h3>
             
             <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={dashboardStats.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                   <XAxis dataKey="month" stroke="#475569" tick={{ fill: '#64748b', fontSize: 12, fontWeight: '600' }} axisLine={false} tickLine={false} />
                   <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                     itemStyle={{ fontWeight: 'bold' }}
                     cursor={{ fill: '#1e293b', opacity: 0.4 }}
                   />
                   <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', paddingTop: '10px' }} />
                   
                   {/* Barras Gêmeas - Invertido conforme solicitação */}
                   <Bar dataKey="Consumo (kWh)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                   <Bar dataKey="Geração (kWh)" fill="#475569" radius={[4, 4, 0, 0]} maxBarSize={45} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>

          {/* Secondary Chart (Radial Donut) */}
          <div className="col-span-1 p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-[400px] items-center text-center relative shadow-xl">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 w-full text-left">Índice de Cobertura</h3>
             
             <div className="flex-1 w-full max-w-[250px] relative mt-4">
               <ResponsiveContainer width="100%" height="100%">
                 <RadialBarChart 
                   cx="50%" 
                   cy="50%" 
                   innerRadius="70%" 
                   outerRadius="100%" 
                   barSize={20} 
                   data={dashboardStats.radialData}
                   startAngle={180}
                   endAngle={-180}
                 >
                   {/* Background track circle */}
                   <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                   <RadialBar
                     background={{ fill: '#1e293b' }}
                     dataKey="value"
                     cornerRadius={10}
                   />
                 </RadialBarChart>
               </ResponsiveContainer>

               {/* Absolute Center Text Inside Donut */}
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className={`text-4xl font-black ${dashboardStats.coveragePercentage >= 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
                   {Math.round(dashboardStats.coveragePercentage)}<span className="text-xl">%</span>
                 </span>
                 <span className="text-xs font-bold text-slate-500 mt-1 uppercase">Taxa Alvo</span>
               </div>
             </div>

             <div className="mt-6 w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-left">
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {dashboardStats.coveragePercentage >= 100 
                    ? "Inversão ideal alcançada. A usina suprirá todo o ano passivo injetando créditos à rede compensadora." 
                    : "Atenção: A potência especificada não cobrirá o passivo total 12-meses. Sistema em subdimensionamento em relação ao consumo base."}
                </p>
             </div>
          </div>

        </div>

        {/* BOTTOM ROW: EDITORES DE MATRIZ DE GERAÇÃO E CONSUMO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          
          {/* Painel de Consumo Elétrico */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
             <div className="flex items-center gap-2 mb-6">
               <Zap className="text-amber-400" size={16} />
               <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Matriz de Consumo (kWh)</h3>
             </div>
             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
               {MONTHS.map((month, idx) => (
                 <div key={`cons-${month}`} className="flex flex-col gap-1.5 focus-within:text-amber-400 text-slate-500 transition-colors">
                    <label className="text-[10px] font-bold uppercase text-inherit">{month}</label>
                    <input 
                      type="number"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 focus:outline-none transition-all placeholder:text-slate-700"
                      value={monthlyConsumption[idx] || 0}
                      onChange={(e) => {
                         const val = parseFloat(e.target.value);
                         if (!isNaN(val) && val >= 0) {
                           updateMonthlyConsumption(idx, val);
                         }
                      }}
                    />
                 </div>
               ))}
             </div>
          </div>

          {/* Painel de Radiação (HSP) CRESESB */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
             <div className="flex items-center gap-2 mb-4">
               <Sun className="text-yellow-400" size={16} />
               <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Irradiação (HSP / CRESESB)</h3>
             </div>
             
             <div className="mb-6">
               <select
                 className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs font-bold text-slate-300 outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition-all cursor-pointer"
                 value={irradiationCity || ''}
                 onChange={(e) => {
                   const key = e.target.value;
                   if (CRESESB_DB[key]) {
                     setIrradiationData(CRESESB_DB[key].hsp_monthly, key);
                   }
                 }}
               >
                 <option value="" disabled>Selecione a Estação CRESESB Base da Cidade...</option>
                 {Object.keys(CRESESB_DB).map(city => (
                   <option key={city} value={city}>{city}</option>
                 ))}
               </select>
             </div>

             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
               {MONTHS.map((month, idx) => (
                 <div key={`hsp-${month}`} className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">{month}</label>
                    <div className="w-full bg-slate-950/50 border border-slate-800/80 border-dashed rounded px-2 py-1.5 text-xs font-mono text-yellow-500/90 text-center tracking-tight">
                      {hsp[idx] ? hsp[idx].toFixed(2) : '0.00'}
                    </div>
                 </div>
               ))}
             </div>
          </div>

        </div>

      </div>
    </div>
  );
};
