'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { createAdminSchema } from '@/lib/validations/users'

// =============================================
// OBTENER TODOS LOS ADMINISTRADORES
// =============================================
export async function getAllAdmins() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      tenant:tenants(id, name, country)
    `)
    .eq('role', 'admin')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return { error: 'Error al obtener administradores.' }
  return { data }
}

// =============================================
// CREAR ADMINISTRADOR
// =============================================
export async function createAdmin(formData: unknown) {
  const supabase = createClient()
  const adminClient = createAdminClient()

  const parsed = createAdminSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { full_name, email, password, tenant_id } = parsed.data

  // Crear en Supabase Auth
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { error: 'Este correo ya está registrado.' }
    }
    return { error: 'Error al crear el administrador.' }
  }

  // Crear en tabla users
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      tenant_id,
      full_name,
      email,
      role: 'admin',
      status: 'active',
    })

  if (userError) {
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return { error: 'Error al guardar el administrador.' }
  }

  // Audit log
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('audit_logs').insert({
    user_id: user?.id,
    role: 'superadmin',
    action: 'ADMIN_CREADO',
    entity: 'users',
    entity_id: authData.user.id,
    data_after: { full_name, email, tenant_id },
  })

  revalidatePath('/superadmin/administradores')
  return { success: true }
}

// =============================================
// BLOQUEAR / ACTIVAR ADMINISTRADOR
// =============================================
export async function toggleAdminStatus(userId: string, currentStatus: string) {
  const supabase = createClient()

  const newStatus = currentStatus === 'active' ? 'blocked' : 'active'

  const { error } = await supabase
    .from('users')
    .update({ status: newStatus })
    .eq('id', userId)

  if (error) return { error: 'Error al actualizar el administrador.' }

  revalidatePath('/superadmin/administradores')
  return { success: true }
}

// =============================================
// ELIMINAR ADMINISTRADOR (soft delete)
// =============================================
export async function deleteAdmin(userId: string) {
  const supabase = createClient()
  const adminClient = createAdminClient()

  await adminClient.auth.admin.deleteUser(userId)

  const { error } = await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString(), status: 'inactive' })
    .eq('id', userId)

  if (error) return { error: 'Error al eliminar el administrador.' }

  revalidatePath('/superadmin/administradores')
  return { success: true }
}