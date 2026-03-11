import React from 'react';
import { InverterStatusBar } from './InverterStatusBar';
import { InverterInventory } from './InverterInventory';
import { StringConfigurator } from './StringConfigurator';
import { VoltageRangeChart } from './VoltageRangeChart';

export const InverterSystemTab: React.FC = () => {
    return (
        <div className="grid grid-cols-12 gap-4 h-full p-2">
            
            {/* LEFT COLUMN (col-span-8) */}
            <div className="col-span-8 flex flex-col gap-4 h-full min-h-0">
                
                {/* ZONE A: STATUS BAR */}
                <InverterStatusBar />

                {/* ZONE B: INVERTER INVENTORY */}
                <InverterInventory className="flex-1 min-h-0" />

                {/* ZONE C: VISUAL FEEDBACK (Placeholder for VoltageRangeChart) */}
                <VoltageRangeChart />
            </div>

            {/* RIGHT COLUMN (col-span-4) */}
            <div className="col-span-4 h-full min-h-0">
                {/* ZONE D: STRING CONFIGURATION */}
                <StringConfigurator className="h-full" />
            </div>
        </div>
    );
};
