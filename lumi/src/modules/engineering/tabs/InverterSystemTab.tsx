import React from 'react';
import { InverterInventory } from '../components/InverterInventory';
import { StringConfigurator } from '../components/StringConfigurator';
import { InverterStatusBar } from '../components/InverterStatusBar';
import { VoltageRangeChart } from '../components/VoltageRangeChart';

export const InverterSystemTab: React.FC = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 h-full gap-4 p-2 overflow-hidden bg-slate-50/50">
            
            {/* Left Column: Stack (StatusBar + Inventory + Chart) */}
            <section className="col-span-1 lg:col-span-8 flex flex-col gap-3 h-full min-h-0">
                
                {/* 1. Header Status Bar */}
                <InverterStatusBar className="rounded-lg shadow-sm border border-slate-200" />
                
                {/* 2. Inverter Inventory (Fills available space) */}
                <div className="flex-1 min-h-0 relative">
                     <InverterInventory className="h-full border-slate-200 shadow-sm rounded-lg" />
                </div>

                {/* 3. Voltage Range Chart (Fixed Height Footer) */}
                <div className="h-56 shrink-0">
                    <VoltageRangeChart className="h-full border-slate-200 shadow-sm rounded-lg" />
                </div>
            
            </section>
            
            {/* Right Column: Configuration (Full Height) */}
            <section className="col-span-1 lg:col-span-4 h-full min-h-0">
                <StringConfigurator className="h-full border-slate-200 shadow-sm rounded-lg" />
            </section>

        </div>
    );
};
