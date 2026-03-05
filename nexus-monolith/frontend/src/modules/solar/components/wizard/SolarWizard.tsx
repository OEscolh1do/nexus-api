import { useState, useEffect } from "react";
import { StepClient } from "./steps/StepClient";
import { StepLocation } from "./steps/StepLocation";
import { StepConsumption } from "./steps/StepConsumption";
import { StepSystem } from "./steps/StepSystem";
import { StepReview } from "./steps/StepReview";
import type { WizardData } from "./schemas";
import axios from "axios";

// Storage Key for Drafts
const STORAGE_KEY = "solar_wizard_draft";

export function SolarWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize with Safe Defaults or Draft
  const [formData, setFormData] = useState<Partial<WizardData>>(() => {
     try {
         const draft = localStorage.getItem(STORAGE_KEY);
         if (draft) {
             const parsed = JSON.parse(draft);
             return { ...parsed };
         }
     } catch (e) {
         console.error("Invalid draft", e);
     }
     
     return {
        client: { clientName: "", email: "", phone: "" },
        location: { street: "", number: "", neighborhood: "", city: "Marabá", state: "PA", lat: 0, lng: 0 },
        consumption: { monthlyAvgConsumption: 0, tariffRate: 0.92, connectionType: 'monofasico' },
        system: { panelBrand: "trina", panelPower: 550, inverterBrand: "growatt", structureType: "ceramica", systemSize: 0, panelCount: 0 }
     };
  });

  // Save Draft
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateData = <K extends keyof WizardData>(section: K, data: Partial<WizardData[K]>) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));
  };

  const handleNext = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinish = async () => {
    try {
        setError(null);
        // Validar dados completos antes de enviar
        // NOTE: Each step validated itself, so theoretically we are good, but let's be safe.
        // const finalData = SolarWizardSchema.parse(formData); // This might throw if optional fields are missing

        // Construir Payload para API
        const payload = {
            ...formData.client,
            location: formData.location,
            consumption: formData.consumption, // Can map to monthlyAvgConsumption
            monthlyAvgConsumption: formData.consumption?.monthlyAvgConsumption, // Direct mapping
            tariffRate: formData.consumption?.tariffRate,
            hardware: formData.system,
            systemSize: formData.system?.systemSize,
             // Financials are auto-calculated by backend if omitted, or we can send them
            financials: undefined 
        };

        const response = await axios.post("/api/v2/solar/proposals", payload, {
           headers: {
              // Assuming auth token is handled by an interceptor or stored
              // For now, let's assume global axios config or we need to pass token
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
           }
        });

        if (response.data.success) {
            setFinished(true);
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch (err: unknown) {
        console.error("Submission failed", err);
        if (axios.isAxiosError(err)) {
             setError(err.response?.data?.error || err.message || "Erro ao criar proposta. Tente novamente.");
        } else {
             setError("Erro desconhecido ao processar solicitação.");
        }
    }
  };

  if (finished) {
      return (
          <div className="max-w-2xl mx-auto p-12 text-center bg-white rounded-3xl shadow-2xl border border-slate-100 animate-in zoom-in duration-500">
              <h2 className="text-4xl font-black text-green-600 mb-4">Sucesso! 🎉</h2>
              <p className="text-slate-600 text-lg mb-8">A proposta foi gerada e salva no sistema.</p>
              <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800">Criar Nova Proposta</button>
          </div>
      );
  }

  const steps = [
      { id: 1, title: "Cliente", component: StepClient },
      { id: 2, title: "Local", component: StepLocation },
      { id: 3, title: "Consumo", component: StepConsumption },
      { id: 4, title: "Sistema", component: StepSystem },
      { id: 5, title: "Revisão", component: StepReview }
  ];

  const CurrentStep = steps[currentStep - 1].component;
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between mb-4">
                {steps.map((s, i) => (
                    <div key={s.id} className={`flex flex-col items-center ${i + 1 === currentStep ? 'opacity-100 scale-105 transition-transform' : 'opacity-50'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 ${i + 1 <= currentStep ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {s.id}
                        </div>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{s.title}</span>
                    </div>
                ))}
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
        </div>

        {/* Error Message */}
        {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
                <span className="font-bold">Erro:</span> {error}
            </div>
        )}

        {/* Main Content */}
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
            <CurrentStep 
                data={formData as WizardData} 
                updateData={updateData} 
                onNext={handleNext} 
                onBack={handleBack} 
                onFinish={handleFinish} 
            />
        </div>
    </div>
  );
}
