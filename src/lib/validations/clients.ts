import { z } from 'zod'

// Solo datos personales — sin fotos
export const createClientStep1Schema = z.object({
  full_name: z.string().min(1, 'El nombre es requerido').min(3, 'Mínimo 3 caracteres'),
  document_number: z.string().min(1, 'El documento es requerido').min(5, 'Mínimo 5 caracteres'),
  phone: z.string().min(1, 'El teléfono es requerido').min(7, 'Mínimo 7 dígitos'),
  address: z.string().min(1, 'La dirección es requerida'),
  route_id: z.string().uuid('Ruta inválida').min(1, 'La ruta es requerida'),
  visit_order: z.number().int().min(1, 'El orden debe ser mayor a 0').default(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export type CreateClientStep1Input = z.infer<typeof createClientStep1Schema>

// Schema completo con fotos para guardar en BD
export const createClientSchema = createClientStep1Schema.extend({
  photo_doc_front: z.string().min(1, 'La foto del documento frontal es requerida'),
  photo_doc_back: z.string().min(1, 'La foto del documento posterior es requerida'),
  photo_place: z.string().min(1, 'La foto del negocio/casa es requerida'),
})

export type CreateClientInput = z.infer<typeof createClientSchema>

export const updateClientSchema = createClientSchema.partial()
export type UpdateClientInput = z.infer<typeof updateClientSchema>

// =============================================
// CRÉDITO
// =============================================
export const createCreditSchema = z.object({
  client_id: z.string().uuid('Cliente inválido'),
  route_id: z.string().uuid('Ruta inválida'),
  principal: z.number().positive('El capital debe ser mayor a 0'),
  interest_rate: z.number().min(0, 'El interés no puede ser negativo').max(100, 'Máximo 100%'),
  installments: z.number().int().min(1, 'Mínimo 1 cuota'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY'], {
    errorMap: () => ({ message: 'Frecuencia inválida' }),
  }),
  start_date: z.string().min(1, 'La fecha de inicio es requerida'),
})

export type CreateCreditInput = z.infer<typeof createCreditSchema>