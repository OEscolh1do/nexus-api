import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConsumptionStepSchema, type ConsumptionStepData, type WizardStepProps } from "../schemas";

export function StepConsumption({ data, updateData, onNext, onBack }: WizardStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConsumptionStepData>({
    resolver: zodResolver(ConsumptionStepSchema) as any,
    defaultValues: {
      monthlyAvgConsumption: data.consumption?.monthlyAvgConsumption || 0,
      tariffRate: data.consumption?.tariffRate || 0.92,
      connectionType: data.consumption?.connectionType || "monofasico"
    } as ConsumptionStepData,
  });

  const onSubmit = (formData: any) => {
    updateData("consumption", formData);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">Consumo Energético</h2>
        <p className="text-slate-500 text-sm">Qual a demanda de energia do cliente?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
           <label className="text-sm font-semibold text-slate-700">Média Mensal (kWh)</label>
           <div className="relative">
             <input
              type="number"
              {...register("monthlyAvgConsumption")}
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
              placeholder="0"
             />
             <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">kWh</span>
           </div>
           {errors.monthlyAvgConsumption && <p className="text-red-500 text-xs">{errors.monthlyAvgConsumption.message}</p>}
        </div>

        <div className="space-y-2">
           <label className="text-sm font-semibold text-slate-700">Tarifa de Energia (R$/kWh)</label>
           <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
              <input
                type="number" step="0.01"
                {...register("tariffRate")}
                className="w-full pl-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
                placeholder="0.92"
              />
           </div>
           {errors.tariffRate && <p className="text-red-500 text-xs">{errors.tariffRate.message}</p>}
        </div>

        <div className="space-y-2 col-span-2">
           <label className="text-sm font-semibold text-slate-700">Tipo de Conexão</label>
           <select
            {...register("connectionType")}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
           >
             <option value="monofasico">Monofásico (30kWh custo disp.)</option>
             <option value="bifasico">Bifásico (50kWh custo disp.)</option>
             <option value="trifasico">Trifásico (100kWh custo disp.)</option>
           </select>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm">
        💡 <strong>Dica:</strong> Verifique a fatura de energia para obter a média dos últimos 12 meses.
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
        >
          Voltar
        </button>
        <button
          type="submit"
          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
        >
          Próximo
        </button>
      </div>
    </form>
  );
}
