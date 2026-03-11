import React, { useEffect } from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { FinanceParametersPanel } from './components/FinanceParametersPanel';
import { FinancialIndicators } from './components/FinancialIndicators';
import { CashFlowChart } from './components/CashFlowChart';

export const FinanceModule: React.FC = () => {
    const calculateResults = useSolarStore(state => state.calculateResults);
    
    // Initial calculation on mount to ensure results are populated
    useEffect(() => {
        calculateResults();
    }, [calculateResults]);

    return (
        <div className="h-full w-full bg-slate-100 p-4 flex gap-4 overflow-hidden">
            {/* Left Panel: Parameters */}
            <div className="w-80 lg:w-96 h-full shrink-0">
                <FinanceParametersPanel />
            </div>

            {/* Right Panel: Dashboard */}
            <div className="flex-1 h-full flex flex-col gap-4 min-w-0">
                 {/* Top: KPIs */}
                 <div className="shrink-0">
                    <FinancialIndicators />
                 </div>

                 {/* Bottom: Chart */}
                 <div className="flex-1 min-h-0">
                    <CashFlowChart />
                 </div>
            </div>
        </div>
    );
};
