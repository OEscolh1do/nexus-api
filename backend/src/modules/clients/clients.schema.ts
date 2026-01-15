import { z } from 'zod';

const ContractAccountSchema = z.object({
  uc: z.string().optional(),
  type: z.string().optional(),
});

export const CreateClientSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nome é obrigatório'),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    cpf_cnpj: z.string().optional(),
    zip: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    contractAccounts: z.array(ContractAccountSchema).optional(),
  }),
});

export const UpdateClientSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    name: z.string().min(3).optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    cpf_cnpj: z.string().optional(),
    zip: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    contractAccounts: z.array(ContractAccountSchema).optional(),
  }),
});
