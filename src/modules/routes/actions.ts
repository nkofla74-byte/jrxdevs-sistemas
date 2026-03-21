'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { createRouteSchema } from '@/lib/validations/routes'

// =============================================
// GENERAR CREDENCIALES PARA LA RUTA
// =============================================
function generateRouteCredentials(routeName: string, officeName: string) {
  // Email: nombre-ruta@nombre-oficina.jrx (sin espacios, sin tildes)
  const cleanRoute = routeName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')

  const cleanOffice = officeName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10)

  const email = `${cleanRoute}@${cleanOffice}.jrx`

  // Contraseña: 4 letras mayúsculas + 4 números
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const numbers = '23456789'
  let password = ''
  for (let i = 0; i < 4; i++) {
    password += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  for (let i = 0; i < 4; i++) {
    password += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }

  return { email, password }
}

// =============================================
// OBTENER TODAS LAS RUTAS (superadmin)
// =============================================
export async function getAllRoutes() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('routes')
    .select(`
      *,
      tenant:tenants(id, name, country, currency)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return { error: 'Error al obtener rutas.' }
  return { data }
}

// =============================================
// OBTENER RUTAS POR OFICINA
// =============================================
export async function getRoutesByOffice(tenantId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return { error: 'Error al obtener rutas.' }
  return { data }
}

// =============================================
// CREAR RUTA — genera credenciales automáticamente
// =============================================
export async function createRoute(formData: unknown) {
  const supabase = createClient()
  const adminClient = createAdminClient()

  const parsed = createRouteSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { name, tenant_id } = parsed.data

  // Obtener nombre de la oficina para generar email
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', tenant_id)
    .single()

  if (!tenant) return { error: 'Oficina no encontrada.' }

  // Generar credenciales únicas
  const { email, password } = generateRouteCredentials(name, tenant.name)

  // Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) return { error: 'Error al crear credenciales de la ruta.' }

  // Crear ruta en BD
  const { data: route, error: routeError } = await supabase
    .from('routes')
    .insert({
      name,
      tenant_id,
      status: 'active',
      access_email: email,
      access_password: password,
    })
    .select()
    .single()

  if (routeError) {
    // Si falla, eliminar el usuario de Auth
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return { error: 'Error al crear la ruta.' }
  }

  // Crear usuario en tabla users vinculado a la ruta
  await supabase.from('users').insert({
    id: authData.user.id,
    tenant_id,
    full_name: `Ruta ${name}`,
    email,
    role: 'cobrador',
    status: 'active',
  })

  // Vincular usuario a la ruta
  await supabase
    .from('routes')
    .update({ cobrador_id: authData.user.id })
    .eq('id', route.id)

  // Audit log
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('audit_logs').insert({
    user_id: user?.id,
    role: 'superadmin',
    action: 'RUTA_CREADA',
    entity: 'routes',
    entity_id: route.id,
    data_after: { name, tenant_id, email },
  })

  revalidatePath('/superadmin/rutas')
  return { success: true, data: { ...route, access_password: password, access_email: email } }
}

// =============================================
// ACTIVAR / DESACTIVAR RUTA
// =============================================
export async function toggleRouteStatus(routeId: string, currentStatus: string) {
  const supabase = createClient()

  const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

  const { error } = await supabase
    .from('routes')
    .update({ status: newStatus })
    .eq('id', routeId)

  if (error) return { error: 'Error al actualizar la ruta.' }

  revalidatePath('/superadmin/rutas')
  return { success: true }
}

// =============================================
// ELIMINAR RUTA (soft delete)
// =============================================
export async function deleteRoute(routeId: string) {
  const supabase = createClient()
  const adminClient = createAdminClient()

  // Obtener el cobrador_id para eliminar el usuario de Auth
  const { data: route } = await supabase
    .from('routes')
    .select('cobrador_id')
    .eq('id', routeId)
    .single()

  const { error } = await supabase
    .from('routes')
    .update({ deleted_at: new Date().toISOString(), status: 'inactive' })
    .eq('id', routeId)

  if (error) return { error: 'Error al eliminar la ruta.' }

  // Eliminar usuario de Auth si existe
  if (route?.cobrador_id) {
    await adminClient.auth.admin.deleteUser(route.cobrador_id)
    await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', route.cobrador_id)
  }

  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('audit_logs').insert({
    user_id: user?.id,
    role: 'superadmin',
    action: 'RUTA_ELIMINADA',
    entity: 'routes',
    entity_id: routeId,
  })

  revalidatePath('/superadmin/rutas')
  return { success: true }
}

// =============================================
// REGENERAR CONTRASEÑA DE RUTA
// =============================================
export async function regenerateRoutePassword(routeId: string) {
  const supabase = createClient()
  const adminClient = createAdminClient()

  const { data: route } = await supabase
    .from('routes')
    .select('cobrador_id, name')
    .eq('id', routeId)
    .single()

  if (!route?.cobrador_id) return { error: 'Ruta sin usuario asociado.' }

  // Generar nueva contraseña
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const numbers = '23456789'
  let newPassword = ''
  for (let i = 0; i < 4; i++) {
    newPassword += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  for (let i = 0; i < 4; i++) {
    newPassword += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }

  // Actualizar en Auth
  const { error: authError } = await adminClient.auth.admin.updateUserById(
    route.cobrador_id,
    { password: newPassword }
  )

  if (authError) return { error: 'Error al regenerar contraseña.' }

  // Actualizar en BD
  await supabase
    .from('routes')
    .update({ access_password: newPassword })
    .eq('id', routeId)

  revalidatePath(`/superadmin/rutas/${routeId}`)
  return { success: true, newPassword }
}

// =============================================
// RESETEAR DEVICE BINDING DE RUTA
// =============================================
export async function resetRouteDevice(routeId: string) {
  const supabase = createClient()

  const { data: route } = await supabase
    .from('routes')
    .select('cobrador_id')
    .eq('id', routeId)
    .single()

  if (!route?.cobrador_id) return { error: 'Sin cobrador asignado.' }

  const { error } = await supabase
    .from('users')
    .update({ device_id: null })
    .eq('id', route.cobrador_id)

  if (error) return { error: 'Error al resetear el dispositivo.' }

  revalidatePath(`/superadmin/rutas/${routeId}`)
  return { success: true }
}