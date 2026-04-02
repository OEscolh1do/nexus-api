import React from 'react';
import { useSolarStore, selectClientData } from '@/core/state/solarStore';
import { useProposalCalculator } from '../hooks/useProposalCalculator';
import { DenseCard } from '@/components/ui/dense-form';
import { MapPin, Home, TrendingDown, Sun, BarChart2, Package } from 'lucide-react';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const ROOF_LABELS: Record<string, string> = {
    ceramica: 'Cerâmica',
    metalico: 'Metálico',
    fibrocimento: 'Fibrocimento',
    laje: 'Laje Plana',
    outro: 'Outro',
};

const CONNECTION_LABELS: Record<string, string> = {
    monofasico: 'Monofásico',
    bifasico: 'Bifásico',
    trifasico: 'Trifásico',
};

export const DiagnosticoTab: React.FC = () => {
    const clientData = useSolarStore(selectClientData);
    const calc = useProposalCalculator();

    const monthlyHistory: number[] = clientData.invoices?.[0]?.monthlyHistory ?? Array(12).fill(0);
    const monthlyIrradiation: number[] = clientData.monthlyIrradiation ?? Array(12).fill(0);
    const hasHistory = monthlyHistory.some(v => v > 0);
    const hasIrradiation = monthlyIrradiation.some(v => v > 0);

    const maxConsumption = Math.max(...monthlyHistory, 1);
    const peakMonth = monthlyHistory.indexOf(Math.max(...monthlyHistory));
    const minMonth = monthlyHistory.indexOf(Math.min(...monthlyHistory.filter(v => v > 0)));
    const avgConsumption = monthlyHistory.reduce((a, b) => a + b, 0) / 12;
    const avgHsp = hasIrradiation
        ? monthlyIrradiation.reduce((a, b) => a + b, 0) / 12
        : 0;

    const { costs, pricing, financials, metrics } = calc;

    const totalCostBase = costs.total || 1;
    const kitPct = Math.round((costs.kit / totalCostBase) * 100);
    const laborPct = Math.round((costs.labor / totalCostBase) * 100);
    const softPct = Math.max(0, 100 - kitPct - laborPct);

    const persona = clientData.leadPersona;

    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const fmtN = (v: number, d = 1) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);

    const connectionType =
        clientData.invoices?.[0]?.connectionType ??
        (clientData as any).connectionType;

    return (
        <div className="space-y-6">

            {/* ── SEÇÃO 1: CONSUMO ─────────────────────────────────────────── */}
            <DenseCard className="p-0 overflow-hidden border-slate-200">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                    <BarChart2 size={14} className="text-purple-500" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Histórico de Consumo — 12 meses
                    </span>
                    <span className="ml-auto text-xs text-slate-400">
                        Média: <strong className="text-slate-700">{fmtN(avgConsumption, 0)} kWh/mês</strong>
                    </span>
                </div>

                <div className="p-4">
                    {hasHistory ? (
                        <>
                            <div className="flex items-end gap-1 h-36">
                                {monthlyHistory.map((val, i) => {
                                    const heightPct = (val / maxConsumption) * 100;
                                    const isPeak = i === peakMonth;
                                    const hsp = monthlyIrradiation[i];
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                                                <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                                                    {val} kWh{hsp > 0 ? ` · ${hsp.toFixed(1)}h sol` : ''}
                                                </div>
                                                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
                                            </div>

                                            {/* Bar */}
                                            <div className="w-full flex flex-col justify-end" style={{ height: '100%' }}>
                                                <div
                                                    className={`w-full rounded-t-sm transition-all duration-300 ${
                                                        isPeak
                                                            ? 'bg-purple-500'
                                                            : 'bg-purple-200 group-hover:bg-purple-400'
                                                    }`}
                                                    style={{ height: `${Math.max(heightPct, 3)}%` }}
                                                />
                                            </div>
                                            <span className="text-[9px] text-slate-400">{MONTHS[i]}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-2">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-2 bg-purple-500 rounded-sm inline-block" />
                                    Pico ({MONTHS[peakMonth]}): <strong className="text-slate-700 ml-1">{Math.max(...monthlyHistory)} kWh</strong>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-2 bg-purple-200 rounded-sm inline-block" />
                                    Mínimo ({MONTHS[minMonth >= 0 ? minMonth : 0]}): <strong className="text-slate-700 ml-1">{Math.min(...monthlyHistory.filter(v => v > 0))} kWh</strong>
                                </span>
                                {hasIrradiation && (
                                    <span className="flex items-center gap-1.5 ml-auto text-amber-600">
                                        <Sun size={11} />
                                        HSP médio: <strong className="ml-1">{fmtN(avgHsp)} h/dia</strong>
                                    </span>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-36 flex items-center justify-center text-sm text-slate-400">
                            Nenhum histórico de consumo informado. Preencha os dados do cliente.
                        </div>
                    )}
                </div>
            </DenseCard>

            {/* ── SEÇÕES 2 & 3: LOCALIZAÇÃO + CUSTO ───────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* LOCALIZAÇÃO & TELHADO */}
                <DenseCard className="p-0 overflow-hidden border-slate-200">
                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                        <MapPin size={14} className="text-emerald-500" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Localização & Estrutura</span>
                    </div>
                    <div className="p-4 space-y-3">
                        <DataRow label="Município" value={`${clientData.city || '—'}, ${clientData.state || '—'}`} />
                        <DataRow label="Tipo de Telhado" value={ROOF_LABELS[clientData.roofType ?? ''] ?? '—'} />
                        <DataRow label="Inclinação" value={clientData.roofInclination !== undefined ? `${clientData.roofInclination}°` : '—'} />
                        <DataRow label="Área Disponível" value={clientData.availableArea ? `${clientData.availableArea} m²` : '—'} />
                        <DataRow
                            label="Tipo de Conexão"
                            value={CONNECTION_LABELS[connectionType ?? ''] ?? connectionType ?? '—'}
                        />
                        {clientData.lat && clientData.lng && (
                            <DataRow
                                label="Coordenadas"
                                value={`${clientData.lat.toFixed(4)}°, ${clientData.lng.toFixed(4)}°`}
                                small
                            />
                        )}
                    </div>
                </DenseCard>

                {/* COMPOSIÇÃO DE CUSTO */}
                <DenseCard className="p-0 overflow-hidden border-slate-200">
                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                        <Package size={14} className="text-blue-500" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Composição do Custo</span>
                    </div>
                    <div className="p-4 space-y-3">
                        <CostBar label="Kit Solar" value={costs.kit} pct={kitPct} color="bg-blue-400" />
                        <CostBar label="Mão de Obra" value={costs.labor} pct={laborPct} color="bg-purple-400" />
                        <CostBar label="Projetos & Admin" value={costs.project + costs.admin} pct={softPct} color="bg-emerald-400" />

                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Custo Técnico Total</span>
                                <span className="font-bold text-slate-700">{fmt(costs.total)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Preço Final (com margem)</span>
                                <span className="font-bold text-purple-700 text-sm">{fmt(pricing.finalPrice)}</span>
                            </div>
                        </div>

                        <div className="mt-1 p-2 bg-amber-50 border border-amber-100 rounded text-[10px] text-amber-700 leading-relaxed">
                            ⚠️ <strong>Região Norte:</strong> logística via modal amazônico pode representar 8–12% adicional no custo do kit.
                        </div>
                    </div>
                </DenseCard>
            </div>

            {/* ── SEÇÃO 4: CTA DUAL-PERSONA ────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* PROVEDOR */}
                <DenseCard
                    className={`p-5 border-2 transition-all duration-200 ${
                        persona === 'provedor'
                            ? 'border-emerald-400 bg-emerald-50/50'
                            : persona === 'calculista'
                            ? 'border-slate-100 bg-white opacity-60'
                            : 'border-slate-200 bg-white'
                    }`}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2.5 rounded-full ${persona === 'provedor' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            <Home size={18} />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Perfil Provedor</div>
                            <div className="text-sm font-bold text-slate-700">Independência Energética</div>
                        </div>
                        {persona === 'provedor' && (
                            <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                                IDENTIFICADO
                            </span>
                        )}
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            Conta reduzida em até <strong>90%</strong>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            Proteção contra reajustes da concessionária
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            Geração própria de <strong>{fmtN(metrics.totalPowerkWp)} kWp</strong>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            Economia mensal estimada: <strong>{fmt(financials.monthlySavings)}</strong>
                        </li>
                    </ul>
                </DenseCard>

                {/* CALCULISTA */}
                <DenseCard
                    className={`p-5 border-2 transition-all duration-200 ${
                        persona === 'calculista'
                            ? 'border-purple-400 bg-purple-50/50'
                            : persona === 'provedor'
                            ? 'border-slate-100 bg-white opacity-60'
                            : 'border-slate-200 bg-white'
                    }`}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2.5 rounded-full ${persona === 'calculista' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>
                            <TrendingDown size={18} />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Perfil Calculista</div>
                            <div className="text-sm font-bold text-slate-700">Análise de Retorno (ROI)</div>
                        </div>
                        {persona === 'calculista' && (
                            <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                                IDENTIFICADO
                            </span>
                        )}
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-start gap-2">
                            <span className="text-purple-500 font-bold mt-0.5">✓</span>
                            Payback estimado: <strong>{fmtN(financials.paybackYears)} anos</strong>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-500 font-bold mt-0.5">✓</span>
                            TIR: <strong>{fmtN(financials.irr * 100)}% a.a.</strong>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-500 font-bold mt-0.5">✓</span>
                            VPL (25 anos / 8% a.a.): <strong>{fmt(financials.npv)}</strong>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-500 font-bold mt-0.5">✓</span>
                            ROI bruto: <strong>{fmtN(financials.roi * 100, 0)}%</strong>
                        </li>
                    </ul>
                </DenseCard>
            </div>

        </div>
    );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const DataRow = ({ label, value, small }: { label: string; value: string; small?: boolean }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-slate-500">{label}</span>
        <span className={`font-medium text-right ${small ? 'text-xs text-slate-400' : 'text-slate-700'}`}>{value}</span>
    </div>
);

const CostBar = ({
    label, value, pct, color,
}: {
    label: string; value: number; pct: number; color: string;
}) => {
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-slate-600">{label}</span>
                <span className="text-slate-500">
                    {fmt(value)} <span className="text-slate-400">({pct}%)</span>
                </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                />
            </div>
        </div>
    );
};
