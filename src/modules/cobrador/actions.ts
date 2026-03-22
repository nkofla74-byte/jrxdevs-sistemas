'use server'
import { createClient } from '@/lib/supabase/server'

export async function getCobradorDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: route } = await supabase
    .from('routes')
    .select('*, tenant:tenants(id, name, currency, open_time, close_time)')
    .eq('cobrador_id', user.id)
    .is('deleted_at', null)
    .single()
  if (!route) return { error: 'Sin ruta asignada.' }

  const today = new Date().toISOString().split('T')[0]

  const { data: clients } = await supabase
    .from('clients')
    .select(`
      id, full_name, phone, visit_order, status,
      credits(id, status, installment_amount, paid_installments, installments, frequency)
    `)
    .eq('route_id', route.id)
    .eq('status', 'ACTIVE')
    .is('deleted_at', null)
    .order('visit_order', { ascending: true })

  const { data: todayPayments } = await supabase
    .from('payments')
    .select('client_id, amount')
    .eq('route_id', route.id)
    .eq('payment_date', today)
    .is('deleted_at', null)

  const { data: activeCredits } = await supabase
    .from('credits')
    .select('installment_amount, paid_installments, installments')
    .eq('route_id', route.id)
    .in('status', ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'])

  const { data: todayExpenses } = await supabase
    .from('capital_movements')
    .select('amount')
    .eq('route_id', route.id)
    .eq('type', 'REINFORCEMENT')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`)

  const { data: todayCredits } = await supabase
    .from('credits')
    .select('principal')
    .eq('route_id', route.id)
    .eq('start_date', today)
    .is('deleted_at', null)

  const collectedToday = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0
  const clientsPaidToday = new Set(todayPayments?.map((p) => p.client_id)).size
  const totalClients = clients?.length ?? 0
  const totalInStreet = activeCredits?.reduce((sum, c) => {
    return sum + (c.installments - c.paid_installments) * Number(c.installment_amount)
  }, 0) ?? 0
  const dailyGoal = clients?.reduce((sum, client: any) => {
    const activeCredit = client.credits?.find((c: any) =>
      ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'].includes(c.status)
    )
    return sum + (activeCredit ? Number(activeCredit.installment_amount) : 0)
  }, 0) ?? 0
  const pendingToCollect = dailyGoal - collectedToday
  const lentToday = todayCredits?.reduce((sum, c) => sum + Number(c.principal), 0) ?? 0
  const expensesToday = todayExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const isWithinSchedule = route.tenant
    ? currentTime >= route.tenant.open_time &&
      currentTime <= route.tenant.close_time
    : true

  return {
    data: {
      route,
      clients: clients ?? [],
      totalClients,
      clientsPaidToday,
      collectedToday,
      totalInStreet,
      dailyGoal,
      pendingToCollect,
      lentToday,
      expensesToday,
      currency: route.tenant?.currency ?? 'COP',
      isWithinSchedule,
      todayPaidClientIds: todayPayments?.map((p) => p.client_id) ?? [],
    },
  }
}

export async function registerExpense(routeId: string, amount: number, description: string) {
  const supabase = createClient()
  const { data: route } = await supabase
    .from('routes')
    .select('tenant_id')
    .eq('id', routeId)
    .single()
  if (!route) return { error: 'Ruta no encontrada.' }
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('capital_movements')
    .insert({
      tenant_id: route.tenant_id,
      route_id: routeId,
      user_id: user?.id,
      type: 'REINFORCEMENT',
      amount,
      notes: `GASTO: ${description}`,
    })
  if (error) return { error: 'Error al registrar el gasto.' }
  return { success: true }
}
