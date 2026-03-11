import React from 'react';
import { FileSignature, Download, AlertCircle } from 'lucide-react';
import { useSolarStore, selectClientData, selectLegalData } from '@/core/state/solarStore';
import { useProposalCalculator } from '../hooks/useProposalCalculator';
import { generateContract } from '../utils/generateContract';
import { DenseCard, DenseInput } from '@/components/ui/dense-form';
import { LegalDataSchema } from '@/core/schemas/contract.schemas';

export const ContractPreviewTab: React.FC = () => {
    const clientData = useSolarStore(selectClientData);
    const legalData = useSolarStore(selectLegalData);
    const setLegalData = useSolarStore(state => state.setLegalData);
    
    const calculator = useProposalCalculator();
    const { metrics, pricing } = calculator;
    const financeParams = useSolarStore(state => state.financeParams);

    // Initialize if null (first access)
    React.useEffect(() => {
        if (!legalData) {
            setLegalData({
                cpf: '',
                rg: '',
                nationality: 'Brasileiro(a)',
                maritalStatus: 'Casado(a)',
                profession: '',
                contractCity: clientData.city || 'Cidade',
            });
        }
    }, [legalData, setLegalData, clientData.city]);

    // Derived State for inputs (safeguard against null during render)
    const currentLegal = legalData || {
        cpf: '',
        rg: '',
        nationality: '',
        maritalStatus: '',
        profession: '',
        contractCity: ''
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLegalData({ ...currentLegal, [name]: value });
    };

    const handleGenerateContract = async () => {
        // Final Validation before generation
        const validation = LegalDataSchema.safeParse(currentLegal);
        if (!validation.success) {
            alert("Por favor, corrija os dados do contrato antes de gerar.\n" + validation.error.errors.map(e => e.message).join("\n"));
            return;
        }

        await generateContract({
            ...calculator,
            clientName: clientData.clientName || 'Cliente',
            clientAddress: {
                street: clientData.street || '',
                number: clientData.number || '',
                neighborhood: clientData.neighborhood || '',
                city: clientData.city || '',
                state: clientData.state || '',
                zipCode: clientData.zipCode || '',
            },
            systemSize: metrics.totalPowerkWp,
            price: pricing.finalPrice,
            financeParams,
            legal: currentLegal
        });
    };

    // Real-time Validation for UI Feedback
    const validationResult = LegalDataSchema.safeParse(currentLegal);
    const isFormComplete = validationResult.success;
    const errors = !validationResult.success ? validationResult.error.flatten().fieldErrors : {};

    return (
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-10">
            <div className="flex flex-col gap-2 mb-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <FileSignature className="text-purple-600" />
                    Gerar Contrato (Minuta)
                </h2>
                <p className="text-slate-500">
                    Preencha os dados civis do cliente para gerar a minuta contratual padrão.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Data Form */}
                <div className="flex flex-col gap-4">
                    <DenseCard className="p-6 bg-white border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Dados Civis (Contratante)</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <DenseInput 
                                    label="CPF / CNPJ" 
                                    name="cpf" 
                                    value={currentLegal.cpf} 
                                    onChange={handleInputChange} 
                                    placeholder="000.000.000-00"
                                    error={errors.cpf?.[0]}
                                />
                            </div>
                            
                            <div>
                                <DenseInput 
                                    label="RG / Documento" 
                                    name="rg" 
                                    value={currentLegal.rg} 
                                    onChange={handleInputChange} 
                                    placeholder="00.000.000-X"
                                    error={errors.rg?.[0]}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <DenseInput 
                                    label="Nacionalidade" 
                                    name="nationality" 
                                    value={currentLegal.nationality} 
                                    onChange={handleInputChange} 
                                />
                                <DenseInput 
                                    label="Estado Civil" 
                                    name="maritalStatus" 
                                    value={currentLegal.maritalStatus} 
                                    onChange={handleInputChange} 
                                />
                            </div>
                            
                            <div>
                                <DenseInput 
                                    label="Profissão" 
                                    name="profession" 
                                    value={currentLegal.profession} 
                                    onChange={handleInputChange} 
                                    placeholder="Ex: Engenheiro"
                                    error={errors.profession?.[0]}
                                />
                            </div>

                             <div>
                                <DenseInput 
                                    label="Cidade do Contrato" 
                                    name="contractCity" 
                                    value={currentLegal.contractCity} 
                                    onChange={handleInputChange}
                                    error={errors.contractCity?.[0]}
                                />
                             </div>
                        </div>
                    </DenseCard>
                </div>

                {/* Right: Summary & Action */}
                <div className="flex flex-col gap-4">
                     <DenseCard className="p-6 bg-slate-50 border-purple-200 border relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100/50 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                        
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Resumo do Contrato</h3>
                        
                        <div className="flex flex-col gap-3 text-sm text-slate-600 mb-6">
                            <div className="flex justify-between">
                                <span>Cliente:</span>
                                <span className="font-semibold text-slate-800">{clientData.clientName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Sistema:</span>
                                <span className="font-semibold text-slate-800">{metrics.totalPowerkWp.toFixed(2)} kWp</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Valor Total:</span>
                                <span className="font-semibold text-green-700">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pricing.finalPrice)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Condição:</span>
                                <span className="font-semibold text-blue-700">
                                    {financeParams.financingMode === 'financed' ? 'Financiamento Bancário' : 'Pagamento Próprio'}
                                </span>
                            </div>
                        </div>

                        {!isFormComplete && (
                            <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-xs flex items-start gap-2 mb-4 animate-in fade-in">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <span>Preencha os campos obrigatórios (CPF, RG, Profissão, Cidade) para finalizar.</span>
                            </div>
                        )}

                        <button
                            onClick={handleGenerateContract}
                            disabled={!isFormComplete}
                            className={`w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                                isFormComplete 
                                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-200 shadow-purple-100' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            <Download size={20} />
                            Baixar Minuta (PDF)
                        </button>
                        
                        <p className="text-[10px] text-slate-400 text-center mt-3">
                            *Documento sem valor jurídico até ser assinado.
                            <br/>
                            Verifique os dados antes de imprimir.
                        </p>
                    </DenseCard>
                </div>
            </div>
        </div>
    );
};
