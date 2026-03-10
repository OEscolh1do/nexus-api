import React, { useMemo, useState } from 'react';
import { Compass, Zap, TrendingUp, AlertTriangle, MessageSquare, Plus, Clock, History } from 'lucide-react';
import { Card, Badge, Button, Input } from '../../../components/ui/mock-components';
import { StrategyService } from '../services/strategy.service';
import type { Strategy, KeyResult, KeyResultCheckIn } from '../types';

// We need a Project type here, or import it. 
// For loose coupling, I'll define a local interface or import if available.
interface ProjectSummary {
    id: string;
    title: string;
    strategyId?: string;
    progressPercentage: number;
}

interface StrategyCompassProps {
    strategies: Strategy[];
    projects: ProjectSummary[];
    onCheckInCompleted?: () => void;
}

export const StrategyCompass: React.FC<StrategyCompassProps> = ({ strategies, projects, onCheckInCompleted }) => {
    const [selectedKRId, setSelectedKRId] = useState<string | null>(null);
    const [checkInValue, setCheckInValue] = useState<number>(0);
    const [checkInComment, setCheckInComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);

    const handleCheckInSubmit = async (kr: KeyResult) => {
        setIsSubmitting(true);
        try {
            await StrategyService.createCheckIn(kr.id, {
                newValue: Number(checkInValue),
                comment: checkInComment
            });
            setSelectedKRId(null);
            setCheckInComment("");
            if (onCheckInCompleted) onCheckInCompleted();
        } catch (e) {
            console.error(e);
            alert("Erro ao realizar check-in");
        } finally {
            setIsSubmitting(false);
        }
    };

    const pillars = useMemo(() => strategies.filter(s => s.type === 'PILLAR' || !s.parentId), [strategies]);

    const allKeyResults = useMemo(() => {
        // Strategies is already a flat list of all nodes. No need to recurse.
        // Just map and flatten.
        return strategies.flatMap(strategy =>
            (strategy.keyResults || []).map(kr => ({
                kr,
                strategyTitle: strategy.title
            }))
        );
    }, [strategies]);

    // 2. Map Projects to Strategies
    const alignmentMap = useMemo(() => {
        const map = new Map<string, ProjectSummary[]>();
        projects.forEach(p => {
            if (p.strategyId) {
                const existing = map.get(p.strategyId) || [];
                map.set(p.strategyId, [...existing, p]);
            }
        });
        return map;
    }, [projects]);

    return (
        <div className="space-y-8 p-2">

            {/* 1. NORTH STAR HEADER */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pillars.map(pillar => (
                    <Card key={pillar.id} className="p-4 border-l-4" style={{ borderLeftColor: pillar.colorCode || '#6366f1' }}>
                        <div className="flex items-center gap-3 mb-2">
                            <Compass size={24} style={{ color: pillar.colorCode || '#6366f1' }} />
                            <h3 className="font-bold text-lg">{pillar.title}</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{pillar.description || "Objetivo estratégico principal da organização."}</p>
                        {/* Mini Project Count */}
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                            <Zap size={14} className="text-amber-500" />
                            <span>{alignmentMap.get(pillar.id)?.length || 0} Projetos Vinculados</span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* 2. ALIGNMENT MATRIX */}
            <div>
                <h4 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-200">
                    <Zap className="text-amber-500" /> Matriz de Alinhamento Tático
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {strategies.flatMap(s => s.children || []).map(strategy => {
                        const linkedProjects = alignmentMap.get(strategy.id) || [];
                        return (
                            <Card key={strategy.id} className="p-0 overflow-hidden flex flex-col">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b flex justify-between items-center">
                                    <span className="font-semibold text-sm truncate" title={strategy.title}>{strategy.title}</span>
                                    <Badge variant="outline">{linkedProjects.length}</Badge>
                                </div>
                                <div className="p-3 flex-1 bg-white dark:bg-slate-950">
                                    {linkedProjects.length > 0 ? (
                                        <ul className="space-y-2">
                                            {linkedProjects.map(p => (
                                                <li key={p.id} className="text-xs flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-default">
                                                    <span className="truncate flex-1 text-slate-700 dark:text-slate-300">{p.title}</span>
                                                    <span className={`text-[10px] font-bold px-1.5 rounded-full ${p.progressPercentage === 100 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                                        {p.progressPercentage}%
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300 py-4 gap-2">
                                            <AlertTriangle size={16} />
                                            <span className="text-xs">Sem projetos vinculados</span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* 3. KEY RESULTS SCORECARD */}
            <div>
                <h4 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-200">
                    <TrendingUp className="text-emerald-500" /> Scorecard de Resultados (KPIs)
                </h4>
                <div className="bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-sm">
                    <div className="space-y-4">
                        {allKeyResults.map(({ kr, strategyTitle }) => {
                            const progress = Math.min((kr.currentValue / kr.targetValue) * 100, 100);
                            return (
                                <div key={kr.id} className="flex items-center gap-4 py-2 border-b last:border-0 border-slate-100 dark:border-slate-800">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0">
                                        {Math.round(progress)}%
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium text-sm truncate" title={kr.title}>{kr.title}</span>
                                            <span className="text-xs text-slate-500">{kr.currentValue} / {kr.targetValue} {kr.unit}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-emerald-500' : progress >= 70 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-[10px] text-slate-400 truncate flex-1">
                                                Vinculado a: {strategyTitle}
                                                {kr.owner && <span className="ml-2 font-medium text-slate-500 flex-shrink-0">• Resp: {kr.owner.fullName.split(' ')[0]}</span>}
                                            </p>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => setShowHistoryFor(showHistoryFor === kr.id ? null : kr.id)}
                                                    className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-indigo-600 px-2 py-0.5 rounded border border-slate-200 hover:border-indigo-200 transition-colors"
                                                >
                                                    <History size={12} /> Histórico
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedKRId(kr.id); setCheckInValue(kr.currentValue); setCheckInComment(""); }}
                                                    className="text-[10px] flex items-center gap-1 bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 px-2 py-0.5 rounded font-medium transition-colors border border-slate-200 hover:border-emerald-200"
                                                >
                                                    <Plus size={12} /> Check-in
                                                </button>
                                            </div>
                                        </div>

                                        {/* Action Panel: Check-in Form */}
                                        {selectedKRId === kr.id && (
                                            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-900/30 rounded-lg animate-in fade-in slide-in-from-top-2">
                                                <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-1"><Zap size={14} /> Registrar Novo Valor</h5>
                                                <div className="flex gap-2">
                                                    <div className="w-24">
                                                        <Input
                                                            type="number"
                                                            value={checkInValue}
                                                            onChange={e => setCheckInValue(Number(e.target.value))}
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                    <Input
                                                        placeholder="Justificativa ou comentário do avanço..."
                                                        value={checkInComment}
                                                        onChange={e => setCheckInComment(e.target.value)}
                                                        className="h-8 flex-1 text-sm"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleCheckInSubmit(kr)}
                                                        disabled={isSubmitting || checkInValue === kr.currentValue}
                                                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 shadow-md transition-all"
                                                    >
                                                        Confirmar
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-8" onClick={() => setSelectedKRId(null)}>Cancelar</Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Panel: History Timeline */}
                                        {showHistoryFor === kr.id && kr.checkIns && (
                                            <div className="mt-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700 p-2 max-h-40 overflow-y-auto animate-in fade-in zoom-in-95">
                                                {kr.checkIns.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {kr.checkIns.map((ci: KeyResultCheckIn) => (
                                                            <div key={ci.id} className="text-xs border-l-2 border-indigo-300 pl-2 pb-1 relative">
                                                                <div className="absolute w-2 h-2 rounded-full bg-indigo-500 -left-[5px] top-1"></div>
                                                                <div className="flex justify-between text-slate-500 mb-1">
                                                                    <span className="font-semibold text-slate-700">{ci.user?.fullName.split(' ')[0]}</span>
                                                                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(ci.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 line-through opacity-70">{ci.previousValue} {kr.unit}</span>
                                                                    <span className="text-slate-400">→</span>
                                                                    <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded">{ci.newValue} {kr.unit}</span>
                                                                </div>
                                                                {ci.comment && (
                                                                    <p className="text-slate-500 dark:text-slate-400 italic flex items-start gap-1 mt-1 bg-white dark:bg-slate-900 p-1 rounded border border-slate-100 dark:border-slate-800">
                                                                        <MessageSquare size={10} className="mt-0.5 shrink-0 opacity-50" />
                                                                        {ci.comment}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-center text-slate-400 py-2">Nenhum check-in registrado.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                        {allKeyResults.length === 0 && (
                            <div className="text-center text-slate-400 py-4 text-sm">Nenhum Key Result monitorado no momento.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
