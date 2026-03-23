import React from 'react';
import { useProposalCalculator } from '../hooks/useProposalCalculator';
import { generateProposalPDF } from '../utils/generatePDF';
import { useSolarStore, selectClientData } from '@/core/state/solarStore';
import { useUIStore } from '@/core/state/uiStore';
import { ProposalHero } from './ProposalHero';
import { ProposalSpecs } from './ProposalSpecs';

export const ProposalSummary: React.FC = () => {
    const calculator = useProposalCalculator();
    const { metrics, pricing, financials } = calculator;
    const clientData = useSolarStore(selectClientData);
    const viewportSnapshot = useUIStore(state => state.viewportSnapshot);

    const handleGeneratePDF = async () => {
        await generateProposalPDF({
            ...calculator,
            clientName: clientData.clientName || 'Cliente',
            systemSize: metrics.totalPowerkWp,
            price: pricing.finalPrice,
            payback: financials.paybackYears,
            viewportSnapshot
        });
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10">
            <ProposalHero 
                pricing={pricing} 
                financials={financials} 
                onGeneratePDF={handleGeneratePDF} 
            />
            
            <ProposalSpecs 
                metrics={metrics} 
                pricing={pricing} 
                financials={financials} 
            />
        </div>
    );
};
