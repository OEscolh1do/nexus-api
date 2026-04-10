import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Plus, Trash2, BatteryCharging,
  Zap, Target, Info
} from 'lucide-react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useSolarStore } from '@/core/state/solarStore';
import { useTechStore } from '../../../store/useTechStore';

// Tipagem da sandbox transiente
interface VirtualLoad {
  id: string;
  name: string;
  kwH_per_month: number;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const SimulationCanvasView: React.FC = () => {
  // Global Data
  const monthlyConsumption = useSolarStore((state) => state.clientData.invoices[0]?.monthlyHistory || Array(12).fill(state.clientData.averageConsumption || 0));
  const hsp = useSolarStore((state) => state.clientData.monthlyIrradiation || Array(12).fill(0));
  const getPerformanceRatio = useTechStore((state) => state.getPerformanceRatio);

  // Local Sandbox State for Virtual Loads
  const [virtualLoads, setVirtualLoads] = useState<VirtualLoad[]>([]);
  const [newLoadName, setNewLoadName] = useState('');
  const [newLoadKwh, setNewLoadKwh] = useState<number | ''>('');

  const prDecimal = getPerformanceRatio();
  const P_NOMINAL = 5.0; // Placeholder kWp: Em um backend full isso viria da soma real dos módulos. Usei 5kWp hardcoded simulado.

  // Calculo de somas
  const totalVirtualKwH = virtualLoads.reduce((sum, load) => sum + load.kwH_per_month, 0);

  // Dataset generation for Recharts
  const chartData = useMemo(() => {
    return MONTHS.map((month, index) => {
      const baseConsumption = monthlyConsumption[index] || 0;
      
      // Geração = P_nom * HSP(mes) * DiasNoMes * PR
      // Assumindo 30 dias médios
      const hspValue = hsp[index] || 0;
      const estimatedGeneration = P_NOMINAL * hspValue * 30 * prDecimal;

      return {
        name: month,
        "Consumo Real": baseConsumption,
        "Nova Carga Simulada": totalVirtualKwH,
        "Geração Estimada": estimatedGeneration
      };
    });
  }, [monthlyConsumption, hsp, prDecimal, totalVirtualKwH]);

  // Ações do Sandbox
  const handleAddLoad = () => {
    if (!newLoadName.trim() || newLoadKwh === '' || newLoadKwh <= 0) return;
    setVirtualLoads([
      ...virtualLoads, 
      { id: Date.now().toString(), name: newLoadName, kwH_per_month: Number(newLoadKwh) }
    ]);
    setNewLoadName('');
    setNewLoadKwh('');
  };

  const handleRemoveLoad = (id: string) => {
    setVirtualLoads(virtualLoads.filter(l => l.id !== id));
  };


  return (
    <div className="w-full h-full p-6 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
                <BarChart3 size={24} className="text-teal-400" />
              </div>
              <h1 className="text-3xl font-black text-slate-100 tracking-tight">Motor Analítico de Simulação</h1>
            </div>
            <p className="text-slate-500 font-medium max-w-xl">
              Cenários de dimensionamento preditivo. Análise de cobertura técnica isolada de faturamentos contábeis.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="px-4 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-bold flex items-center gap-2">
              <Target size={16} /> Sandbox Transiente: Ativo
            </div>
          </div>
        </header>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ==========================================================
              COLUNA 1: LOAD SIMULATOR (CARRINHO DE CARGAS ESTÁTICAS)
              ========================================================== */}
          <div className="col-span-1 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-6 shadow-xl flex flex-col h-full shrink-0">
               <div className="flex items-center gap-3 mb-6">
                <BatteryCharging size={18} className="text-amber-400" />
                <h3 className="text-lg font-bold text-slate-200">Load Simulator</h3>
              </div>
              
              <p className="text-sm text-slate-400 mb-6 font-medium">
                Adicione cargas futuras estimadas à planilha do cliente (ex: carro elétrico, nova geladeira) sem contaminar permanentemente os dados do medidor local.
              </p>

              {/* Formulário de Adição */}
              <div className="space-y-3 mb-6 p-4 rounded-xl border border-slate-800 bg-slate-950">
                <div className="flex flex-col gap-1.5 focus-within:text-teal-400 text-slate-400">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-inherit">Descrição da Carga</label>
                  <input 
                    type="text" value={newLoadName} onChange={(e) => setNewLoadName(e.target.value)}
                    placeholder="Ex: Ar Condicionado 12k BTU"
                    className="bg-transparent border-b border-slate-800 hover:border-slate-700 focus:border-teal-500 focus:outline-none text-sm font-medium text-slate-200 transition-colors pb-1"
                  />
                </div>
                <div className="flex flex-col gap-1.5 focus-within:text-teal-400 text-slate-400">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-inherit">Consumo Adicional (kWh/mês)</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" value={newLoadKwh} onChange={(e) => setNewLoadKwh(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 120"
                      className="bg-transparent border-b border-slate-800 hover:border-slate-700 focus:border-teal-500 focus:outline-none text-sm font-medium text-slate-200 transition-colors pb-1 w-full"
                    />
                    <button 
                      onClick={handleAddLoad}
                      disabled={!newLoadName.trim() || newLoadKwh === '' || newLoadKwh <= 0}
                      className="p-1.5 rounded-md bg-teal-500/20 text-teal-400 border border-teal-500/50 hover:bg-teal-500 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:pointer-events-none shrink-0"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista Transiente */}
              <div className="flex-1 space-y-2 overflow-y-auto min-h-[100px]">
                {virtualLoads.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-lg p-4">
                     <span className="text-xs font-bold uppercase tracking-widest text-center mt-2">Nenhuma Carga Extra</span>
                  </div>
                ) : (
                  virtualLoads.map((load) => (
                    <div key={load.id} className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/10">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-300">{load.name}</span>
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">+{load.kwH_per_month} kWh/mês</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveLoad(load.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>


          {/* ==========================================================
              COLUNA 2 & 3: RECHARTS CANVAS (PERFORMANCE GRID)
              ========================================================== */}
           <div className="col-span-1 lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-6 shadow-xl flex flex-col h-[500px]">
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Zap size={18} className="text-emerald-400" />
                  <h3 className="text-lg font-bold text-slate-200">Sobrevivência Dinâmica Anual</h3>
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-4 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                   <div className="flex items-center gap-2 px-2 border-r border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Pot. Nominal</span>
                    <span className="text-sm font-black text-slate-300 font-mono">{P_NOMINAL.toFixed(1)} kWp</span>
                  </div>
                  <div className="flex items-center gap-2 pr-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">PR Tático</span>
                    <span className="text-sm font-black text-indigo-400 font-mono">{(prDecimal * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

               <p className="text-sm font-medium text-slate-400 pb-4">
                 Gráfico mesclado empilhando dados contabilizados (Conta Domiciliar Média) com o stress de consumo (Sandbox) para forçar rupturas na capacidade fotovoltaica gerada (Threshold Verde).
              </p>

              {/* RECHARTS COMPONENT */}
              <div className="flex-1 w-full min-h-[250px] min-w-0" style={{ containerType: 'inline-size' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 0, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#475569" 
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#475569" 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      itemStyle={{ fontWeight: 'bold' }}
                      cursor={{ fill: '#1e293b', opacity: 0.4 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1' }} />
                    
                    {/* Barra de Consumo Empilhada (Stacked) */}
                    <Bar dataKey="Consumo Real" stackId="a" fill="#475569" radius={[0, 0, 4, 4]} maxBarSize={40} />
                    <Bar dataKey="Nova Carga Simulada" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    
                    {/* Linha/Barra de Geração (Trend de Cobertura) */}
                    <Line 
                      type="monotone" 
                      dataKey="Geração Estimada" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ r: 4, strokeWidth: 2, fill: '#0f172a' }} 
                      activeDot={{ r: 6, fill: '#10b981' }} 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

               <div className="mt-4 pt-4 border-t border-slate-800 flex items-start gap-2">
                <Info size={14} className="text-slate-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 font-medium">
                  A Geração Estimada utiliza valor genérico padrão de Topologia. O algoritmo definitivo exige conexão com Módulos Reais instanciados pela loja e fatores de *mismatch* angulares de rastreadores para atingir precisão forense.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
