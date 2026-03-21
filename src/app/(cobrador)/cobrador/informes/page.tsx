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

  const firstDayOfMonth = new Date(
    new Date().getFullYear(), new Date().getMonth(), 1
  ).toISOString().split('T')[0]

  const { data: todayPayments } = await supabase
    .from('payments')
    .select('amount, client_id')
    .eq('route_id', route.id)
    .eq('payment_date', today)
    .is('deleted_at', null)

  const { data: monthPayments } = await supabase
    .from('payments')
    .select('amount, payment_date')
    .eq('route_id', route.id)
    .gte('payment_date', firstDayOfMonth)
    .is('deleted_at', null)
    .order('payment_date', { ascending: false })

  const { data: activeCredits } = await supabase
    .from('credits')
    .select('installment_amount, paid_installments, installments, status, principal')
    .eq('route_id', route.id)
    .in('status', ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'])

  const { data: todayCredits } = await supabase
    .from('credits')
    .select('principal')
    .eq('route_id', route.id)
    .eq('start_date', today)

  const { data: clients } = await supabase
    .from('clients')
    .select('id, status')
    .eq('route_id', route.id)
    .is('deleted_at', null)

  const { data: recentClosings } = await supabase
    .from('cash_closings')
    .select('closing_date, collected_amount, loaned_amount, expenses_amount, total_to_deliver')
    .eq('route_id', route.id)
    .order('closing_date', { ascending: false })
    .limit(7)

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

  const paymentsByDay = monthPayments?.reduce((acc: Record<string, number>, p) => {
    acc[p.payment_date] = (acc[p.payment_date] ?? 0) + Number(p.amount)
    return acc
  }, {}) ?? {}

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <header style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 16px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/cobrador" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12, padding: '8px 14px',
              color: 'var(--text-secondary)', fontSize: 13,
              fontWeight: 600, textDecoration: 'none',
            }}>
              ← Atrás
            </Link>
            <h1 style={{
              fontFamily: 'Syne', fontWeight: 700,
              fontSize: 16, color: 'var(--text-primary)',
            }}>
              Informes
            </h1>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{route.name}</span>
        </div>
      </header>

      <div style={{ padding: '16px 16px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Resumen del día */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: 16,
        }}>
          <p style={{
            color: 'var(--text-muted)', fontSize: 11,
            fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: 14,
          }}>
            Hoy
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Cobrado hoy', value: fmt(collectedToday), color: 'var(--success)' },
              { label: 'Meta del día', value: fmt(dailyGoal), color: 'var(--neon-bright)' },
              { label: 'Prestado hoy', value: fmt(loanedToday), color: 'var(--danger)' },
              { label: 'Clientes cobrados', value: `${clientsPaidToday}/${activeClientsCount}`, color: 'var(--text-primary)' },
            ].map((m) => (
              <div key={m.label} style={{
                background: 'var(--bg-secondary)',
                borderRadius: 14, padding: 12,
              }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>{m.label}</p>
                <p style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 18, color: m.color }}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* Barra progreso */}
          <div>
            <div className="flex justify-between" style={{ marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Progreso del día</span>
              <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>{progressPercent}%</span>
            </div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
              <div style={{
                height: 10, borderRadius: 99,
                width: `${Math.min(progressPercent, 100)}%`,
                background: progressPercent >= 100
                  ? 'linear-gradient(90deg, #059669, #10b981)'
                  : 'var(--gradient-primary)',
                boxShadow: progressPercent > 0 ? '0 0 8px var(--neon-glow)' : 'none',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Estado cartera */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: 16,
        }}>
          <p style={{
            color: 'var(--text-muted)', fontSize: 11,
            fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: 14,
          }}>
            Estado de la cartera
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[
              { label: 'Dinero en calle', value: fmt(totalInStreet), color: 'var(--neon-bright)' },
              { label: 'Capital inyectado', value: fmt(Number(route.capital_injected)), color: 'var(--text-primary)' },
              { label: 'Total clientes', value: String(totalClients), color: 'var(--text-primary)', sub: `${activeClientsCount} activos` },
              { label: 'Créditos activos', value: String(activeCredits?.length ?? 0), color: 'var(--text-primary)', sub: 'en circulación' },
            ].map((m) => (
              <div key={m.label} style={{
                background: 'var(--bg-secondary)',
                borderRadius: 14, padding: 12,
              }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>{m.label}</p>
                <p style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 18, color: m.color }}>
                  {m.value}
                </p>
                {(m as any).sub && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 10 }}>{(m as any).sub}</p>
                )}
              </div>
            ))}
          </div>

          {criticalCount > 0 && (
            <div style={{
              background: 'var(--danger-dim)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>🔴</span>
              <p style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>
                {criticalCount} crédito{criticalCount > 1 ? 's' : ''} crítico{criticalCount > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {watchCount > 0 && (
            <div style={{
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 12, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
              marginTop: 8,
            }}>
              <span>🟡</span>
              <p style={{ color: 'var(--warning)', fontSize: 13, fontWeight: 600 }}>
                {watchCount} crédito{watchCount > 1 ? 's' : ''} en mora
              </p>
            </div>
          )}
        </div>

        {/* Cobrado este mes */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: 16,
        }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <p style={{
              color: 'var(--text-muted)', fontSize: 11,
              fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Cobrado este mes
            </p>
            <p style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 16, color: 'var(--neon-bright)' }}>
              {fmt(collectedMonth)}
            </p>
          </div>

          {Object.keys(paymentsByDay).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
              {Object.entries(paymentsByDay)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, amount]) => (
                  <div key={date} className="flex items-center justify-between"
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: 12, padding: '10px 14px',
                    }}
                  >
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {new Date(date + 'T12:00:00').toLocaleDateString('es-CO', {
                        weekday: 'short', day: 'numeric', month: 'short',
                      })}
                    </p>
                    <p style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 14, color: 'var(--success)' }}>
                      {fmt(amount)}
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
              Sin pagos este mes todavía.
            </p>
          )}
        </div>

        {/* Cierres recientes */}
        {recentClosings && recentClosings.length > 0 && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20, padding: 16,
          }}>
            <p style={{
              color: 'var(--text-muted)', fontSize: 11,
              fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', marginBottom: 14,
            }}>
              Cierres recientes
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentClosings.map((closing: any) => (
                <div key={closing.closing_date}
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 14, padding: '12px 14px',
                  }}
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
                      {new Date(closing.closing_date + 'T12:00:00').toLocaleDateString('es-CO', {
                        weekday: 'short', day: 'numeric', month: 'short',
                      })}
                    </p>
                    <p style={{
                      fontFamily: 'DM Mono', fontWeight: 700, fontSize: 16,
                      color: Number(closing.total_to_deliver) >= 0 ? 'var(--success)' : 'var(--danger)',
                    }}>
                      {fmt(closing.total_to_deliver)}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      Cobrado: {fmt(closing.collected_amount)}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      Prestado: {fmt(closing.loaned_amount)}
                    </p>
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
