'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createClientSchema, updateClientSchema } from '@/lib/validations/clients'

// =============================================
// OBTENER TODOS LOS CLIENTES DE LA OFICINA
// =============================================
export async function getClientsByOffice(tenantId: string, routeId?: string) {
  const supabase = createClient()

  let query = supabase
    .from('clients')
    .select(`
      *,
      route:routes(id, name),
      credits(id, status, installment_amount, paid_installments, installments)
    `)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('full_name', { ascending: true })

  if (routeId) {
    query = query.eq('route_id', routeId)
  }

  const { data, error } = await query

  if (error) return { error: 'Error al obtener clientes.' }
  return { data }
}

// =============================================
// BUSCAR CLIENTE POR DNI O NOMBRE
// =============================================
export async function searchClient(tenantId: string, search: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      route:routes(id, name),
      credits(id, status, total_amount, paid_installments, installments)
    `)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .or(`full_name.ilike.%${search}%,document_number.ilike.%${search}%`)
    .order('full_name', { ascending: true })

  if (error) return { error: 'Error al buscar clientes.' }
  return { data }
}

// =============================================
// OBTENER CLIENTE POR ID
// =============================================
export async function getClientById(clientId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      route:routes(id, name),
      credits(
        id, status, principal, interest_rate, total_amount,
        installments, installment_amount, paid_installments,
        frequency, start_date, refinance_count, created_at
      )
    `)
    .eq('id', clientId)
    .single()

  if (error) return { error: 'Cliente no encontrado.' }
  return { data }
}

// =============================================
// CREAR CLIENTE
// =============================================
export async function createClientAction(formData: unknown) {
  const supabase = createClient()

  const parsed = createClientSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { full_name, document_number, phone, address,
    route_id, visit_order, latitude, longitude } = parsed.data

  // Obtener tenant_id desde la ruta
  const { data: route } = await supabase
    .from('routes')
    .select('tenant_id')
    .eq('id', route_id)
    .single()

  if (!route) return { error: 'Ruta no encontrada.' }

  // Verificar si el documento ya existe en el tenant
  const { data: existing } = await supabase
    .from('clients')
    .select('id, route:routes(name)')
    .eq('tenant_id', route.tenant_id)
    .eq('document_number', document_number)
    .is('deleted_at', null)
    .single()

  if (existing) {
    return {
      warning: `⚠️ Este documento ya existe en la ruta "${(existing.route as any)?.name}". ¿Deseas continuar?`,
      duplicate: true,
    }
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      tenant_id: route.tenant_id,
      route_id,
      full_name,
      document_number,
      phone,
      address,
      visit_order,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      status: 'NEW',
    })
    .select()
    .single()

  if (error) return { error: 'Error al crear el cliente.' }

  // Audit log
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('audit_logs').insert({
    tenant_id: route.tenant_id,
    user_id: user?.id,
    action: 'CLIENTE_CREADO',
    entity: 'clients',
    entity_id: data.id,
    data_after: { full_name, document_number, route_id },
  })

  revalidatePath('/admin/clientes')
  return { success: true, data }
}

// =============================================
// ACTUALIZAR CLIENTE
// =============================================
export async function updateClientAction(clientId: string, formData: unknown) {
  const supabase = createClient()

  const parsed = updateClientSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { data: before } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  const { data, error } = await supabase
    .from('clients')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', clientId)
    .select()
    .single()

  if (error) return { error: 'Error al actualizar el cliente.' }

  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('audit_logs').insert({
    tenant_id: before?.tenant_id,
    user_id: user?.id,
    action: 'CLIENTE_EDITADO',
    entity: 'clients',
    entity_id: clientId,
    data_before: before,
    data_after: parsed.data,
  })

  revalidatePath('/admin/clientes')
  return { success: true, data }
}

// =============================================
// ELIMINAR CLIENTE (soft delete)
// =============================================
export async function deleteClientAction(clientId: string) {
  const supabase = createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('tenant_id, full_name')
    .eq('id', clientId)
    .single()

  const { error } = await supabase
    .from('clients')
    .update({ deleted_at: new Date().toISOString(), status: 'INACTIVE' })
    .eq('id', clientId)

  if (error) return { error: 'Error al eliminar el cliente.' }

  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('audit_logs').insert({
    tenant_id: client?.tenant_id,
    user_id: user?.id,
    action: 'CLIENTE_ELIMINADO',
    entity: 'clients',
    entity_id: clientId,
    data_before: { full_name: client?.full_name },
  })

  revalidatePath('/admin/clientes')
  return { success: true }
}