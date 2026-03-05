import { useState } from "react"
import { useForm, type Path } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CloudOff, CloudUpload, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SyncEngine } from "@/lib/sync-engine"

// Schema Zod (Cópia simplificada do Backend para validação no Client)
const formSchema = z.object({
  systemSize: z.coerce.number().min(0.5, "Mínimo 0.5 kWp"),
  monthlyAvgConsumption: z.coerce.number().positive("Consumo inválido"),
  location: z.object({
    city: z.string().min(3, "Cidade obrigatória"),
    state: z.string().length(2, "UF inválida"),
  }),
  hardware: z.object({
    panelBrand: z.enum(["trina", "jinko", "canadian", "longi"]),
    inverterBrand: z.enum(["sungrow", "growatt", "fronius", "huawei"]),
    structureType: z.enum(["ceramica", "fibrocimento", "metalica", "solo", "laje"]),
  })
})

type FormData = z.infer<typeof formSchema>

export function ProposalForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success-online" | "success-offline" | "error">("idle")

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      systemSize: 0,
      monthlyAvgConsumption: 0,
      location: { city: "", state: "AM" },
      hardware: {
        panelBrand: "canadian",
        inverterBrand: "sungrow",
        structureType: "metalica"
      }
    }
  })

  // Hack para Select do Shadcn funcionar com react-hook-form
  // Em prod idealmente usaríamos <FormField> do shadcn-form
  const handleSelectChange = (field: Path<FormData>, value: string) => {
    setValue(field, value, { shouldValidate: true })
  }

  const onSubmit = async (data: FormData) => {
    setStatus("submitting")
    
    // Preparar payload final (incluindo defaults que o form não tem)
    const payload = {
        ...data,
        tariffRate: 0.92, // Default
        location: {
            ...data.location,
            irradiation: 4.5 // Default
        },
        hardware: {
            ...data.hardware,
           panelPower: 550, // Default
           panelCount: Math.ceil((data.systemSize * 1000) / 550) // Auto-calc
        }
    }

    try {
      const result = await SyncEngine.fetchOrQueue('/api/v2/solar/proposals', 'POST', payload)
      
      if (result.ok) {
        if ('offline' in result && result.offline) {
             setStatus("success-offline")
        } else {
             setStatus("success-online")
        }
        // Reset form functionality could be added here
      } else {
        setStatus("error")
      }
    } catch (e) {
      console.error(e)
      setStatus("error")
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Nova Proposta Solar</CardTitle>
        <CardDescription>Crie uma proposta. Se estiver offline, ela será enviada depois.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="systemSize">Potência (kWp)</Label>
              <Input id="systemSize" type="number" step="0.1" placeholder="Ex: 5.5" {...register("systemSize")} />
              {errors.systemSize && <p className="text-red-500 text-xs">{errors.systemSize.message}</p>}
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="monthlyAvgConsumption">Consumo Médio (kWh)</Label>
                <Input id="monthlyAvgConsumption" type="number" placeholder="Ex: 500" {...register("monthlyAvgConsumption")} />
                 {errors.monthlyAvgConsumption && <p className="text-red-500 text-xs">{errors.monthlyAvgConsumption.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" placeholder="Manaus" {...register("location.city")} />
              {errors.location?.city && <p className="text-red-500 text-xs">{errors.location.city.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input id="state" placeholder="AM" {...register("location.state")} />
               {errors.location?.state && <p className="text-red-500 text-xs">{errors.location.state.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Marca Painel</Label>
              <Select onValueChange={(v) => handleSelectChange("hardware.panelBrand", v)} defaultValue="canadian">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="canadian">Canadian</SelectItem>
                  <SelectItem value="trina">Trina</SelectItem>
                  <SelectItem value="jinko">Jinko</SelectItem>
                  <SelectItem value="longi">Longi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Inversor</Label>
              <Select onValueChange={(v) => handleSelectChange("hardware.inverterBrand", v)} defaultValue="sungrow">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sungrow">Sungrow</SelectItem>
                  <SelectItem value="growatt">Growatt</SelectItem>
                  <SelectItem value="fronius">Fronius</SelectItem>
                   <SelectItem value="huawei">Huawei</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
             <div className="space-y-2">
              <Label>Estrutura</Label>
              <Select onValueChange={(v) => handleSelectChange("hardware.structureType", v)} defaultValue="metalica">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metalica">Metálica</SelectItem>
                  <SelectItem value="fibrocimento">Fibrocimento</SelectItem>
                  <SelectItem value="ceramica">Cerâmica</SelectItem>
                   <SelectItem value="solo">Solo</SelectItem>
                    <SelectItem value="laje">Laje</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {status === "error" && (
             <div className="p-3 bg-red-100 text-red-800 rounded-md text-sm">
                Erro ao enviar. Verifique os dados.
             </div>
          )}

          {status === "success-online" && (
             <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm flex items-center gap-2">
                <CloudUpload className="h-4 w-4" />
                Proposta criada com sucesso!
             </div>
          )}

           {status === "success-offline" && (
             <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md text-sm flex items-center gap-2">
                <CloudOff className="h-4 w-4" />
                Sem internet. Proposta salva na fila de sincronização.
             </div>
          )}

          <Button type="submit" className="w-full" disabled={status === "submitting"}>
            {status === "submitting" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar Proposta
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
