import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClientStepSchema, type ClientStepData, type WizardStepProps } from "../schemas";

export function StepClient({ data, updateData, onNext }: WizardStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientStepData>({
    resolver: zodResolver(ClientStepSchema),
    defaultValues: data.client || {
      clientName: "",
      email: "",
      phone: "",
    },
  });

  const onSubmit = (formData: ClientStepData) => {
    updateData("client", formData);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">Dados do Cliente</h2>
        <p className="text-slate-500 text-sm">Identifique o cliente para iniciar a proposta.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Nome Completo</label>
          <input
            type="text"
            {...register("clientName")}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Ex: Maria Silva"
          />
          {errors.clientName && <p className="text-red-500 text-xs">{errors.clientName.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Email (Opcional)</label>
            <input
              type="email"
              {...register("email")}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="maria@email.com"
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Telefone / WhatsApp</label>
            <input
              type="text"
              {...register("phone")}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="(00) 00000-0000"
            />
            {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
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
