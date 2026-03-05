import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, Button, Input, Badge } from "../../components/ui/mock-components"; 
// Note: reusing mock-components relative path assuming it's same structure.
// Wait, ProjectCockpit and InspectionWizard are adjacent.
import { CheckCircle2, Save, WifiOff, UploadCloud, ChevronRight, ChevronLeft, Camera } from "lucide-react";
import { SyncEngine } from "../../lib/sync-engine";

// --- SCHEMAS ---
const locationSchema = z.object({
  latitude: z.string(),
  longitude: z.string(),
  address: z.string().min(5, "Endereço necessário")
});

const structuralSchema = z.object({
  roofType: z.enum(["FIBROCIMENTO", "CERAMICO", "METALICO", "LAJE"]),
  structureCondition: z.enum(["BOA", "REGULAR", "RUIM"]),
  notes: z.string().optional()
});

const fullSchema = z.object({
  location: locationSchema,
  structural: structuralSchema,
  projectId: z.string() // Should come from context/param
});

export function InspectionWizard() {
  const [step, setStep] = useState(1);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  
  // Listen to network status
  window.addEventListener('online', () => setOfflineMode(false));
  window.addEventListener('offline', () => setOfflineMode(true));

  const { register, handleSubmit, formState: { errors }, trigger, setValue } = useForm({
    resolver: zodResolver(fullSchema),
    defaultValues: {
        projectId: "123", // Mock param
        location: { latitude: "", longitude: "", address: "" },
        structural: { roofType: "FIBROCIMENTO", structureCondition: "BOA", notes: "" }
    }
  });

  const nextStep = async () => {
    let valid = false;
    if (step === 1) valid = await trigger("location");
    if (step === 2) valid = await trigger("structural");
    
    if (valid) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const onSubmit = async (data: z.infer<typeof fullSchema>) => {
    try {
        // Envia para o Sync Engine (que decide entre Rede ou Fila)
        await SyncEngine.fetchOrQueue(
            \`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/v2/ops/inspections\`,
            'POST',
            data
        );
        alert(offlineMode ? "Vistoria salva no dispositivo! Será enviada quando houver internet." : "Vistoria enviada com sucesso!");
        setStep(1); // Reset
    } catch (error) {
        alert("Erro fatal ao salvar vistoria.");
        console.error(error);
    }
  };

  const getLocation = () => {
     if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition((pos) => {
             setValue("location.latitude", pos.coords.latitude.toString());
             setValue("location.longitude", pos.coords.longitude.toString());
         });
     }
  }

  return (
    <div className="max-w-md mx-auto h-full flex flex-col py-4">
      {/* HEADER MOBILE */}
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">Vistoria Técnica 📱</h1>
          {offlineMode ? <Badge className="bg-amber-600"><WifiOff size={14} className="mr-1"/> Offline</Badge> : <Badge className="bg-emerald-600"><UploadCloud size={14} className="mr-1"/> Online</Badge>}
      </div>

      {/* STEPS PROGRESS */}
      <div className="flex gap-2 mb-6">
          {[1,2,3].map(i => (
              <div key={i} className={`h-2 flex-1 rounded-full ${step >= i ? 'bg-primary' : 'bg-slate-200'}`} />
          ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
          <Card className="flex-1 p-4 mb-4 overflow-y-auto">
            {step === 1 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center"><CheckCircle2 className="mr-2"/> Localização</h2>
                    
                    <div>
                        <label className="text-sm font-medium">Coordenadas GPS</label>
                        <div className="flex gap-2">
                            <Input placeholder="Lat" {...register("location.latitude")} readOnly />
                            <Input placeholder="Long" {...register("location.longitude")} readOnly />
                        </div>
                        <Button type="button" onClick={getLocation} size="sm" className="mt-2 w-full" variant="outline">📍 Capturar GPS Atual</Button>
                    </div>

                    <div>
                         <label className="text-sm font-medium">Endereço Confirmado</label>
                         <Input placeholder="Rua, Número, Bairro..." {...register("location.address")}/>
                         {errors.location?.address && <p className="text-xs text-red-500">{String(errors.location.address.message)}</p>}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center"><Camera className="mr-2"/> Dados Estruturais</h2>
                    
                    <div>
                        <label className="text-sm font-medium">Tipo de Telhado</label>
                        <select {...register("structural.roofType")} className="w-full border rounded-md p-2">
                            <option value="FIBROCIMENTO">Fibrocimento</option>
                            <option value="CERAMICO">Cerâmico</option>
                            <option value="METALICO">Metálico</option>
                            <option value="LAJE">Laje Plana</option>
                        </select>
                    </div>

                     <div>
                        <label className="text-sm font-medium">Condição da Estrutura</label>
                        <select {...register("structural.structureCondition")} className="w-full border rounded-md p-2">
                            <option value="BOA">Boa (Sem reforço)</option>
                            <option value="REGULAR">Regular (Pequeno reforço)</option>
                            <option value="RUIM">Ruim (Troca necessária)</option>
                        </select>
                    </div>
                    
                    <div>
                         <label className="text-sm font-medium">Observações</label>
                         <Input placeholder="Detalhes..." {...register("structural.notes")}/>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-4 text-center py-10">
                    <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
                    <h2 className="text-xl font-bold">Pronto para Enviar!</h2>
                    <p className="text-muted-foreground">
                        {offlineMode 
                            ? "Você está OFFLINE. Os dados serão salvos no dispositivo e enviados automaticamente quando a conexão voltar." 
                            : "Você está ONLINE. Os dados serão enviados imediatamente para o servidor da Neonorte."}
                    </p>
                </div>
            )}
          </Card>

          {/* ACTIONS FOOTER */}
          <div className="flex justify-between gap-4">
              {step > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                      <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                  </Button>
              )}
              
              {step < 3 ? (
                  <Button type="button" onClick={nextStep} className="flex-1">
                      Próximo <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
              ) : (
                  <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                      <Save className="mr-2 h-4 w-4" /> Finalizar Vistoria
                  </Button>
              )}
          </div>
      </form>
    </div>
  );
}
