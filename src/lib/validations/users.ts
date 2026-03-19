import { z } from 'zod'

export const createAdminSchema = z.object({
  full_name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(3, 'Mínimo 3 caracteres'),
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Correo inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Debe tener mayúscula, minúscula y número'
    ),
  tenant_id: z
    .string()
    .uuid('Oficina inválida')
    .min(1, 'La oficina es requerida'),
})

export type CreateAdminInput = z.infer<typeof createAdminSchema>