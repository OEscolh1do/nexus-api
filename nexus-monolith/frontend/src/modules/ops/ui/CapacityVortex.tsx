import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, ShieldCheck } from 'lucide-react';
import { api } from '../../../lib/api';

interface HeatmapData {
    name: string;
    RealData: number;
    Preditivo: number;
    CapacityLimit: number;
    isBottleneck: boolean;
    isWarning: boolean;
}

export function CapacityVortex() {
    const [data, setData] = useState<HeatmapData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPredictiveData = async () => {
            try {
                // Rota C-Level desenvolvida na Fase 3
                const response = await api.get('/bi/capacity');
                if (response.data?.success) {
                    setData(response.data.data);
                }
            } catch (err: any) {
                console.error("No access or failed to fetch C-Level Capacity Vortex", err);
                setError("O Serviço Preditivo está indisponível ou sobrecarregado. Tente novamente em instantes.");
            } finally {
                setLoading(false);
            }
        };

        fetchPredictiveData();
    }, []);

    // Calcula os piores meses para plotar alertas em texto dinâmico
    const bottlenecks = data.filter(d => d.isBottleneck);
    const warnings = data.filter(d => d.isWarning);

    if (loading) return <div className="animate-pulse bg-slate-800/50 h-96 w-full rounded-2xl border border-slate-700"></div>;

    if (error) {
        return (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-red-900/50 shadow-2xl rounded-3xl p-6 lg:p-8 h-96 flex items-center justify-center text-center transition-all duration-500">
                <div className="text-red-400">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-80" />
                    <h3 className="text-xl font-bold mb-2">Falha no Vórtex Analítico</h3>
                    <p className="text-sm max-w-md mx-auto">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-3xl p-6 lg:p-8 hover:border-blue-500/30 transition-all duration-500">
            {/* Cabecalho Estratégico */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-blue-400" />
                        Vórtex de Alocação (Capacity Planning)
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Predição de Engarrafamento Operacional: CRM vs Mão-de-Obra</p>
                </div>

                {/* Aletas de Risco Latente */}
                <div className="flex flex-wrap gap-3">
                    {bottlenecks.length > 0 ? (
                        <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400">
                            <AlertTriangle className="w-5 h-5 animate-pulse" />
                            <span className="text-sm font-semibold">Colapso Logístico no(s) Q: {bottlenecks.map(b => b.name).join(', ')}</span>
                        </div>
                    ) : warnings.length > 0 ? (
                        <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-amber-400">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="text-sm font-semibold">Tensão Prevista para {warnings[0].name}</span>
                        </div>
                    ) : (
                        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-400">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="text-sm font-semibold">Cenário Futuro Seguro</span>
                        </div>
                    )}
                </div>
            </div>

            {/* O Gráfico Heatmap (Empilhado) */}
            <div className="h-80 w-full mb-6 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />

                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
                            formatter={(value: any, name: any) => [value + ' Tarefas Est.', name === 'RealData' ? 'Baseline Gantt' : 'Prospecção Oculta (CRM)']}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', color: '#cbd5e1' }} />

                        {/* Área 1: Demanda Real Planejada */}
                        <Area type="monotone" dataKey="RealData" name="Gantt Oficial" stackId="1" stroke="#3b82f6" strokeWidth={3} fill="url(#colorReal)" />

                        {/* Área 2: O peso do CRM (Demanda Preditiva) empilhada */}
                        <Area type="monotone" dataKey="Preditivo" name="Volume Latente no CRM" stackId="1" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorPred)" />

                        {/* A Linha Vermelha de Teto Máximo */}
                        {data.length > 0 && (
                            <ReferenceLine y={data[0].CapacityLimit} label={{ position: 'top', value: 'Teto de Engenheiros', fill: '#ef4444', fontSize: 12, fontWeight: 700 }} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={2} />
                        )}
                    </AreaChart>
                </ResponsiveContainer>

                {data.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-xl">
                        <p className="text-slate-400 font-medium tracking-wide">Privilégio Insuficiente para Análise C-Level.</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                    <h4 className="text-slate-300 text-sm font-semibold mb-1">Como ler o Vórtex?</h4>
                    <p className="text-slate-500 text-xs">A cor azul representa as tarefas do Gantt que a Engenharia já agendou. A área roxa pega os contratos quase fechados na tela do time de vendas e converte estatisticamente no esforço que eles vão cobrar amanhã, antecipando dores meses antes.</p>
                </div>
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                    <h4 className="text-slate-300 text-sm font-semibold mb-1">Engarrafamento Matemático</h4>
                    <p className="text-slate-500 text-xs">Se o montante azul + roxo cruzar a linha pontilhada vermelha (Workload per capta da filial), sua empresa quebrará contrato de entrega ou as margens desabarão com horas-extras de sobressalto.</p>
                </div>
            </div>
        </div>
    );
}

export default CapacityVortex;
