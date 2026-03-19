import { z } from 'zod'

export const createRouteSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(3, 'Mínimo 3 caracteres'),
  tenant_id: z
    .string()
    .uuid('Oficina inválida')
    .min(1, 'La oficina es requerida'),
})

export type CreateRouteInput = z.infer<typeof createRouteSchema>

export const updateRouteSchema = createRouteSchema.partial()

export type UpdateRouteInput = z.infer<typeof updateRouteSchema>