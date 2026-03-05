import { SolarWizard } from '@/modules/solar/components/wizard/SolarWizard';

export function SolarWizardView() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
           <header className="mb-8 flex justify-between items-center">
             <div>
                <h1 className="text-3xl font-bold text-slate-800">Dossiê Solar</h1>
                <p className="text-slate-500">Novo estudo de viabilidade técnica (TNO Wizard)</p>
             </div>
             {/* 
                We can add a button here to switch to Legacy Mode if strictly needed, 
                but for hardening we want to enforce the new secure wizard.
             */}
           </header>
           
           <SolarWizard />
        </div>
    </div>
  );
}
