import { z } from 'zod'

export const capitalMovementSchema = z.object({
  route_id: z.string().uuid('Ruta inválida'),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  type: z.enum(['INJECTION', 'WITHDRAWAL', 'TRANSFER', 'REINFORCEMENT']),
  notes: z.string().optional(),
  destination_route_id: z.string().uuid().optional(),
})

export type CapitalMovementInput = z.infer<typeof capitalMovementSchema>