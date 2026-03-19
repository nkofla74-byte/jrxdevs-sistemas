'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createOfficeSchema, updateOfficeSchema } from '@/lib/validations/offices'

// =============================================
// OBTENER TODAS LAS OFICINAS
// =============================================
export async function getOffices() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return { error: 'Error al obtener oficinas.' }
  return { data }
}

// =============================================
// CREAR OFICINA
// =============================================
export async function createOffice(formData: unknown) {
  const supabase = createClient()

  // Validar datos
  const parsed = createOfficeSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { name, country, currency, plan, open_time, close_time } = parsed.data

  const { data, error } = await supabase
    .from('tenants')
    .insert({
      name,
      country,
      currency,
      plan,
      open_time,
      close_time,
      status: 'active',
    })
    .select()
    .single()

  if (error) return { error: 'Error al crear la oficina.' }

  // Registrar en audit_logs
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('audit_logs').insert({
    user_id: user?.id,
    role: 'superadmin',
    action: 'OFICINA_CREADA',
    entity: 'tenants',
    entity_id: data.id,
    data_after: parsed.data,
  })

  revalidatePath('/superadmin/oficinas')
  return { success: true, data }
}

// =============================================
// CONGELAR OFICINA
// =============================================
export async function freezeOffice(officeId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('tenants')
    .update({ status: 'frozen' })
    .eq('id', officeId)

  if (error) return { error: 'Error al congelar la oficina.' }

  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('audit_logs').insert({
    user_id: user?.id,
    role: 'superadmin',
    action: 'OFICINA_CONGELADA',
    entity: 'tenants',
    entity_id: officeId,
  })

  revalidatePath('/superadmin/oficinas')
  return { success: true }
}

// =============================================
// ACTIVAR OFICINA
// =============================================
export async function activateOffice(officeId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('tenants')
    .update({ status: 'active' })
    .eq('id', officeId)

  if (error) return { error: 'Error al activar la oficina.' }

  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('audit_logs').insert({
    user_id: user?.id,
    role: 'superadmin',
    action: 'OFICINA_ACTIVADA',
    entity: 'tenants',
    entity_id: officeId,
  })

  revalidatePath('/superadmin/oficinas')
  return { success: true }
}

// =============================================
// ELIMINAR OFICINA (soft delete)
// =============================================
export async function deleteOffice(officeId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('tenants')
    .update({ deleted_at: new Date().toISOString(), status: 'inactive' })
    .eq('id', officeId)

  if (error) return { error: 'Error al eliminar la oficina.' }

  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('audit_logs').insert({
    user_id: user?.id,
    role: 'superadmin',
    action: 'OFICINA_ELIMINADA',
    entity: 'tenants',
    entity_id: officeId,
  })

  revalidatePath('/superadmin/oficinas')
  return { success: true }
}