import React from 'react';
import { SystemLossesCard } from '../components/SystemLossesCard';
import { ModuleInventory } from '../components/ModuleInventory';
import { PVArrayStatusBar } from '../components/PVArrayStatusBar';
import { GenerationConsumptionChart } from '../components/GenerationConsumptionChart';

export const PVArrayTab: React.FC = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 h-full gap-4 p-2 overflow-hidden bg-slate-50/50">
            
            {/* Left Column: Stack (StatusBar + Inventory + Chart) */}
            <section className="col-span-1 lg:col-span-8 flex flex-col gap-3 h-full min-h-0">
                
                {/* 1. Header Status Bar */}
                <PVArrayStatusBar className="rounded-lg shadow-sm border border-slate-200" />
                
                {/* 2. Module Inventory (Fills available space) */}
                <div className="flex-1 min-h-0 relative">
                     <ModuleInventory className="h-full border-slate-200 shadow-sm rounded-lg" />
                </div>

                {/* 3. Feedback Chart (Fixed Height Footer) */}
                <div className="h-56 shrink-0">
                    <GenerationConsumptionChart className="h-full border-slate-200 shadow-sm rounded-lg" />
                </div>
            
            </section>
            
            {/* Right Column: Detailed Losses (Full Height) */}
            <section className="col-span-1 lg:col-span-4 h-full min-h-0">
                <SystemLossesCard 
                    className="h-full border-slate-200 shadow-sm rounded-lg" 
                    readOnly={false} 
                />
            </section>

        </div>
    );
};
