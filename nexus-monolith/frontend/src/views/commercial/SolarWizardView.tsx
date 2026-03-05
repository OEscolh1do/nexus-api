import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, Upload, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  'Fatura & OCR',
  'Vistoria Digital',
  'Dimensionamento',
  'Simulação',
  'Proposta Final'
];

export const SolarWizardView: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);

    // Form States
    const [photos, setPhotos] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Mock Upload Logic
    const handlePhotoUpload = () => {
        // In real app, this would use a file input and upload service
        setPhotos([...photos, `http://mock.url/photo_${photos.length + 1}.jpg`]);
        setError(null);
    };

    const handleNext = () => {
        setError(null);

        // Step 2 Guardrail: Vistoria Digital
        if (currentStep === 1) {
            if (photos.length < 3) {
                setError("Obrigatório: Envie pelo menos 3 fotos (Telhado, Padrão, Disjuntores) para prosseguir (Regra Sem Jeitinho).");
                return;
            }
        }

        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    // Render Steps
    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-4">
                        <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                            <h3 className="text-blue-700 font-semibold">Upload da Fatura</h3>
                            <p className="text-sm text-blue-600">O sistema irá extrair automaticamente o consumo médio.</p>
                        </div>
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer">
                            <Upload className="w-10 h-10 mb-2" />
                            <span>Arraste a fatura PDF aqui</span>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-6">
                         <div className="bg-amber-50 border-l-4 border-amber-600 p-4">
                            <h3 className="text-amber-700 font-semibold">Vistoria Digital Obrigatória</h3>
                            <p className="text-sm text-amber-600">A engenharia exige fotos nítidas do Padrão de Entrada e Telhado.</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={handlePhotoUpload}>
                                <Camera className="w-6 h-6" />
                                <span>Adicionar Foto</span>
                            </Button>
                            {photos.map((_, index) => (
                                <div key={index} className="h-24 bg-slate-100 rounded border flex items-center justify-center relative">
                                    <span className="text-xs text-slate-500">Foto {index + 1}</span>
                                    <CheckCircle2 className="w-4 h-4 text-green-500 absolute top-1 right-1" />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400">Total: {photos.length} fotos (Mínimo: 3)</p>
                    </div>
                );
            case 2: return <div>Dimensionamento (Simulado)</div>;
            case 3: return <div>Simulação Financeira (ROI/Payback)</div>;
            case 4: return <div>Geração de Contrato</div>;
            default: return null;
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            {/* Stepper Header */}
            <div className="flex items-center justify-between mb-8">
                {STEPS.map((label, index) => (
                    <div key={index} className="flex flex-col items-center relative z-10">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                            index <= currentStep ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-300 text-slate-400"
                        )}>
                            {index + 1}
                        </div>
                        <span className={cn(
                            "text-xs mt-1 absolute -bottom-6 w-24 text-center", 
                            index === currentStep ? "text-blue-700 font-bold" : "text-slate-400"
                        )}>{label}</span>
                    </div>
                ))}
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-6 min-h-[400px]">
                {error && (
                    <div className="mb-4 bg-red-50 text-red-600 p-3 rounded flex items-center gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                    </div>
                )}
                
                {renderStepContent()}
            </div>

            <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))} disabled={currentStep === 0}>
                    Voltar
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleNext}>
                    {currentStep === STEPS.length - 1 ? 'Concluir & Enviar' : 'Próximo'}
                </Button>
            </div>
        </div>
    );
};

export default SolarWizardView;
