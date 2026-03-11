import React from 'react';
import { ProposalHero } from '../components/ProposalHero';
import { ProposalSpecs } from '../components/ProposalSpecs';
import { AccumulatedCashFlowChart } from '../components/CashFlowChart';
import { FinancingOptionsCard } from '../components/FinancingOptionsCard';
import { useProposalCalculator } from '../hooks/useProposalCalculator';
import { useSolarStore, selectClientData } from '@/core/state/solarStore';
import { generateProposalPDF } from '../utils/generatePDF';

export const PresentationTab: React.FC = () => {
    const calculator = useProposalCalculator();
    const { metrics, pricing, financials } = calculator;
    const clientData = useSolarStore(selectClientData);
    const financeParams = useSolarStore(state => state.financeParams);

    const handleGeneratePDF = async () => {
        await generateProposalPDF({
            ...calculator,
            clientName: clientData.clientName || 'Cliente',
            systemSize: metrics.totalPowerkWp,
            price: pricing.finalPrice,
            payback: financials.paybackYears
        });
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-10">
            
            {/* 1. HERO: VALUE PROPOSITION (Bill Comparison & ROI) */}
            <ProposalHero 
                pricing={pricing} 
                financials={financials} 
                onGeneratePDF={handleGeneratePDF} 
            />
            
            {/* 1.5. FINANCING OPTIONS (If Enabled) */}
            <FinancingOptionsCard 
                pricing={pricing}
                financials={financials}
                financeParams={financeParams}
            />

            {/* 2. FINANCIAL STORY: CASH FLOW CHART */}
            <AccumulatedCashFlowChart 
                initialInvestment={financeParams.financingMode === 'financed' ? (financeParams.downPayment || 0) : pricing.finalPrice}
                monthlySavings={financials.monthlySavings}
                inflationRate={0.045} // Default assumption (could come from settings)
            />
            
            {/* 3. ASSURANCE: TECH SPECS & IMPACT */}
            <ProposalSpecs 
                metrics={metrics} 
                pricing={pricing} 
                financials={financials} 
            />

        </div>
    );
};
