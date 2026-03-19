'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(
  email: string,
  password: string,
  deviceId: string
) {
  try {
    const supabase = createClient()

    // 1. Intentar login con Supabase Auth primero
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: 'Correo o contraseña incorrectos.' }
    }

    // 2. Obtener datos del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role, status, device_id, failed_attempts, blocked_until')
      .eq('id', data.user.id)
      .single()

    if (userError || !userData) {
      await supabase.auth.signOut()
      return { error: 'Usuario no encontrado en el sistema.' }
    }

    // 3. Verificar bloqueo
    if (userData.blocked_until && new Date(userData.blocked_until) > new Date()) {
      await supabase.auth.signOut()
      return { error: 'Cuenta bloqueada temporalmente. Intenta en 15 minutos.' }
    }

    if (userData.status === 'blocked') {
      await supabase.auth.signOut()
      return { error: 'Cuenta bloqueada. Contacta al administrador.' }
    }

    // 4. Verificar device binding
    if (userData.device_id && userData.device_id !== deviceId) {
      await supabase.auth.signOut()
      await supabase
        .from('users')
        .update({ status: 'blocked' })
        .eq('id', userData.id)
      return { error: 'Dispositivo no reconocido. Cuenta bloqueada por seguridad.' }
    }

    // 5. Actualizar device_id y limpiar intentos fallidos
    await supabase
      .from('users')
      .update({
        device_id: deviceId,
        failed_attempts: 0,
        blocked_until: null,
      })
      .eq('id', userData.id)

    // 6. Registrar en audit_logs
    await supabase.from('audit_logs').insert({
      user_id: userData.id,
      role: userData.role,
      action: 'LOGIN_EXITOSO',
      entity: 'users',
      entity_id: userData.id,
      data_after: { device_id: deviceId },
    })

    revalidatePath('/', 'layout')
    return { success: true, role: userData.role }

  } catch (err) {
    console.error('Error en login:', err)
    return { error: 'Error interno. Intenta de nuevo.' }
  }
}

export async function logout() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'LOGOUT',
      entity: 'users',
      entity_id: user.id,
    })
  }

  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}