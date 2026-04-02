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

    // --- KPI Summary Box (NPV / IRR / ROI) ---
    const kpiY = 26;
    const kpiBoxW = (pageWidth - margin * 2 - 10) / 3;

    const drawFinKpi = (x: number, label: string, value: string, color: number[]) => {
        doc.setFillColor(colors.bgLight[0], colors.bgLight[1], colors.bgLight[2]);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, kpiY, kpiBoxW, 22, 2, 2, 'FD');
        doc.setFontSize(7);
        doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
        doc.text(label, x + 3, kpiY + 7);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(value, x + 3, kpiY + 17);
        doc.setFont("helvetica", "normal");
    };

    const npv = data.financials.npv ?? 0;
    const irr = data.financials.irr ?? 0;
    const roi = data.financials.roi ?? 0;

    drawFinKpi(margin, "VPL (NPV) — 25 anos / 8% a.a.", formatCurrency(npv), npv >= 0 ? [16, 185, 129] : [239, 68, 68]);
    drawFinKpi(margin + kpiBoxW + 5, "TIR (IRR) — Taxa Interna de Retorno", `${(irr * 100).toFixed(1)}% a.a.`, irr >= 0.08 ? [16, 185, 129] : [245, 158, 11]);
    drawFinKpi(margin + (kpiBoxW + 5) * 2, "ROI Bruto — 25 anos", `${(roi * 100).toFixed(0)}%`, [37, 99, 235]);

    // Assumptions footnote
    const avgHsp = data.financials.avgHsp ?? 4.5;
    const avgTariff = data.financials.avgTariff ?? 0.92;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.text(
        `Premissas: HSP médio = ${avgHsp.toFixed(2)} h/dia · Tarifa = R$ ${avgTariff.toFixed(4)}/kWh · Degradação 0,5%/ano · Inflação tarifária 5%/ano · WACC 8% a.a.`,
        margin, kpiY + 28
    );

    // --- Cash Flow Table ---
    const cashFlows = data.financials.cashFlows;
    const cashFlowData: string[][] = [];
    const investment = data.pricing.finalPrice;

    cashFlowData.push(['Ano 0', '(Investimento Inicial)', formatCurrency(-investment), formatCurrency(-investment)]);

    let accumulated = -investment;
    for (let i = 1; i <= 25; i++) {
        const netFlow = cashFlows ? cashFlows[i] : data.financials.monthlySavings * 12 * Math.pow(1.045, i - 1);
        accumulated += netFlow;
        cashFlowData.push([`Ano ${i}`, formatCurrency(netFlow), formatCurrency(accumulated), accumulated >= 0 ? '✓' : '']);
    }

    doc.autoTable({
        startY: kpiY + 34,
        head: [['Período', 'Fluxo Anual (Líquido)', 'Saldo Acumulado', '']],
        body: cashFlowData,
        theme: 'striped',
        headStyles: { fillColor: colors.secondary },
        styles: { fontSize: 8, cellPadding: 2.5, halign: 'right' },
        columnStyles: {
            0: { halign: 'left', fontStyle: 'bold', cellWidth: 18 },
            3: { cellWidth: 8, halign: 'center', textColor: [16, 185, 129] }
        },
        didParseCell: function (cellData: any) {
            if (cellData.section === 'body' && cellData.column.index === 2) {
                const raw = cashFlows ? cashFlows.slice(1, cellData.row.index + 1).reduce((a: number, b: number) => a + b, -investment) : null;
                if (raw !== null && raw < 0) {
                    cellData.cell.styles.textColor = [239, 68, 68];
                }
            }
        }
    });

    // Final Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Gerado por Kurupira / Neonorte Energia - Página ${i} de ${pageCount}`, margin, pageHeight - 10);
    }

    // Save
    doc.save(`Proposta_Neonorte_${data.clientName.replace(/\s+/g, '_')}.pdf`);
};
