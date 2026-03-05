import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LocationStepSchema, type LocationStepData, type WizardStepProps } from "../schemas";
import { MapPin } from "lucide-react";

export function StepLocation({ data, updateData, onNext, onBack }: WizardStepProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LocationStepData>({
    resolver: zodResolver(LocationStepSchema),
    defaultValues: data.location || {
      street: "",
      number: "",
      neighborhood: "",
      city: "Marabá",
      state: "PA",
      lat: -5.36,
      lng: -49.08,
      availableArea: 0
    },
  });

  // Mock Geolocation Auto-fill
  useEffect(() => {
     if (!data.location?.lat) {
         // Default to hypothetical user location
         setValue("city", "Marabá");
         setValue("state", "PA");
     }
  }, [data.location, setValue]);

  const onSubmit = (formData: LocationStepData) => {
    updateData("location", formData);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">Localização do Projeto</h2>
        <p className="text-slate-500 text-sm">Onde o sistema será instalado? (Irradiação depende disso)</p>
      </div>

      {/* Mock Map Placeholder */}
      <div className="w-full h-48 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 gap-2 mb-6">
          <MapPin size={24} />
          <span>Mapa Interativo (Simulado)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 col-span-2">
           <label className="text-sm font-semibold text-slate-700">Rua / Logradouro</label>
           <input
            {...register("street")}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Av. Principal"
           />
           {errors.street && <p className="text-red-500 text-xs">{errors.street.message}</p>}
        </div>

        <div className="space-y-2">
           <label className="text-sm font-semibold text-slate-700">Número</label>
           <input
            {...register("number")}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="123"
           />
           {errors.number && <p className="text-red-500 text-xs">{errors.number.message}</p>}
        </div>

        <div className="space-y-2">
           <label className="text-sm font-semibold text-slate-700">Bairro</label>
           <input
            {...register("neighborhood")}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Centro"
           />
           {errors.neighborhood && <p className="text-red-500 text-xs">{errors.neighborhood.message}</p>}
        </div>

        <div className="space-y-2">
           <label className="text-sm font-semibold text-slate-700">Cidade</label>
           <input
            {...register("city")}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Cidade"
           />
           {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
        </div>

        <div className="space-y-2">
           <label className="text-sm font-semibold text-slate-700">Estado (UF)</label>
           <input
            {...register("state")}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase"
            maxLength={2}
            placeholder="UF"
           />
           {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
        </div>
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
