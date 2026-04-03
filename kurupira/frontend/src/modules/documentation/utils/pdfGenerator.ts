import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ModuleSpecs, InverterSpecs, InputData } from '@/core/types';
import { ProjectData } from '@/core/state/slices/projectSlice';

interface PDFGenerationParams {
  modules: ModuleSpecs[];
  inverters: InverterSpecs[];
  clientData: InputData;
  projectName?: string;
  projectMapData?: ProjectData;
  placedModulesQty: number;
}

export const generateTechnicalMemorandumPDF = ({
  modules,
  inverters,
  clientData,
  projectName,
  placedModulesQty
}: PDFGenerationParams) => {
  // Inicialização do documento A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  let currentY = 20;

  // Header / Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('MEMORIAL DESCRITIVO TÉCNICO', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Sistema de Microgeração Fotovoltaica - Neonorte Kurupira', pageWidth / 2, currentY, { align: 'center' });

  // Bloco: 1. Identificação do Projeto
  currentY += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. IDENTIFICAÇÃO DO PROJETO', margin, currentY);

  currentY += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente:`, margin, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(clientData.clientName || projectName || 'Consumidor', margin + 20, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Localidade:`, margin, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${clientData.city || 'Cidade'} - ${clientData.state || 'UF'}`, margin + 20, currentY);

  if (clientData.street) {
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Endereço:`, margin, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${clientData.street}, ${clientData.number || 'S/N'} - ${clientData.neighborhood || ''}`, margin + 20, currentY);
  }

  // Bloco: 2. Especificações dos Módulos
  currentY += 16;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. ESPECIFICAÇÕES DOS MÓDULOS FOTOVOLTAICOS', margin, currentY);
  
  currentY += 4;
  const moduleData = modules.map(m => [
    m.manufacturer,
    m.model,
    `${m.power}W`,
    m.type,
    // Calculate how many of this module are logically quantified. Defaults to placedModulesQty if 1 module type, else we just refer to its spec quantity.
    modules.length === 1 ? placedModulesQty.toString() : (m.quantity?.toString() || '1')
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Fabricante', 'Modelo', 'Potência (W)', 'Tecnologia', 'Quantidade']],
    body: moduleData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: 255 }, // Indigo 600
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Bloco: 3. Especificações dos Inversores
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. ESPECIFICAÇÕES DOS INVERSORES', margin, currentY);

  currentY += 4;
  const inverterData = inverters.map(i => [
    i.manufacturer,
    i.model,
    `${i.nominalPower}kW`,
    i.connectionType,
    i.quantity?.toString() || '1'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Fabricante', 'Modelo', 'Potência (kW)', 'Fases', 'Quantidade']],
    body: inverterData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255 }, // Emerald 500
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 16;

  // Bloco: 4. Proteções & Cabeamento (Placeholder/Mock up de PENDENTE)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('4. ELEMENTOS DE PROTEÇÃO (BOS)', margin, currentY);
  
  currentY += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text('* Seção pendente de detalhamento diagramático. Elementos macro previstos:', margin, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('- Stringbox CC (DPS Cl. II, Chave Seccionadora, Fusíveis/Disjuntores Curto-Retardo)', margin + 5, currentY);
  currentY += 6;
  doc.text('- Quadro de Proteção CA (DPS Cl. II, Disjuntor Termomagnético Curva C)', margin + 5, currentY);
  currentY += 6;
  doc.text('- Sistema de Aterramento (Haste Copperweld ou Equipotencialização SPDA Existente)', margin + 5, currentY);

  // Rodapé:
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    // Data exportação
    const dateStr = new Date().toLocaleDateString('pt-BR');
    doc.text(`Documento gerado em ${dateStr} - Motor de Engenharia Neonorte Kurupira`, margin, doc.internal.pageSize.height - 10);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin - 20, doc.internal.pageSize.height - 10);
  }

  // File Download
  const safeFilename = `Memorial_${clientData.clientName || projectName || 'Projeto'}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`${safeFilename}.pdf`);
};
