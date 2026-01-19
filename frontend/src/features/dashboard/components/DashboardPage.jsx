// /frontend/src/features/dashboard/components/DashboardPage.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  LayoutDashboard, TrendingUp, DollarSign, Users, Activity, 
  Calendar, Target, ArrowUpRight, Briefcase, HardHat 
} from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore'; // <--- 1. IMPORTAÇÃO NECESSÁRIA


const COLORS = ['#64147D', '#874BBE', '#9F54D4', '#B76BE6', '#D8B4FE', '#05CD46'];
const PRAZO_MEDIO_OBRA = 30; 

const STATUS_MAP_DISPLAY = {
  'CONTACT': 'Qualificação', 'PROPOSAL': 'Proposta', 'BUDGET': 'Negociação',
  'WAITING': 'Aprovação', 'APPROVED': 'Venda', 'REJECTED': 'Arquivado',
  'READY': 'Fila Obra', 'EXECUTION': 'Execução', 'REVIEW': 'Vistoria', 'DONE': 'Concluído',
  'LEAD': 'Lead', 'VISIT': 'Visita'
};

const STAGE_ORDER = [
  'CONTACT', 'PROPOSAL', 'BUDGET', 'WAITING', 'APPROVED', 'REJECTED', 
  'READY', 'EXECUTION', 'REVIEW', 'DONE'
];

function DashboardPage() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState('commercial'); 

  // 2. DEFINIÇÃO DA FUNÇÃO (Deve vir ANTES do useEffect)
  const fetchAndCalculateMetrics = useCallback(async () => {
    try {
      // 4. ENVIA O TOKEN NO HEADER (IMPÍCITO NO AXIOS CONFIG)
      const res = await api.get('/projects');
      setMetrics(calculateMetrics(res.data));
    } catch (error) { 
        console.error("Erro dashboard:", error); 
    } finally { 
        setLoading(false); 
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchAndCalculateMetrics();
  }, [isAuthenticated, fetchAndCalculateMetrics]);

  // Move calculateMetrics and helper outside to avoid dependency issues


  // --- RENDERIZAÇÃO ---
  if (loading) return <div className="p-8 text-neo-text-sec text-xs animate-pulse">Carregando painel...</div>;
  if (!metrics) return <div className="p-8 text-neo-text-sec text-xs">Sem dados disponíveis (Verifique sua conexão).</div>;

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(val);
  const getDisplayName = (key) => STATUS_MAP_DISPLAY[key] || key;
  const getCellColor = (entry, index) => {
    if (['APPROVED', 'DONE', 'READY', 'EXECUTION'].includes(entry.name)) return '#05CD46'; // Verde Neo
    if (entry.name === 'PROPOSAL') return '#ec4899'; // Rosa
    return COLORS[index % COLORS.length];
  };

  const activePieData = metrics.funnelData.filter(d => 
    chartTab === 'commercial' 
      ? ['CONTACT', 'PROPOSAL', 'BUDGET', 'WAITING', 'APPROVED', 'REJECTED'].includes(d.name)
      : ['READY', 'EXECUTION', 'REVIEW', 'DONE'].includes(d.name)
  );

  return (
    <div className="p-6 bg-neo-bg-main min-h-screen text-neo-white pb-20 font-sans">
      <div className="flex items-center justify-between mb-6 border-b border-neo-surface-2 pb-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-neo-surface-2 rounded-lg text-neo-green-main"><LayoutDashboard size={20} /></div>
            <div><h1 className="text-xl font-bold leading-tight">Visão Geral</h1><p className="text-[11px] text-neo-text-sec">Métricas em tempo real</p></div>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <MiniKpi label="Oportunidades" value={metrics.kpis.totalProjects} sub="Total Cadastrado" icon={<Users size={16} />} color="text-neo-purple-light" />
        <MiniKpi label="Pipeline Aberto" value={formatCurrency(metrics.kpis.pipelineValue)} sub="Em negociação" icon={<Target size={16} />} color="text-blue-400" />
        <MiniKpi label="Vendas Totais" value={formatCurrency(metrics.kpis.closedValue)} sub={`${metrics.kpis.closedCount} contratos`} icon={<DollarSign size={16} />} color="text-neo-green-main" />
        <MiniKpi label="Conversão" value={`${metrics.kpis.conversionRate}%`} sub="Taxa Global" icon={<ArrowUpRight size={16} />} color="text-orange-400" />
        <MiniKpi label="Lead Time" value={`${metrics.kpis.avgLeadTime} dias`} sub="Ciclo Médio" icon={<Activity size={16} />} color="text-pink-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* GRÁFICO DE BARRAS (VOLUME FINANCEIRO) */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-neo-surface-1 p-5 rounded-xl border border-neo-surface-2 shadow-sm">
                <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold flex items-center gap-2"><TrendingUp size={16} className="text-neo-purple-main"/> Volume por Etapa</h3></div>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.funnelData.filter(d => d.revenue > 0)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 10}} tickFormatter={getDisplayName} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 10}} tickFormatter={(val) => `R$${val/1000}k`} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1E0528', borderColor: '#4A125E', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} formatter={(val) => formatCurrency(val)} labelFormatter={getDisplayName} />
                            <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={40}>
                                {metrics.funnelData.map((entry, index) => <Cell key={`cell-${index}`} fill={getCellColor(entry, index)} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            {/* GANTT SIMPLIFICADO (OBRAS EM ANDAMENTO) */}
            <div className="bg-neo-surface-1 rounded-xl border border-neo-surface-2 shadow-sm p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-white"><Calendar size={16} className="text-orange-400"/> Cronograma de Obras Ativas</h3>
                    <span className="text-[10px] text-neo-text-sec bg-neo-surface-2 px-2 py-1 rounded">Ref: {PRAZO_MEDIO_OBRA} dias</span>
                </div>
                <div className="space-y-4 overflow-y-auto max-h-[200px] custom-scrollbar pr-2">
                    {metrics.activeConstructions.length === 0 && <div className="text-center py-6 text-neo-text-sec text-xs italic opacity-60">Nenhuma obra em execução no momento.</div>}
                    {metrics.activeConstructions.map(proj => {
                        const progress = Math.min(100, ((proj.daysRunning + 1) / PRAZO_MEDIO_OBRA) * 100);
                        const isLate = proj.daysRunning > PRAZO_MEDIO_OBRA;
                        return (
                            <div key={proj.id} className="group">
                                <div className="flex justify-between text-[11px] mb-1.5">
                                    <span className="font-bold text-neo-white">{proj.client?.name || "Sem Cliente"} <span className="text-neo-text-sec font-normal">- {proj.title}</span></span>
                                    <span className={`font-mono ${isLate ? 'text-red-400' : 'text-neo-text-sec'}`}>Dia {proj.daysRunning} <span className="opacity-50">/ {PRAZO_MEDIO_OBRA}</span></span>
                                </div>
                                <div className="w-full bg-neo-bg-main rounded-full h-1.5 relative overflow-hidden border border-neo-surface-2">
                                    <div className={`h-full rounded-full transition-all duration-500 relative ${isLate ? 'bg-red-500' : 'bg-orange-400'}`} style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>

        {/* GRÁFICO DE PIZZA (DISTRIBUIÇÃO) */}
        <div className="space-y-6">
            <div className="bg-neo-surface-1 p-5 rounded-xl border border-neo-surface-2 shadow-sm h-[360px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold">Distribuição</h3>
                    <div className="flex bg-neo-bg-main p-1 rounded-lg border border-neo-surface-2">
                        <button onClick={() => setChartTab('commercial')} className={`px-3 py-1 text-[10px] rounded-md transition-all flex items-center gap-1.5 ${chartTab === 'commercial' ? 'bg-neo-purple-main text-white shadow-sm' : 'text-neo-text-sec hover:text-white'}`}><Briefcase size={10} /> Com.</button>
                        <button onClick={() => setChartTab('engineering')} className={`px-3 py-1 text-[10px] rounded-md transition-all flex items-center gap-1.5 ${chartTab === 'engineering' ? 'bg-neo-purple-main text-white shadow-sm' : 'text-neo-text-sec hover:text-white'}`}><HardHat size={10} /> Eng.</button>
                    </div>
                </div>
                <div className="flex-1 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={activePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                {activePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={getCellColor(entry, index)} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1E0528', borderRadius: '8px', fontSize: '12px', border: '1px solid #4A125E' }} itemStyle={{color:'#fff'}} formatter={(value, name) => [value, getDisplayName(name)]} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} formatter={getDisplayName} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// --- FUNÇÕES DE CÁLCULO (MOVIDAS PARA FORA) ---
const getCalendarDaysDiff = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const calculateMetrics = (projects) => {
  console.log('Calculate Metrics Input:', projects);
  if (!Array.isArray(projects)) {
      console.error('Expected array, got:', typeof projects);
      projects = [];
  }
  const funnelMap = {};
  STAGE_ORDER.forEach(key => funnelMap[key] = { name: key, value: 0, revenue: 0 });

  let totalProjects = 0, pipelineValue = 0, closedValue = 0, closedCount = 0;
  const activeConstructions = [];
  let leadTimes = [];
  const now = new Date();

  projects.forEach(p => {
      totalProjects++;
      // Normaliza status antigos
      let status = p.status === 'LEAD' ? 'CONTACT' : p.status === 'VISIT' ? 'BUDGET' : p.status;
      
      if (!funnelMap[status]) return;

      funnelMap[status].value += 1;
      const valor = Number(p.price || p.value || 0);
      funnelMap[status].revenue += valor;
      
      const lastActivity = p.updatedAt ? new Date(p.updatedAt) : new Date(p.createdAt);
      const createdAt = new Date(p.createdAt);
      const daysDiff = getCalendarDaysDiff(now, lastActivity);

      // Lead Time (Dias entre criação e venda)
      if (['APPROVED', 'DONE'].includes(status)) {
          const cycleDays = getCalendarDaysDiff(createdAt, lastActivity);
          leadTimes.push(cycleDays);
      }

      // Obras Ativas
      if (['EXECUTION', 'REVIEW'].includes(status)) {
          activeConstructions.push({ ...p, startDate: lastActivity, daysRunning: daysDiff });
      }

      // KPIs Financeiros
      if (['APPROVED', 'DONE', 'CLOSED', 'READY', 'EXECUTION', 'REVIEW'].includes(status)) {
          closedValue += valor;
          closedCount++;
      } else if (status !== 'REJECTED') {
          pipelineValue += valor;
      }
  });

  const avgLeadTime = leadTimes.length > 0 ? (leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length).toFixed(0) : 0;

  return {
      kpis: { 
          totalProjects, pipelineValue, closedValue, closedCount, 
          conversionRate: totalProjects > 0 ? ((closedCount / totalProjects) * 100).toFixed(1) : 0, avgLeadTime 
      },
      funnelData: Object.values(funnelMap),
      activeConstructions: activeConstructions.sort((a, b) => b.daysRunning - a.daysRunning)
  };
};

// Componente Auxiliar para KPIs
const MiniKpi = ({ label, value, sub, icon, color }) => (
    <div className="bg-neo-surface-1 p-4 rounded-xl border border-neo-surface-2 shadow-sm hover:border-neo-purple-light transition-colors relative overflow-hidden group">
        <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><div className={color}>{icon}</div></div>
        <div className="flex items-center gap-2 mb-1 text-neo-text-sec"><div className={`p-1.5 rounded-md bg-neo-bg-main border border-neo-surface-2 ${color}`}>{icon}</div><span className="text-[10px] font-bold uppercase tracking-wider">{label}</span></div>
        <div className="mt-2"><h2 className="text-xl font-bold text-neo-white tracking-tight">{value}</h2><p className="text-[10px] text-neo-text-sec opacity-70 mt-0.5">{sub}</p></div>
    </div>
);

export default DashboardPage;