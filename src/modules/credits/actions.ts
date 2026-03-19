'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createCreditSchema } from '@/lib/validations/clients'

// =============================================
// CALCULAR FECHA DE FIN
// =============================================
function calculateEndDate(
  startDate: string,
  installments: number,
  frequency: string
): string {
  const date = new Date(startDate)

  if (frequency === 'DAILY') {
    // Solo Lunes a Sábado
    let daysAdded = 0
    while (daysAdded < installments) {
      date.setDate(date.getDate() + 1)
      const day = date.getDay()
      if (day !== 0) daysAdded++ // 0 = domingo
    }
  } else if (frequency === 'WEEKLY') {
    date.setDate(date.getDate() + installments * 7)
  } else if (frequency === 'MONTHLY') {
    date.setMonth(date.getMonth() + installments)
  }

  return date.toISOString().split('T')[0]
}

// =============================================
// CREAR CRÉDITO
// =============================================
export async function createCreditAction(formData: unknown) {
  const supabase = createClient()

  const parsed = createCreditSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const {
    client_id, route_id, principal,
    interest_rate, installments, frequency, start_date,
  } = parsed.data

  // Obtener tenant_id
  const { data: route } = await supabase
    .from('routes')
    .select('tenant_id')
    .eq('id', route_id)
    .single()

  if (!route) return { error: 'Ruta no encontrada.' }

  // Calcular totales
  const total_amount = principal + (principal * interest_rate / 100)
  const installment_amount = total_amount / installments
  const end_date = calculateEndDate(start_date, installments, frequency)

  const { data, error } = await supabase
    .from('credits')
    .insert({
      tenant_id: route.tenant_id,
      client_id,
      route_id,
      principal,
      interest_rate,
      total_amount,
      installments,
      installment_amount,
      frequency,
      start_date,
      end_date,
      status: 'ACTIVE',
      paid_installments: 0,
    })
    .select()
    .single()

  if (error) return { error: 'Error al crear el crédito.' }

  // Actualizar estado del cliente a ACTIVE
  await supabase
    .from('clients')
    .update({ status: 'ACTIVE' })
    .eq('id', client_id)

  // Audit log
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('audit_logs').insert({
    tenant_id: route.tenant_id,
    user_id: user?.id,
    action: 'CREDITO_CREADO',
    entity: 'credits',
    entity_id: data.id,
    data_after: { principal, interest_rate, installments, frequency },
  })

  revalidatePath('/admin/clientes')
  return { success: true, data }
}

// =============================================
// OBTENER CRÉDITO POR ID
// =============================================
export async function getCreditById(creditId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('credits')
    .select(`
      *,
      client:clients(id, full_name, document_number, phone, route_id),
      payments(id, amount, payment_date, notes)
    `)
    .eq('id', creditId)
    .single()

  if (error) return { error: 'Crédito no encontrado.' }
  return { data }
}

// =============================================
// OBTENER CRÉDITOS DE LA OFICINA
// =============================================
export async function getCreditsByOffice(tenantId: string, routeId?: string) {
  const supabase = createClient()

  let query = supabase
    .from('credits')
    .select(`
      *,
      client:clients(id, full_name, document_number),
      route:routes(id, name)
    `)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (routeId) query = query.eq('route_id', routeId)

  const { data, error } = await query
  if (error) return { error: 'Error al obtener créditos.' }
  return { data }
}