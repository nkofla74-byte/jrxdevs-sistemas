import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function fmt(n: number) {
  return Number(n).toLocaleString('es-CO')
}

export default async function InformesPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: route } = await supabase
    .from('routes')
    .select('*, tenant:tenants(currency)')
    .eq('cobrador_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!route) redirect('/cobrador')

  const today = new Date().toISOString().split('T')[0]
  const currency = route.tenant?.currency ?? 'COP'

  // Primera semana del mes
  const firstDayOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(), 1
  ).toISOString().split('T')[0]

  // Pagos de hoy
  const { data: todayPayments } = await supabase
    .from('payments')
    .select('amount, client_id')
    .eq('route_id', route.id)
    .eq('payment_date', today)
    .is('deleted_at', null)

  // Pagos del mes
  const { data: monthPayments } = await supabase
    .from('payments')
    .select('amount, payment_date')
    .eq('route_id', route.id)
    .gte('payment_date', firstDayOfMonth)
    .is('deleted_at', null)
    .order('payment_date', { ascending: false })

  // Créditos activos
  const { data: activeCredits } = await supabase
    .from('credits')
    .select('installment_amount, paid_installments, installments, status, principal')
    .eq('route_id', route.id)
    .in('status', ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'])

  // Créditos creados hoy
  const { data: todayCredits } = await supabase
    .from('credits')
    .select('principal')
    .eq('route_id', route.id)
    .eq('start_date', today)

  // Clientes activos
  const { data: clients } = await supabase
    .from('clients')
    .select('id, status')
    .eq('route_id', route.id)
    .is('deleted_at', null)

  // Cierres de caja recientes
  const { data: recentClosings } = await supabase
    .from('cash_closings')
    .select('closing_date, collected_amount, loaned_amount, expenses_amount, total_to_deliver')
    .eq('route_id', route.id)
    .order('closing_date', { ascending: false })
    .limit(7)

  // Calcular métricas
  const collectedToday = todayPayments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0
  const collectedMonth = monthPayments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0
  const loanedToday = todayCredits?.reduce((s, c) => s + Number(c.principal), 0) ?? 0
  const clientsPaidToday = new Set(todayPayments?.map((p) => p.client_id)).size

  const totalInStreet = activeCredits?.reduce((s, c) => {
    return s + (c.installments - c.paid_installments) * Number(c.installment_amount)
  }, 0) ?? 0

  const dailyGoal = activeCredits?.reduce((s, c) => s + Number(c.installment_amount), 0) ?? 0
  const progressPercent = dailyGoal > 0 ? Math.round((collectedToday / dailyGoal) * 100) : 0

  const totalClients = clients?.length ?? 0
  const activeClientsCount = clients?.filter((c) => c.status === 'ACTIVE').length ?? 0
  const criticalCount = activeCredits?.filter((c) => c.status === 'CRITICAL').length ?? 0
  const watchCount = activeCredits?.filter((c) => ['WATCH', 'WARNING'].includes(c.status)).length ?? 0

  // Agrupar pagos del mes por día
  const paymentsByDay = monthPayments?.reduce((acc: Record<string, number>, p) => {
    acc[p.payment_date] = (acc[p.payment_date] ?? 0) + Number(p.amount)
    return acc
  }, {}) ?? {}

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/cobrador" className="text-gray-400 text-sm">← Atrás</Link>
            <span className="text-gray-600">/</span>
            <span className="text-white font-semibold text-sm">Informes</span>
          </div>
          <span className="text-gray-400 text-xs">{route.name}</span>
        </div>
      </header>

      <div className="px-4 py-4 pb-8 space-y-4">

        {/* Resumen del día */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">
            Hoy — {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Cobrado hoy</p>
              <p className="text-green-400 font-bold text-xl">{fmt(collectedToday)}</p>
              <p className="text-gray-600 text-xs">{currency}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Meta del día</p>
              <p className="text-indigo-400 font-bold text-xl">{fmt(dailyGoal)}</p>
              <p className="text-gray-600 text-xs">{currency}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Prestado hoy</p>
              <p className="text-red-400 font-bold text-xl">{fmt(loanedToday)}</p>
              <p className="text-gray-600 text-xs">{currency}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Clientes cobrados</p>
              <p className="text-white font-bold text-xl">{clientsPaidToday}</p>
              <p className="text-gray-600 text-xs">de {activeClientsCount} activos</p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400 text-xs">Progreso del día</span>
              <span className="text-white text-xs font-semibold">{progressPercent}%</span>
            </div>
            <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${Math.min(progressPercent, 100)}%`,
                  background: progressPercent >= 100
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Estado de la cartera */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">
            Estado de la cartera
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Dinero en calle</p>
              <p className="text-white font-bold text-lg">{fmt(totalInStreet)}</p>
              <p className="text-gray-600 text-xs">{currency}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Capital inyectado</p>
              <p className="text-white font-bold text-lg">{fmt(Number(route.capital_injected))}</p>
              <p className="text-gray-600 text-xs">{currency}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Total clientes</p>
              <p className="text-white font-bold text-lg">{totalClients}</p>
              <p className="text-gray-600 text-xs">{activeClientsCount} activos</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Créditos activos</p>
              <p className="text-white font-bold text-lg">{activeCredits?.length ?? 0}</p>
              <p className="text-gray-600 text-xs">en circulación</p>
            </div>
          </div>

          {/* Alertas de mora */}
          {(criticalCount > 0 || watchCount > 0) && (
            <div className="mt-3 space-y-2">
              {criticalCount > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
                  <span>🔴</span>
                  <p className="text-red-400 text-xs font-semibold">
                    {criticalCount} crédito{criticalCount > 1 ? 's' : ''} crítico{criticalCount > 1 ? 's' : ''} — 6+ días sin pagar
                  </p>
                </div>
              )}
              {watchCount > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center gap-2">
                  <span>🟡</span>
                  <p className="text-yellow-400 text-xs font-semibold">
                    {watchCount} crédito{watchCount > 1 ? 's' : ''} en mora — requieren seguimiento
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cobrado este mes */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
              Cobrado este mes
            </p>
            <p className="text-indigo-400 font-bold text-sm">{fmt(collectedMonth)} {currency}</p>
          </div>

          {Object.keys(paymentsByDay).length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(paymentsByDay)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, amount]) => (
                  <div key={date} className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2">
                    <p className="text-gray-400 text-xs">
                      {new Date(date + 'T12:00:00').toLocaleDateString('es-CO', {
                        weekday: 'short', day: 'numeric', month: 'short'
                      })}
                    </p>
                    <p className="text-green-400 text-xs font-semibold">{fmt(amount)}</p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">Sin pagos este mes todavía.</p>
          )}
        </div>

        {/* Cierres recientes */}
        {recentClosings && recentClosings.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">
              Cierres recientes
            </p>
            <div className="space-y-2">
              {recentClosings.map((closing: any) => (
                <div key={closing.closing_date} className="bg-gray-800 rounded-xl px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-xs">
                      {new Date(closing.closing_date + 'T12:00:00').toLocaleDateString('es-CO', {
                        weekday: 'short', day: 'numeric', month: 'short'
                      })}
                    </p>
                    <p className={`text-xs font-bold ${Number(closing.total_to_deliver) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {fmt(closing.total_to_deliver)}
                    </p>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <p className="text-gray-600 text-xs">Cobrado: {fmt(closing.collected_amount)}</p>
                    <p className="text-gray-600 text-xs">Prestado: {fmt(closing.loaned_amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}