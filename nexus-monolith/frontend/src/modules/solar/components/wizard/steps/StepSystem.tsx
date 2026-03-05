import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SystemStepSchema, type SystemStepData, type WizardStepProps } from "../schemas";
import { useEffect } from "react";

export function StepSystem({ data, updateData, onNext, onBack }: WizardStepProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SystemStepData>({
    resolver: zodResolver(SystemStepSchema) as any,
    defaultValues: {
      panelBrand: data.system?.panelBrand || "trina",
      panelPower: data.system?.panelPower || 550,
      inverterBrand: data.system?.inverterBrand || "growatt",
      structureType: data.system?.structureType || "ceramica",
      systemSize: data.system?.systemSize || 0,
      panelCount: data.system?.panelCount || 0
    } as SystemStepData,
  });

  // Calculate System Size automatically
  const consumption = data.consumption?.monthlyAvgConsumption || 0;
  const irradiation = 4.5; // Fixed for now, should come from Location
  const pr = 0.80; // Performance Ratio

  useEffect(() => {
    // Basic Sizing Logic
    // Generation = Size * HSP * 30 * PR
    // Size = Generation / (HSP * 30 * PR)
    if (consumption > 0 && !data.system?.systemSize) {
        const targetGeneration = consumption; // Cover 100%
        const requiredSize = targetGeneration / (irradiation * 30 * pr);
        
        // Round up to nearest panel
        const panelPowerKw = 0.550; // 550W default
        const panels = Math.ceil(requiredSize / panelPowerKw);
        const finalSize = panels * panelPowerKw;

        setValue("systemSize", parseFloat(finalSize.toFixed(2)));
        setValue("panelCount", panels);
        
        // Also update local form state immediately for UI
    }
  }, [consumption, setValue, data.system]);

  const onSubmit = (formData: any) => {
    updateData("system", formData);
    onNext();
  };

  const sysSize = watch("systemSize");
  const pCount = watch("panelCount");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">Dimensionamento do Sistema</h2>
        <p className="text-slate-500 text-sm">Defina o hardware e a potência do projeto.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 p-6 rounded-2xl col-span-2 border border-slate-200 flex justify-between items-center">
             <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Potência Sugerida</p>
                 <p className="text-3xl font-black text-slate-800">{sysSize} <span className="text-sm text-slate-500">kWp</span></p>
             </div>
             <div className="text-right">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nº Módulos</p>
                 <p className="text-3xl font-black text-slate-800">{pCount}</p>
             </div>
        </div>

        <div className="space-y-2">
           <label className="text-sm font-semibold text-slate-700">Marca dos Módulos</label>
           <select {...register("panelBrand")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none">
               <option value="trina">Trina Solar</option>
               <option value="jinko">Jinko</option>
               <option value="canadian">Canadian</option>
               <option value="longi">Longi</option>
           </select>
        </div>

        <div className="space-y-2">
           <label className="text-sm font-semibold text-slate-700">Potência do Módulo (W)</label>
           <input
             type="number"
             {...register("panelPower")}
             className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none"
             placeholder="550"
           />
           {errors.panelPower && <p className="text-red-500 text-xs">{errors.panelPower.message}</p>}
        </div>

        <div className="space-y-2">
           <label className="text-sm font-semibold text-slate-700">Inversor</label>
           <select {...register("inverterBrand")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none">
               <option value="growatt">Growatt</option>
               <option value="sungrow">Sungrow</option>
               <option value="fronius">Fronius</option>
               <option value="huawei">Huawei</option>
           </select>
        </div>

        <div className="space-y-2">
           <label className="text-sm font-semibold text-slate-700">Estrutura</label>
           <select {...register("structureType")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none">
               <option value="ceramica">Telha Cerâmica</option>
               <option value="fibrocimento">Fibrocimento</option>
               <option value="metalica">Metálica</option>
               <option value="laje">Laje Plana</option>
               <option value="solo">Solo</option>
           </select>
        </div>
      </div>

       {/* Hidden inputs to ensure they are registered and submitted if not manually edited */}
       <input type="hidden" {...register("systemSize")} />
       <input type="hidden" {...register("panelCount")} />

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">Voltar</button>
        <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">Revisar Proposta</button>
      </div>
    </form>
  );
}
