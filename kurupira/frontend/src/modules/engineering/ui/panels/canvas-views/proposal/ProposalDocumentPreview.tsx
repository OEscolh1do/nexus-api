import React, { useMemo } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { calculateProjectionStats } from '@/modules/engineering/utils/projectionMath';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, BarChart, Bar, LineChart, Line
} from 'recharts';
import { MapPin, Zap, Sun, Shield, Calendar, CreditCard } from 'lucide-react';

export const ProposalDocumentPreview: React.FC = () => {
    const clientData    = useSolarStore(s => s.clientData);
    const proposalData  = useSolarStore(s => s.proposalData);
    const modules       = useSolarStore(selectModules);
    const inverters     = useTechStore(s => s.inverters.entities);
    const inverterIds   = useTechStore(s => s.inverters.ids);
    
    const techState     = useTechStore(s => s);
    
    // Cálculos de Projeção
    const stats = useMemo(() => {
        const totalPowerKw = modules.reduce((acc, m) => acc + (m.power * (m.quantity || 1)), 0) / 1000;
        const prDecimal = techState.prCalculationMode === 'additive' 
            ? techState.getAdditivePerformanceRatio() 
            : techState.getPerformanceRatio();

        return calculateProjectionStats({
            totalPowerKw,
            hsp: (clientData.monthlyIrradiation || Array(12).fill(0)) as number[],
            monthlyConsumption: (clientData.invoices?.[0]?.monthlyHistory || Array(12).fill(clientData.averageConsumption)) as number[],
            prDecimal: prDecimal || 0.75,
            tariffRate: clientData.tariffRate || 0.92,
            connectionType: clientData.connectionType,
            cosip: techState.cosip
        });
    }, [modules, clientData, techState]);

    const firstInverter = inverterIds.length > 0 ? inverters[inverterIds[0]] : null;
    const totalPowerKwp = modules.reduce((acc, m) => acc + (m.power * (m.quantity || 1)), 0) / 1000;
    const dateFormatted = new Intl.DateTimeFormat('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
    }).format(new Date());

    return (
        <div className="w-[794px] min-h-[1123px] bg-white text-slate-800 shadow-2xl p-[50px] flex flex-col font-sans relative overflow-hidden">
            
            {/* Header: Logo e Título */}
            <header className="flex justify-between items-start mb-12">
                <div className="flex flex-col gap-1">
                    <h1 className="text-[22px] font-black text-slate-900 tracking-tighter uppercase leading-none">
                        Dimensionamento e Viabilidade do Projeto
                    </h1>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Emitido em {dateFormatted}
                    </span>
                </div>
                {/* Logo Placeholder (Neonorte Color Scheme) */}
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 text-indigo-600">
                        <div className="w-4 h-4 bg-indigo-600 rounded-full" />
                        <span className="text-xl font-black tracking-tighter">NEONORTE</span>
                    </div>
                    <span className="text-[8px] text-slate-400 font-bold tracking-widest mt-1 uppercase">Engenharia Solar</span>
                </div>
            </header>

            {/* Nome do Cliente */}
            <section className="mb-10 border-l-4 border-indigo-600 pl-6 py-2 bg-slate-50">
                <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mb-1 block">Cliente</span>
                <h2 className="text-2xl font-black text-slate-900 uppercase">
                    {clientData.clientName || 'Cliente Final'}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-slate-400">
                    <MapPin size={10} />
                    <span className="text-[10px] font-bold uppercase">
                        {clientData.city || 'Cidade'} / {clientData.state || 'UF'}
                    </span>
                </div>
            </section>

            {/* Cards de Destaque (Template Verde) */}
            <div className="grid grid-cols-2 gap-4 mb-10 h-[100px]">
                <div className="bg-[#2D4A3E] text-white p-6 flex flex-col justify-center rounded-sm shadow-sm relative overflow-hidden group">
                    <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:scale-110 transition-transform">
                         <Sun size={80} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-1">PROJETO</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black tabular-nums">{totalPowerKwp.toFixed(1)}</span>
                        <span className="text-sm font-bold opacity-80 uppercase">kWp</span>
                    </div>
                    <span className="text-[8px] font-medium opacity-50 uppercase mt-1">Potência Nominal do Sistema</span>
                </div>
                
                <div className="bg-[#3A6B52] text-white p-6 flex flex-col justify-center rounded-sm shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-1">GERAÇÃO ESTIMADA</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black tabular-nums">
                            {Math.round(stats.totalGen / 12).toLocaleString('pt-BR')}
                        </span>
                        <span className="text-sm font-bold opacity-80 uppercase">kWh/mês</span>
                    </div>
                    <span className="text-[8px] font-medium opacity-50 uppercase mt-1">Média Mensal de Geração</span>
                </div>
            </div>

            {/* Conteúdo Principal: Descrição e Gráficos */}
            <div className="grid grid-cols-12 gap-8 flex-1">
                
                {/* Coluna Esquerda: Texto e Gráficos de Linha */}
                <div className="col-span-7 flex flex-col gap-10">
                    
                    {/* Apresentação */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">
                             Padrão Neonorte
                        </h3>
                        <p className="text-[11px] leading-relaxed text-slate-600 text-justify italic">
                            "{proposalData.customText || 'O sistema proposto utiliza tecnologia de ponta para maximizar a captação solar e garantir a maior eficiência energética para seu imóvel, seguindo rigorosos padrões de engenharia.'}"
                        </p>
                    </div>

                    {/* Gráfico Histórico de Consumo */}
                    <div className="flex flex-col gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico de Consumo (kWh)</span>
                        <div className="h-[120px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.barData}>
                                    <defs>
                                        <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1A5F8F" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#1A5F8F" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" fontSize={8} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                    <YAxis hide />
                                    <Area type="monotone" dataKey="cons" stroke="#1A5F8F" strokeWidth={2} fillOpacity={1} fill="url(#colorCons)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Gráfico Comparativo: Geração vs Consumo (Linha Dupla) */}
                    <div className="flex flex-col gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Geração × Consumo (Comparativo)</span>
                        <div className="h-[160px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.barData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" fontSize={8} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                    <YAxis fontSize={8} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                    <Line type="monotone" dataKey="gen" stroke="#E87722" strokeWidth={3} dot={{r: 3, fill: '#E87722'}} />
                                    <Line type="monotone" dataKey="cons" stroke="#1A5F8F" strokeWidth={3} dot={{r: 3, fill: '#1A5F8F'}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Coluna Direita: Barras, Métricas e Equipamento */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-8">
                    
                    {/* Gráfico de Barras Agrupadas */}
                    <div className="flex flex-col gap-4">
                        <div className="h-[180px] w-full bg-slate-50 p-4 rounded-sm border border-slate-100">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.barData} margin={{top: 0, right: 0, left: -30, bottom: 0}}>
                                    <XAxis dataKey="month" fontSize={8} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={8} axisLine={false} tickLine={false} />
                                    <Bar dataKey="gen" fill="#E87722" radius={[2, 2, 0, 0]} barSize={8} />
                                    <Bar dataKey="cons" fill="#1A5F8F" radius={[2, 2, 0, 0]} barSize={8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Destaques Numéricos */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center py-4 border border-slate-100 rounded-sm">
                            <span className="text-2xl font-black text-slate-800 tabular-nums">
                                {stats.coverage.toFixed(0)}%
                            </span>
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                Média da Cobertura
                            </span>
                        </div>
                        <div className="flex flex-col items-center py-4 border border-slate-100 rounded-sm">
                            <span className="text-2xl font-black text-slate-800 tabular-nums">
                                {(stats.totalGen / 365 / totalPowerKwp).toFixed(2)}
                            </span>
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest text-center leading-tight">
                                Irradiação Local<br/>(kWh/h.dia)
                            </span>
                        </div>
                    </div>

                    {/* Seção Detalhes do Projeto (Fundo Escuro) */}
                    <div className="bg-[#1a231f] text-emerald-50 rounded-sm p-5 flex flex-col gap-5 border-l-4 border-emerald-500">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] border-b border-emerald-500/20 pb-2">
                            Detalhamento Técnico
                        </h4>
                        
                        <div className="flex flex-col gap-4">
                            {/* Módulos */}
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-sm bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                    <Sun size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-white leading-tight">
                                        Módulos: {modules.reduce((acc, m) => acc + (m.quantity || 1), 0)} unidades
                                    </span>
                                    <span className="text-[9px] text-emerald-500/70 font-medium">
                                        {modules[0]?.manufacturer || 'Fabricante'} · {modules[0]?.power || 550}Wp
                                    </span>
                                </div>
                            </div>

                            {/* Inversores */}
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-sm bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                    <Zap size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-white leading-tight">
                                        Inverter: {inverterIds.length} un.
                                    </span>
                                    <span className="text-[9px] text-emerald-500/70 font-medium">
                                        {firstInverter?.snapshot.model || 'Pendente'}
                                    </span>
                                </div>
                            </div>

                            {/* Estrutura */}
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-sm bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                    <Shield size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-white leading-tight">
                                        Instalação: {clientData.roofType || 'Residencial'}
                                    </span>
                                    <span className="text-[9px] text-emerald-500/70 font-medium uppercase tracking-tighter">
                                        Padrão Neonorte de Montagem
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Preço (Opcional) */}
                        {proposalData.showPricing && (
                            <div className="mt-2 pt-5 border-t border-emerald-500/20 flex flex-col items-center">
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-500/60 mb-2">Investimento Total</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[14px] font-bold text-emerald-400 opacity-60">R$</span>
                                    <span className="text-3xl font-black text-white tabular-nums">
                                        {(totalPowerKwp * 3800).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer: Validade e Pagamento */}
            <footer className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 gap-10">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar size={10} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Prazos e Validade</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-snug">
                        Esta proposta é válida por <strong>{proposalData.validityDays} dias</strong>. Prazo de instalação estimado em 45 dias após a aprovação da concessionária.
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <CreditCard size={10} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Condições de Pagamento</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-snug italic">
                        {proposalData.paymentTerms || 'Forma de pagamento padrão: 50% na aprovação do projeto e 50% na entrega dos equipamentos.'}
                    </p>
                </div>
            </footer>

            {/* Marcador de Página */}
            <div className="absolute bottom-5 right-12 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                Kurupira | Documento Gerado via Cloud Nexus
            </div>

        </div>
    );
};
