import { z } from 'zod'

export const createOfficeSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(3, 'Mínimo 3 caracteres'),
  country: z.enum(['CO', 'PE', 'EC', 'BR'], {
    errorMap: () => ({ message: 'País inválido' }),
  }),
  currency: z.enum(['COP', 'PEN', 'USD', 'BRL'], {
    errorMap: () => ({ message: 'Moneda inválida' }),
  }),
  plan: z.enum(['monthly', 'quarterly'], {
    errorMap: () => ({ message: 'Plan inválido' }),
  }),
  open_time: z.string().min(1, 'El horario de apertura es requerido'),
  close_time: z.string().min(1, 'El horario de cierre es requerido'),
})

export type CreateOfficeInput = z.infer<typeof createOfficeSchema>

export const updateOfficeSchema = createOfficeSchema.partial().extend({
  status: z.enum(['active', 'frozen', 'inactive']).optional(),
})

export type UpdateOfficeInput = z.infer<typeof updateOfficeSchema>