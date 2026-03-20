
import { z } from "zod";

export const LegalDataSchema = z.object({
    cpf: z.string().min(11, "CPF inválido").max(14),
    rg: z.string().min(5, "RG inválido"),
    nationality: z.string().min(3),
    maritalStatus: z.string().min(3),
    profession: z.string().min(3),
    contractCity: z.string().min(3),
});

export type LegalData = z.infer<typeof LegalDataSchema>;
