import React, { useEffect, useState, useCallback } from 'react';
import { Target, Compass } from 'lucide-react';
import { StrategyCompass } from '../components/StrategyCompass';
import { StrategyService } from '../services/strategy.service';
import { OpsService } from '../../ops/ops.service';
import type { Project } from '../../ops/types';
import type { Strategy } from '../types';

export const StrategyReviewView: React.FC = () => {
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            console.log("Loading Strategy View Data...");

            const [stratRes, projRes] = await Promise.allSettled([
                StrategyService.getAll(),
                OpsService.getAllProjects()
            ]);

            if (stratRes.status === 'fulfilled') {
                console.log("Strategies loaded:", stratRes.value);
                setStrategies(stratRes.value || []);
            } else {
                console.error("Failed to load strategies:", stratRes.reason);
            }

            if (projRes.status === 'fulfilled') {
                console.log("Projects loaded:", projRes.value);
                setProjects(projRes.value || []);
            } else {
                console.error("Failed to load projects:", projRes.reason);
            }

        } catch (e) {
            console.error("Unexpected error in StrategyReviewView", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Compass className="text-indigo-600" />
                        Bússola Operacional
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Painel de Alinhamento Estratégico & Tático</p>
                </div>
            </div>

            {/* Compass Content */}
            <div className="flex-1 overflow-auto pr-4 custom-scrollbar">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-400">Carregando indicadores...</div>
                ) : strategies.length > 0 ? (
                    <StrategyCompass
                        strategies={strategies}
                        projects={projects.map(p => ({ ...p, progressPercentage: p.progressPercentage ?? 0 }))}
                        onCheckInCompleted={loadData}
                    />
                ) : (
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <Target size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">Nenhuma estratégia definida pelo comitê.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

