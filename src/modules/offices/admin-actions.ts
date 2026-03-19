'use server'

import { createClient } from '@/lib/supabase/server'

// =============================================
// OBTENER DATOS GLOBALES DE LA OFICINA
// =============================================
export async function getOfficeDashboard() {
  const supabase = createClient()

  // Obtener tenant del admin actual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, full_name')
    .eq('id', user.id)
    .single()

  if (!userData?.tenant_id) return { error: 'Sin oficina asignada.' }

  const tenantId = userData.tenant_id

  // Obtener info de la oficina
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  // Obtener todas las rutas de la oficina
  const { data: routes } = await supabase
    .from('routes')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .eq('status', 'active')

  const routeIds = routes?.map((r) => r.id) ?? []

  // Créditos activos
  const { data: activeCredits } = await supabase
    .from('credits')
    .select('principal, total_amount, paid_installments, installments, installment_amount, status')
    .eq('tenant_id', tenantId)
    .in('status', ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'])

  // Pagos de hoy
  const today = new Date().toISOString().split('T')[0]
  const { data: todayPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('tenant_id', tenantId)
    .eq('payment_date', today)
    .is('deleted_at', null)

  // Pagos del mes
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0]
  const { data: monthPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('tenant_id', tenantId)
    .gte('payment_date', firstDayOfMonth)
    .is('deleted_at', null)

  // Clientes activos
  const { count: activeClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'ACTIVE')
    .is('deleted_at', null)

  // Créditos críticos
  const { count: criticalCredits } = await supabase
    .from('credits')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'CRITICAL')

  // Calcular totales
  const totalInStreet = activeCredits?.reduce((sum, c) => {
    const remaining = (c.installments - c.paid_installments) * c.installment_amount
    return sum + remaining
  }, 0) ?? 0

  const collectedToday = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0
  const collectedMonth = monthPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0

  return {
    data: {
      tenant,
      adminName: userData.full_name,
      routes: routes ?? [],
      totalRoutes: routes?.length ?? 0,
      totalInStreet,
      collectedToday,
      collectedMonth,
      activeClients: activeClients ?? 0,
      criticalCredits: criticalCredits ?? 0,
      tenantId,
    },
  }
}

// =============================================
// OBTENER DASHBOARD POR RUTA
// =============================================
export async function getRouteDashboard(routeId: string) {
  const supabase = createClient()

  const { data: route } = await supabase
    .from('routes')
    .select(`*, tenant:tenants(currency)`)
    .eq('id', routeId)
    .single()

  if (!route) return { error: 'Ruta no encontrada.' }

  // Créditos activos de la ruta
  const { data: activeCredits } = await supabase
    .from('credits')
    .select('principal, total_amount, paid_installments, installments, installment_amount, status')
    .eq('route_id', routeId)
    .in('status', ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'])

  // Pagos de hoy
  const today = new Date().toISOString().split('T')[0]
  const { data: todayPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('route_id', routeId)
    .eq('payment_date', today)
    .is('deleted_at', null)

  // Pagos del mes
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0]
  const { data: monthPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('route_id', routeId)
    .gte('payment_date', firstDayOfMonth)
    .is('deleted_at', null)

  // Clientes por estado de crédito
  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('route_id', routeId)
    .eq('status', 'ACTIVE')
    .is('deleted_at', null)

  const { count: criticalClients } = await supabase
    .from('credits')
    .select('*', { count: 'exact', head: true })
    .eq('route_id', routeId)
    .eq('status', 'CRITICAL')

  const { count: watchClients } = await supabase
    .from('credits')
    .select('*', { count: 'exact', head: true })
    .eq('route_id', routeId)
    .in('status', ['WATCH', 'WARNING'])

  // Calcular totales
  const totalInStreet = activeCredits?.reduce((sum, c) => {
    const remaining = (c.installments - c.paid_installments) * c.installment_amount
    return sum + remaining
  }, 0) ?? 0

  const collectedToday = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0
  const collectedMonth = monthPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0

  return {
    data: {
      route,
      currency: route.tenant?.currency ?? 'COP',
      totalInStreet,
      collectedToday,
      collectedMonth,
      capitalInjected: Number(route.capital_injected),
      totalClients: totalClients ?? 0,
      criticalClients: criticalClients ?? 0,
      watchClients: watchClients ?? 0,
    },
  }
}