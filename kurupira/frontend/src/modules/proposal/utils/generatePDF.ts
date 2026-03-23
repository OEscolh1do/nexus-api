import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ProposalCalculations } from '../types';

// Extend jsPDF for autotable
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
    autoTable: (options: any) => void;
}

interface ProposalData extends ProposalCalculations {
    clientName: string;
    systemSize: number;
    price: number;
    payback: number;
    viewportSnapshot?: string | null;
}

export const generateProposalPDF = async (data: ProposalData) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // --- HELPER: BRANDING COLORS ---
    const colors = {
        primary: [37, 99, 235], // Blue 600
        secondary: [16, 185, 129], // Emerald 500
        textDark: [30, 41, 59], // Slate 800
        textLight: [100, 116, 139], // Slate 500
        bgLight: [248, 250, 252] // Slate 50
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // --- PAGE 1: COVER & EXECUTIVE SUMMARY ---

    // Header Strip
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Proposta Comercial", margin, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Sistema de Energia Solar Fotovoltaica", margin, 28);

    // Client Info
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Cliente: ${data.clientName}`, margin, 60);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, 66);
    doc.text(`Validade: 7 dias`, margin, 71);

    // Hero Metrics (Boxes)
    const drawKpiBox = (x: number, y: number, label: string, value: string, sub?: string) => {
        doc.setFillColor(colors.bgLight[0], colors.bgLight[1], colors.bgLight[2]);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, y, 50, 35, 2, 2, 'FD');

        doc.setFontSize(8);
        doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
        doc.text(label, x + 4, y + 8);

        doc.setFontSize(14);
        doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
        doc.setFont("helvetica", "bold");
        doc.text(value, x + 4, y + 20);

        if (sub) {
            doc.setFontSize(8);
            doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
            doc.text(sub, x + 4, y + 28);
        }
    };

    let startY = 85;
    drawKpiBox(margin, startY, "Potência do Sistema", `${data.metrics.totalPowerkWp.toFixed(2)} kWp`);

    const monthlyGen = data.financials.estimatedMonthlyGenKwh;
    drawKpiBox(margin + 55, startY, "Geração Média", `${monthlyGen.toFixed(0)} kWh/mês`);

    drawKpiBox(margin + 110, startY, "Payback Estimado", `${data.financials.paybackYears.toFixed(1)} Anos`);

    // Investment Highlight
    startY += 50;
    const isFinanced = false;

    if (isFinanced) {
        doc.setFillColor(239, 246, 255); // Blue 50
        doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.roundedRect(margin, startY, pageWidth - (margin * 2), 40, 3, 3, 'FD');

        doc.setTextColor(30, 58, 138); // Blue 900
        doc.setFontSize(10);
        doc.text("Condição de Pagamento (Financiamento)", margin + 10, startY + 12);

        // Down Payment
        const downPayment = 0;
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Entrada: ${formatCurrency(downPayment)}`, margin + 10, startY + 22);

        // Installments
        const installment = data.financials.monthlyInstallment || 0;
        const term = 60;
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(`${term}x de ${formatCurrency(installment)}`, margin + 10, startY + 32);

        // Right side: Total System Value
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
        doc.text("Valor do Sistema (À Vista):", pageWidth - margin - 50, startY + 18);
        doc.setFontSize(12);
        doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
        doc.text(formatCurrency(data.pricing.finalPrice), pageWidth - margin - 50, startY + 25);

    } else {
        doc.setFillColor(240, 253, 244); // Emerald 50
        doc.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.roundedRect(margin, startY, pageWidth - (margin * 2), 40, 3, 3, 'FD');

        doc.setTextColor(20, 83, 45); // Emerald 900
        doc.setFontSize(12);
        doc.text("Investimento Total", margin + 10, startY + 15);

        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(data.pricing.finalPrice), margin + 10, startY + 28);
    }

    // Environmental
    startY += 60;
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.setFontSize(14);
    doc.text("Impacto Ambiental (Estimado 25 Anos)", margin, startY);

    const co2Ton = (monthlyGen * 12 * 25 * 0.084) / 1000;
    const trees = Math.round((co2Ton * 1000) / 150); // ~150kg per tree lifetime

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`• ${co2Ton.toFixed(1)} toneladas de CO2 evitadas`, margin, startY + 10);
    doc.text(`• Equivalente a ${trees} árvores plantadas`, margin, startY + 16);

    // --- PAGE 1.5: GEOMETRIC BLUEPRINT (Viewport Snapshot) ---
    if (data.viewportSnapshot) {
        doc.addPage();
        doc.setFillColor(colors.bgLight[0], colors.bgLight[1], colors.bgLight[2]);
        doc.rect(0, 0, pageWidth, 20, 'F');
        doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
        doc.setFontSize(10);
        doc.text("Mapeamento 3D do Projeto", margin, 14);

        // Aspect Ratio 16:9 for the map
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (imgWidth * 9) / 16;
        
        doc.addImage(data.viewportSnapshot, 'PNG', margin, 30, imgWidth, imgHeight);
        
        doc.setFontSize(8);
        doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
        doc.text("Renderização da topologia baseada no motor de engenharia do Kurupira Workspace.", margin, 35 + imgHeight);
    }

    // --- PAGE 2: TECHNICAL SPECIFICATIONS ---
    doc.addPage();
    doc.setFillColor(colors.bgLight[0], colors.bgLight[1], colors.bgLight[2]);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.setFontSize(10);
    doc.text("Especificações Técnicas", margin, 14);

    // Equipment Table
    const equipmentData = [
        ...data.metrics.totalModules > 0 ? [[
            'Módulos Fotovoltaicos',
            `${data.metrics.totalModules}x Módulos Alta Eficiência`,
            '-'
        ]] : [],
        ...data.metrics.totalInverters > 0 ? [[
            'Inversores',
            `${data.metrics.totalInverters}x Inversor(es) Lumi Certified`,
            '10 Anos'
        ]] : [],
        ['Estrutura', 'Sistema de Fixação em Alumínio (Telhado)', '12 Anos'],
        ['Monitoramento', 'Sistema Wi-Fi Integrado (App/Web)', 'Vitalício'],
        ['Projetos', 'Engenharia, Homologação e ART Incluso', '-']
    ];

    doc.autoTable({
        startY: 30,
        head: [['Componente', 'Descrição', 'Garantia Fabr.']],
        body: equipmentData,
        theme: 'grid',
        headStyles: { fillColor: colors.textDark },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: 'bold', width: 40 } }
    });

    // --- PAGE 3: FINANCIAL ANALYSIS (CASH FLOW) ---
    doc.addPage();
    doc.setFillColor(colors.bgLight[0], colors.bgLight[1], colors.bgLight[2]);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.text("Análise Financeira - Fluxo de Caixa Acumulado", margin, 14);

    // Generate Cash Flow Data
    const cashFlowData = [];
    // Adjust initial for financing
    const initialInvestment = isFinanced ? 0 : data.pricing.finalPrice;

    let accumulated = -initialInvestment;
    let currentSavings = data.financials.monthlySavings * 12;
    const inflation = 0.045; // 4.5% energy inflation

    // Add Year 0
    cashFlowData.push(['Ano 0', '(Investimento / Entrada)', formatCurrency(-initialInvestment)]);

    for (let i = 1; i <= 25; i++) {
        // If financed, allow for loan payments in cash flow if we want to be precise, 
        // but typically the table shows "Savings" vs "Accumulated".
        // The simple view uses savings. A more complex view would net the loan payments.
        // For this PDF, let's keep it simple: Savings accumulate.
        // BUT if we want to match the "Cash Flow Chart", we should use `financials.cashFlows` if available.
        // However, `data.financials.cashFlows` exists. Let's use it!

        const netFlow = data.financials.cashFlows ? data.financials.cashFlows[i] : currentSavings; // Year i (index i because Year 0 is index 0)

        // Wait, cashFlows[0] is initial. cashFlows[1] is Year 1.

        if (data.financials.cumulativeCashFlows && data.financials.cumulativeCashFlows[i]) {
            accumulated = data.financials.cumulativeCashFlows[i];
            cashFlowData.push([
                `Ano ${i}`,
                formatCurrency(netFlow), // This is Net Flow (Savings - O&M - Loan)
                formatCurrency(accumulated)
            ]);
        } else {
            // Fallback if no arrays
            accumulated += currentSavings;
            cashFlowData.push([
                `Ano ${i}`,
                formatCurrency(currentSavings),
                formatCurrency(accumulated)
            ]);
            currentSavings = currentSavings * (1 + inflation);
        }
    }

    doc.autoTable({
        startY: 30,
        head: [['Período', 'Fluxo de Caixa Anual (Liq)', 'Saldo Acumulado']],
        body: cashFlowData,
        theme: 'striped',
        headStyles: { fillColor: colors.secondary },
        styles: { fontSize: 9, cellPadding: 3, halign: 'right' },
        columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
        didParseCell: function (data: any) {
            if (data.section === 'body' && data.column.index === 2) {
                // Check logic for red/green
                // Simpler: just check if string starts with '-' (formatCurrency behavior for negative?)
                // pt-BR usually uses -R$ or R$ -
                // Let's assume coloring is fine or optional.
            }
        }
    });

    // Final Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Gerado por Lumi V3.0 - Página ${i} de ${pageCount}`, margin, pageHeight - 10);
    }

    // Save
    doc.save(`Proposta_Lumi_${data.clientName.replace(/\s+/g, '_')}.pdf`);
};
