'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function calculateCashClosing(routeId: string) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: route } = await supabase
    .from('routes')
    .select('id, name, capital_injected, tenant_id')
    .eq('id', routeId)
    .single()

  if (!route) return { error: 'Ruta no encontrada.' }

  const { data: todayPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('route_id', routeId)
    .eq('payment_date', today)
    .is('deleted_at', null)

  const { data: todayCredits } = await supabase
    .from('credits')
    .select('principal')
    .eq('route_id', routeId)
    .eq('start_date', today)
    .not('status', 'eq', 'WRITTEN_OFF')

  const { data: transfers } = await supabase
    .from('capital_movements')
    .select('amount')
    .eq('route_id', routeId)
    .eq('type', 'REINFORCEMENT')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`)

  const { data: existingClosing } = await supabase
    .from('cash_closings')
    .select('*')
    .eq('route_id', routeId)
    .eq('closing_date', today)
    .single()

  const collectedAmount = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0
  const loanedAmount = todayCredits?.reduce((sum, c) => sum + Number(c.principal), 0) ?? 0
  const transfersReceived = transfers?.reduce((sum, t) => sum + Number(t.amount), 0) ?? 0
  const baseAmount = Number(route.capital_injected)
  const totalToDeliver = collectedAmount - loanedAmount + transfersReceived

  return {
    data: {
      route,
      baseAmount,
      collectedAmount,
      loanedAmount,
      transfersReceived,
      totalToDeliver,
      today,
      existingClosing,
    },
  }
}

export async function registerCashClosing(formData: {
  routeId: string
  baseAmount: number
  collectedAmount: number
  loanedAmount: number
  expensesAmount: number
  transfersReceived: number
  notes?: string
}) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: route } = await supabase
    .from('routes')
    .select('tenant_id, cobrador_id')
    .eq('id', formData.routeId)
    .single()

  if (!route) return { error: 'Ruta no encontrada.' }

  const totalToDeliver =
    formData.collectedAmount
    - formData.loanedAmount
    - formData.expensesAmount
    + formData.transfersReceived

  const { data: existing } = await supabase
    .from('cash_closings')
    .select('id')
    .eq('route_id', formData.routeId)
    .eq('closing_date', today)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('cash_closings')
      .update({
        base_amount: formData.baseAmount,
        collected_amount: formData.collectedAmount,
        loaned_amount: formData.loanedAmount,
        expenses_amount: formData.expensesAmount,
        transfers_received: formData.transfersReceived,
        total_to_deliver: totalToDeliver,
        notes: formData.notes,
      })
      .eq('id', existing.id)

    if (error) return { error: 'Error al actualizar el cierre.' }
  } else {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('cash_closings')
      .insert({
        tenant_id: route.tenant_id,
        route_id: formData.routeId,
        cobrador_id: route.cobrador_id ?? user?.id,
        closing_date: today,
        base_amount: formData.baseAmount,
        collected_amount: formData.collectedAmount,
        loaned_amount: formData.loanedAmount,
        expenses_amount: formData.expensesAmount,
        transfers_received: formData.transfersReceived,
        total_to_deliver: totalToDeliver,
        notes: formData.notes,
      })

    if (error) return { error: 'Error al registrar el cierre.' }
  }

  revalidatePath('/admin/cierres')
  revalidatePath('/cobrador')
  return { success: true, totalToDeliver }
}

export async function getCashClosings(tenantId: string, routeId?: string) {
  const supabase = createClient()

  let query = supabase
    .from('cash_closings')
    .select('*, route:routes(id, name)')
    .eq('tenant_id', tenantId)
    .order('closing_date', { ascending: false })
    .limit(60)

  if (routeId) query = query.eq('route_id', routeId)

  const { data, error } = await query
  if (error) return { error: 'Error al obtener cierres.' }
  return { data }
}
