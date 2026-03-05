import { z } from "zod";

// Zod Schemas (Matching Backend strictness where possible)

export const ClientStepSchema = z.object({
  clientName: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido").or(z.literal("")).optional(),
  phone: z.string().min(10, "Telefone inválido (mínimo 10 dígitos)"),
});

export const LocationStepSchema = z.object({
  // Address
  street: z.string().min(3, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  neighborhood: z.string().min(3, "Bairro é obrigatório"),
  city: z.string().min(3, "Cidade é obrigatória"),
  state: z.string().length(2, "Estado (UF) deve ter 2 letras"),
  
  // Coordinates & Map
  lat: z.number(),
  lng: z.number(),
  availableArea: z.number().min(0, "Área deve ser positiva").optional(),
});

export const ConsumptionStepSchema = z.object({
  monthlyAvgConsumption: z.coerce.number().min(1, "Consumo médio deve ser maior que 0"),
  tariffRate: z.coerce.number().min(0.1, "Tarifa inválida").default(0.92),
  connectionType: z.enum(["monofasico", "bifasico", "trifasico"]).default("monofasico"),
});

export const SystemStepSchema = z.object({
  panelBrand: z.enum(["trina", "jinko", "canadian", "longi"]),
  panelPower: z.coerce.number().min(300).max(800),
  inverterBrand: z.enum(["sungrow", "growatt", "fronius", "huawei"]),
  structureType: z.enum(["ceramica", "fibrocimento", "metalica", "solo", "laje"]),
  // Computed or Input
  systemSize: z.coerce.number().positive("Potência do sistema deve ser positiva"),
  panelCount: z.coerce.number().int().positive(),
});

// Combined Wizard Data Type
export const SolarWizardSchema = z.object({
  client: ClientStepSchema,
  location: LocationStepSchema,
  consumption: ConsumptionStepSchema,
  system: SystemStepSchema,
});

export type WizardData = z.infer<typeof SolarWizardSchema>;
export type ClientStepData = z.infer<typeof ClientStepSchema>;
export type LocationStepData = z.infer<typeof LocationStepSchema>;
export type ConsumptionStepData = z.infer<typeof ConsumptionStepSchema>;
export type SystemStepData = z.infer<typeof SystemStepSchema>;

export interface WizardStepProps {
  data: Partial<WizardData>;
  updateData: (section: keyof WizardData, data: any) => void;
  onNext: () => void;
  onBack: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}
