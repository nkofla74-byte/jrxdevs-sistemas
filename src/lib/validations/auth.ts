import { z } from 'zod'

// =============================================
// LOGIN
// =============================================
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Correo inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'Mínimo 8 caracteres'),
  device_id: z.string().min(1, 'Device ID requerido'),
})

export type LoginInput = z.infer<typeof loginSchema>

// =============================================
// REGISTRO DE USUARIO (solo superadmin/admin)
// =============================================
export const createUserSchema = z.object({
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
  role: z.enum(['admin', 'cobrador'], {
    errorMap: () => ({ message: 'Rol inválido' }),
  }),
  tenant_id: z.string().uuid('Tenant inválido').optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

// =============================================
// CAMBIO DE CONTRASEÑA
// =============================================
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'La contraseña actual es requerida'),
    new_password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Debe tener mayúscula, minúscula y número'
      ),
    confirm_password: z.string().min(1, 'Confirma la contraseña'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>