'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateCobradorLocation(
  latitude: number,
  longitude: number,
  accuracy?: number
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: route } = await supabase
    .from('routes')
    .select('id, tenant_id')
    .eq('cobrador_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!route) return { error: 'Sin ruta asignada' }

  const { error } = await supabase
    .from('cobrador_location')
    .upsert({
      cobrador_id: user.id,
      route_id: route.id,
      tenant_id: route.tenant_id,
      latitude,
      longitude,
      accuracy: accuracy ? Math.round(accuracy) : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'cobrador_id' })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getCobradorLocation(routeId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cobrador_location')
    .select('latitude, longitude, accuracy, updated_at')
    .eq('route_id', routeId)
    .single()

  if (error || !data) return { data: null }
  return { data }
}
