import { useState } from "react";
import { CheckCircle2, TrendingUp, Wallet } from "lucide-react";
import type { WizardData, WizardStepProps } from "../schemas";

interface ReviewProps extends WizardStepProps {
    data: WizardData; // Here data is fully populated supposedly
    onFinish: () => void;
}

export function StepReview({ data, onBack, onFinish }: ReviewProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
      setLoading(true);
      await onFinish();
      setLoading(false);
  };

  // Safe access with fallbacks
  const consumption = data.consumption?.monthlyAvgConsumption || 0;
  const size = data.system?.systemSize || 0;
  const investment = size * 3500; // Mock calculation
  const savings = consumption * (data.consumption?.tariffRate || 0.92);
  const payback = investment / (savings * 12);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Tudo Pronto!</h2>
        <p className="text-slate-500">Revise os dados antes de gerar a proposta final.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Resumo Técnico</h3>
              <ul className="space-y-3 text-sm">
                  <li className="flex justify-between"><span>Cliente:</span> <span className="font-bold">{data.client?.clientName}</span></li>
                  <li className="flex justify-between"><span>Cidade:</span> <span>{data.location?.city}/{data.location?.state}</span></li>
                  <li className="flex justify-between"><span>Consumo:</span> <span>{consumption} kWh</span></li>
                  <li className="flex justify-between"><span>Sistema:</span> <span className="font-bold text-blue-600">{size} kWp</span></li>
                  <li className="flex justify-between"><span>Módulos:</span> <span>{data.system?.panelCount}x {data.system?.panelBrand}</span></li>
              </ul>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Estimativa Financeira</h3>
               <div className="space-y-4">
                   <div className="flex items-center gap-3">
                       <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Wallet size={20}/></div>
                       <div>
                           <p className="text-xs text-slate-500 uppercase">Investimento Estimado</p>
                           <p className="text-xl font-bold text-slate-800">R$ {investment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                       </div>
                   </div>
                   <div className="flex items-center gap-3">
                       <div className="bg-green-100 p-2 rounded-lg text-green-600"><TrendingUp size={20}/></div>
                       <div>
                           <p className="text-xs text-slate-500 uppercase">Economia Mensal</p>
                           <p className="text-xl font-bold text-slate-800">R$ {savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                       </div>
                   </div>
                   <div className="pt-2 border-t border-slate-200">
                       <p className="text-sm text-slate-600">Payback estimado: <span className="font-bold">{payback.toFixed(1)} anos</span></p>
                   </div>
               </div>
          </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
          disabled={loading}
        >
          Voltar e Editar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="px-10 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-xl shadow-green-600/20 flex items-center gap-2"
        >
          {loading ? "Gerando..." : "Gerar Proposta Agora"}
        </button>
      </div>
    </div>
  );
}
