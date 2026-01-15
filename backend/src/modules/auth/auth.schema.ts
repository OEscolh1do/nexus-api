import { z } from 'zod';

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(1, 'Senha obrigatória'),
  }),
});

export const RegisterSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    role: z.enum(['SALES', 'ENGINEER', 'ADMIN']).default('SALES'),
  }),
});

export const UpdateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: z.string().min(6).optional(),
  }).refine((data) => {
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  }, {
    message: "Senha atual é obrigatória para definir nova senha",
    path: ["newPassword"] // Path of error
  }),
});

export const AdminUpdateUserSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    email: z.string().email().optional(),
    role: z.enum(['SALES', 'ENGINEER', 'ADMIN']).optional(),
    password: z.string().min(6).optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});
