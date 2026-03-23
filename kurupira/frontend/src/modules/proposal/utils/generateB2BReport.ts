import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ProposalCalculations } from '../types';

interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
    autoTable: (options: any) => void;
}

export const generateB2BReport = async (
    data: ProposalCalculations,
    clientName: string,
    projectName: string
) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Header B2B
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Custos e Engenharia (B2B)", margin, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`USO INTERNO - CONFIDENCIAL | Cliente: ${clientName} | Ref: ${projectName}`, margin, 28);

    // Summary Box
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo de Engenharia", margin, 55);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Potência do Sistema: ${data.metrics.totalPowerkWp.toFixed(2)} kWp`, margin, 65);
    doc.text(`Total de Módulos: ${data.metrics.totalModules} unid.`, margin, 72);
    doc.text(`Total de Inversores: ${data.metrics.totalInverters} unid.`, margin, 79);

    // Bill of Materials (BOM) Table
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Bill of Materials (BOM) & Custos Hard", margin, 95);

    const bomData = [
        ['Kit Solar (Módulos + Inversores)', formatCurrency(data.costs.kit)],
        ['Materiais de Instalação (Cablagens, etc.)', formatCurrency(data.costs.materials)]
    ];

    doc.autoTable({
        startY: 100,
        head: [['Item', 'Custo Previsto']],
        body: bomData,
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105] }, // Slate-600
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 1: { halign: 'right' } },
        foot: [['Subtotal Materiais (Hard)', formatCurrency(data.costs.kit + data.costs.materials)]],
        footStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold' } // Slate-100
    });

    const nextY = doc.lastAutoTable.finalY + 15;

    // Execution Costs Table
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Soft Costs (Mão de Obra e Admin)", margin, nextY);

    const executionData = [
        ['Instalação Física e Montagem', formatCurrency(data.costs.labor)],
        ['Projeto Executivo (Engenharia)', formatCurrency(data.costs.project)],
        ['Custos Administrativos / Logísticos', formatCurrency(data.costs.admin)]
    ];

    doc.autoTable({
        startY: nextY + 5,
        head: [['Centro de Custo', 'Valor Parcial']],
        body: executionData,
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 1: { halign: 'right' } },
        foot: [['Subtotal Serviços (Soft)', formatCurrency(data.costs.labor + data.costs.project + data.costs.admin)]],
        footStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    const finalY = doc.lastAutoTable.finalY + 20;

    // Grand Builder Total
    doc.setFillColor(239, 246, 255); // Blue-50
    doc.setDrawColor(37, 99, 235); // Blue-600
    doc.roundedRect(margin, finalY, pageWidth - (margin * 2), 30, 2, 2, 'FD');

    doc.setFontSize(12);
    doc.setTextColor(30, 64, 175);
    doc.text("Custo Direto Total (Sem Markups DRE)", margin + 10, finalY + 12);

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(data.costs.total), margin + 10, finalY + 24);

    // Save
    doc.save(`Relatorio_B2B_BOM_${clientName.replace(/\s+/g, '_')}.pdf`);
};
