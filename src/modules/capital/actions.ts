'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const movementSchema = z.object({
  route_id: z.string().uuid(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  type: z.enum(['INJECTION', 'WITHDRAWAL', 'TRANSFER', 'REINFORCEMENT']),
  notes: z.string().optional(),
  destination_route_id: z.string().uuid().optional(),
})

// =============================================
// OBTENER MOVIMIENTOS DE CAPITAL
// =============================================
export async function getCapitalMovements(tenantId: string, routeId?: string) {
  const supabase = createClient()

  let query = supabase
    .from('capital_movements')
    .select(`
      *,
      route:routes!capital_movements_route_id_fkey(id, name)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (routeId) query = query.eq('route_id', routeId)

  const { data, error } = await query
  if (error) return { error: 'Error al obtener movimientos.' }
  return { data }
}

// =============================================
// INYECTAR CAPITAL A UNA RUTA
// =============================================
export async function injectCapital(formData: unknown) {
  const supabase = createClient()

  const parsed = movementSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { route_id, amount, notes } = parsed.data

  // Obtener tenant_id
  const { data: route } = await supabase
    .from('routes')
    .select('tenant_id, capital_injected, name')
    .eq('id', route_id)
    .single()

  if (!route) return { error: 'Ruta no encontrada.' }

  // Actualizar capital de la ruta
  const newCapital = Number(route.capital_injected) + amount
  await supabase
    .from('routes')
    .update({ capital_injected: newCapital })
    .eq('id', route_id)

  // Registrar movimiento
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('capital_movements').insert({
    tenant_id: route.tenant_id,
    route_id,
    user_id: user?.id,
    type: 'INJECTION',
    amount,
    notes,
  })

  // Audit log
  await supabase.from('audit_logs').insert({
    tenant_id: route.tenant_id,
    user_id: user?.id,
    action: 'CAPITAL_INYECTADO',
    entity: 'routes',
    entity_id: route_id,
    data_after: { amount, route: route.name, new_capital: newCapital },
  })

  revalidatePath('/admin/capital')
  return { success: true }
}

// =============================================
// RETIRAR CAPITAL DE UNA RUTA
// =============================================
export async function withdrawCapital(formData: unknown) {
  const supabase = createClient()

  const parsed = movementSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { route_id, amount, notes } = parsed.data

  const { data: route } = await supabase
    .from('routes')
    .select('tenant_id, capital_injected, name')
    .eq('id', route_id)
    .single()

  if (!route) return { error: 'Ruta no encontrada.' }

  // Verificar que haya suficiente capital
  if (Number(route.capital_injected) < amount) {
    return { error: `Capital insuficiente. Disponible: ${Number(route.capital_injected).toLocaleString()}` }
  }

  const newCapital = Number(route.capital_injected) - amount
  await supabase
    .from('routes')
    .update({ capital_injected: newCapital })
    .eq('id', route_id)

  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('capital_movements').insert({
    tenant_id: route.tenant_id,
    route_id,
    user_id: user?.id,
    type: 'WITHDRAWAL',
    amount,
    notes,
  })

  await supabase.from('audit_logs').insert({
    tenant_id: route.tenant_id,
    user_id: user?.id,
    action: 'CAPITAL_RETIRADO',
    entity: 'routes',
    entity_id: route_id,
    data_after: { amount, route: route.name, new_capital: newCapital },
  })

  revalidatePath('/admin/capital')
  return { success: true }
}

// =============================================
// TRANSFERIR CAPITAL ENTRE RUTAS
// =============================================
export async function transferCapital(formData: unknown) {
  const supabase = createClient()

  const parsed = movementSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { route_id, amount, notes, destination_route_id } = parsed.data

  if (!destination_route_id) return { error: 'Ruta destino requerida.' }
  if (route_id === destination_route_id) return { error: 'La ruta origen y destino no pueden ser la misma.' }

  // Obtener rutas
  const { data: originRoute } = await supabase
    .from('routes')
    .select('tenant_id, capital_injected, name')
    .eq('id', route_id)
    .single()

  const { data: destRoute } = await supabase
    .from('routes')
    .select('capital_injected, name')
    .eq('id', destination_route_id)
    .single()

  if (!originRoute || !destRoute) return { error: 'Ruta no encontrada.' }

  if (Number(originRoute.capital_injected) < amount) {
    return { error: `Capital insuficiente en la ruta origen. Disponible: ${Number(originRoute.capital_injected).toLocaleString()}` }
  }

  // Descontar de origen
  await supabase
    .from('routes')
    .update({ capital_injected: Number(originRoute.capital_injected) - amount })
    .eq('id', route_id)

  // Agregar a destino
  await supabase
    .from('routes')
    .update({ capital_injected: Number(destRoute.capital_injected) + amount })
    .eq('id', destination_route_id)

  const { data: { user } } = await supabase.auth.getUser()

  // Registrar movimiento
  await supabase.from('capital_movements').insert({
    tenant_id: originRoute.tenant_id,
    route_id,
    user_id: user?.id,
    type: 'TRANSFER',
    amount,
    notes: `Transferencia a ${destRoute.name}. ${notes ?? ''}`,
  })

  await supabase.from('audit_logs').insert({
    tenant_id: originRoute.tenant_id,
    user_id: user?.id,
    action: 'CAPITAL_TRANSFERIDO',
    entity: 'routes',
    entity_id: route_id,
    data_after: {
      amount,
      from: originRoute.name,
      to: destRoute.name,
    },
  })

  revalidatePath('/admin/capital')
  return { success: true }
}