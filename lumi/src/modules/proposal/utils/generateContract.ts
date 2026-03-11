import { jsPDF } from 'jspdf';
import { ProposalCalculations } from '../types';
import { FinanceParams } from '../../finance/store/financeSchema';

// Interface for Legal/Civil Data not in CRM yet
export interface LegalData {
    cpf: string;
    rg: string;
    nationality: string;
    maritalStatus: string;
    profession: string;
    contractCity: string; // For the signature line
}

interface ContractData extends ProposalCalculations {
    clientName: string;
    clientAddress: {
        street: string;
        number: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
    };
    systemSize: number;
    price: number;
    financeParams?: FinanceParams;
    legal: LegalData;
}

export const generateContract = async (data: ContractData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let cursorY = 20;

    // --- HELPER FUNCTIONS ---
    const addParagraph = (text: string, isBold: boolean = false) => {
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);

        if (cursorY + (lines.length * 5) > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }

        doc.text(lines, margin, cursorY);
        cursorY += (lines.length * 5) + 3; // Line height + spacing
    };

    const addClause = (title: string, content: string) => {
        if (cursorY + 20 > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }

        doc.setFont("helvetica", "bold");
        doc.text(title, margin, cursorY);
        cursorY += 6;

        addParagraph(content);
        cursorY += 4;
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // --- DOCUMENT CONTENT ---

    // Header
    doc.setFontSize(10);
    doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS E FORNECIMENTO DE EQUIPAMENTOS", pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 15;

    // 1. QUALIFICAÇÃO
    addClause("1. DAS PARTES", "");

    // Contratada (Hardcoded for Neonorte)
    const companyText = `CONTRATADA: NEONORTE TECNOLOGIA E ENERGIA SOLAR, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº XX.XXX.XXX/0001-XX, com sede em [ENDEREÇO DA EMPRESA], neste ato representada na forma de seu Contrato Social.`;
    addParagraph(companyText);

    // Contratante
    const clientText = `CONTRATANTE: ${data.clientName.toUpperCase()}, ${data.legal.nationality}, ${data.legal.maritalStatus}, ${data.legal.profession}, portador(a) do RG nº ${data.legal.rg} e inscrito(a) no CPF/MF sob o nº ${data.legal.cpf}, residente e domiciliado(a) na ${data.clientAddress.street}, nº ${data.clientAddress.number}, Bairro ${data.clientAddress.neighborhood}, Cidade ${data.clientAddress.city}, Estado ${data.clientAddress.state}, CEP ${data.clientAddress.zipCode}.`;
    addParagraph(clientText);

    addParagraph("Resolvem as partes, de comum acordo, celebrar o presente Contrato, regido pelas cláusulas e condições a seguir:");

    // 2. OBJETO
    addClause("2. DO OBJETO",
        `O presente contrato tem por objeto o fornecimento e instalação de um Sistema de Geração de Energia Solar Fotovoltaica com potência de ${data.metrics.totalPowerkWp.toFixed(2)} kWp, a ser instalado no endereço do CONTRATANTE acima citado.`);

    // 3. EQUIPAMENTOS (Description)
    const equipmentDesc = `O sistema é composto pelos seguintes equipamentos principais:
- ${data.metrics.totalModules}x Módulos Fotovoltaicos
- ${data.metrics.totalInverters}x Inversores
- Estrutura de fixação, cabos, proteções e materiais elétricos necessários para o perfeito funcionamento.`;
    addClause("3. DOS EQUIPAMENTOS E MATERIAIS", equipmentDesc);

    // 4. SERVIÇOS
    addClause("4. DOS SERVIÇOS INCLUSOS",
        "A CONTRATADA obriga-se a realizar: \na) Elaboração do projeto técnico executivo e solicitação de acesso junto à concessionária de energia;\nb) Fornecimento e transporte dos equipamentos até o local da obra;\nc) Instalação mecânica e elétrica do sistema;\nd) Comissionamento e testes de funcionamento.");

    // 5. PREÇO E PAGAMENTO
    const isFinanced = data.financeParams?.financingMode === 'financed';
    let paymentText = "";

    if (isFinanced) {
        const downPayment = data.financeParams?.downPayment || 0;
        const installment = data.financials.monthlyInstallment || 0;
        const term = data.financeParams?.loanTerm || 60;
        const bankName = "Instituição Bancária"; // Could be a param

        paymentText = `Pelo fornecimento dos bens e execução dos serviços, o CONTRATANTE pagará à CONTRATADA o valor total de ${formatCurrency(data.price)}.
        
Forma de Pagamento (Financiamento):
a) Entrada de ${formatCurrency(downPayment)} a ser paga diretamente à CONTRATADA na assinatura deste contrato.
b) O saldo restante será financiado em ${term} parcelas de aproximadamente ${formatCurrency(installment)} (sujeito à análise e aprovação de crédito junto à ${bankName}), conforme contrato de financiamento específico a ser assinado pelo CONTRATANTE.`;
    } else {
        paymentText = `Pelo fornecimento dos bens e execução dos serviços, o CONTRATANTE pagará à CONTRATADA o valor total de ${formatCurrency(data.price)}.
        
Forma de Pagamento (À Vista/Próprio):
O pagamento será realizado conforme cronograma financeiro acordado entre as partes (ex: 50% na assinatura, 50% na entrega).`;
    }

    addClause("5. DO PREÇO E CONDIÇÕES DE PAGAMENTO", paymentText);

    // 6. PRAZO
    addClause("6. DO PRAZO DE EXECUÇÃO",
        "O prazo estimado para a conclusão da instalação e solicitação de vistoria é de 30 (trinta) dias úteis após a confirmação do pagamento (ou liberação do financiamento) e aprovação do parecer de acesso pela concessionária.");

    // 7. GARANTIA
    addClause("7. DAS GARANTIAS",
        "A CONTRATADA oferece garantia de instalação de 12 (doze) meses. As garantias dos equipamentos (inversores e módulos) são ofertadas diretamente pelos respectivos fabricantes, conforme termos de garantia anexos à Proposta Comercial.");

    // 8. OBRIGAÇÕES
    addClause("8. DAS OBRIGAÇÕES DO CONTRATANTE",
        "Compromete-se o CONTRATANTE a:\na) Fornecer livre acesso ao local da instalação;\nb) Disponibilizar ponto de conexão à internet para monitoramento;\nc) Garantir a integridade estrutural do telhado/local de instalação;\nd) Assinar tempestivamente os documentos exigidos pela concessionária.");

    // 9. FORO
    addClause("9. DO FORO",
        `Fica eleito o Foro da Comarca de ${data.legal.contractCity}/${data.clientAddress.state}, para dirimir quaisquer dúvidas oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.`);

    // SIGNATURES
    cursorY += 30; // Spacing before signatures
    if (cursorY + 50 > pageHeight - margin) {
        doc.addPage();
        cursorY = margin + 20;
    }

    const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`${data.legal.contractCity}, ${today}.`, margin, cursorY);
    cursorY += 30;

    // Signature Lines
    const lineX = margin;
    const lineWidth = (pageWidth - (margin * 3)) / 2;

    // Company Line
    doc.line(lineX, cursorY, lineX + lineWidth, cursorY);
    doc.setFontSize(8);
    doc.text("NEONORTE TECNOLOGIA", lineX + 10, cursorY + 5);

    // Client Line
    const clientX = lineX + lineWidth + margin;
    doc.line(clientX, cursorY, clientX + lineWidth, cursorY);
    doc.text(data.clientName.toUpperCase(), clientX + 10, cursorY + 5);
    doc.text(`CPF: ${data.legal.cpf}`, clientX + 10, cursorY + 9);

    cursorY += 30;
    doc.setFontSize(8);
    doc.text("Testemunha 1: _____________________________", margin, cursorY);
    doc.text("CPF:", margin, cursorY + 4);

    doc.text("Testemunha 2: _____________________________", margin + 100, cursorY);
    doc.text("CPF:", margin + 100, cursorY + 4);

    // Save
    doc.save(`Contrato_${data.clientName.replace(/\s+/g, '_')}.pdf`);
};
