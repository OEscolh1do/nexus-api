export interface ProposalCalculations {
    metrics: {
        totalPowerkWp: number;
        totalModules: number;
        totalInverters: number;
    };
    costs: {
        kit: number;
        labor: number;
        laborBase: number;
        laborStructure: number;
        laborElectrical: number;
        project: number;
        admin: number;
        materials: number;
        total: number;
    };
    pricing: {
        finalPrice: number;
        kitPrice: number; // Valor final do Kit (com margem/imposto se aplicável)
        servicePrice: number; // Valor final dos Serviços
        marginValue: number;
        commissionValue: number;
        taxValue: number;
        pricePerWp: number;
    };
    financials: {
        estimatedMonthlyGenKwh: number;
        monthlySavings: number;
        paybackYears: number;
        payback: number;
        roi: number;
        npv: number;
        irr: number;
        monthlyInstallment?: number;
        cashFlows?: number[];
        cumulativeCashFlows?: number[];
    };
}
