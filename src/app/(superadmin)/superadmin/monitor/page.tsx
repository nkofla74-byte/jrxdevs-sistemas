import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'

function fmt(n: number) {
  return Number(n).toLocaleString('es-CO')
}

export default async function MonitorPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const firstDayOfMonth = new Date(
    new Date().getFullYear(), new Date().getMonth(), 1
  ).toISOString().split('T')[0]

  // Oficinas con sus métricas
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, country, currency, status')
    .is('deleted_at', null)
    .order('country', { ascending: true })

  const countryFlags: Record<string, string> = {
    CO: '🇨🇴', PE: '🇵🇪', EC: '🇪🇨', BR: '🇧🇷',
  }

  // Para cada oficina calcular métricas
  const officeMetrics = await Promise.all(
    (tenants ?? []).map(async (tenant) => {

      const { count: routes } = await supabase
        .from('routes')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .is('deleted_at', null)

      const { count: clients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('status', 'ACTIVE')
        .is('deleted_at', null)

      const { count: critical } = await supabase
        .from('credits')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('status', 'CRITICAL')

      const { data: todayPay } = await supabase
        .from('payments')
        .select('amount')
        .eq('tenant_id', tenant.id)
        .eq('payment_date', today)
        .is('deleted_at', null)

      const { data: monthPay } = await supabase
        .from('payments')
        .select('amount')
        .eq('tenant_id', tenant.id)
        .gte('payment_date', firstDayOfMonth)
        .is('deleted_at', null)

      const collectedToday = todayPay?.reduce((s, p) => s + Number(p.amount), 0) ?? 0
      const collectedMonth = monthPay?.reduce((s, p) => s + Number(p.amount), 0) ?? 0

      return {
        ...tenant,
        routes: routes ?? 0,
        clients: clients ?? 0,
        critical: critical ?? 0,
        collectedToday,
        collectedMonth,
      }
    })
  )

  // Ordenar por cobrado hoy descendente
  const sorted = [...officeMetrics].sort((a, b) => b.collectedToday - a.collectedToday)

  // Totales por país
  const byCountry = officeMetrics.reduce((acc: Record<string, any>, o) => {
    if (!acc[o.country]) {
      acc[o.country] = { offices: 0, clients: 0, collectedToday: 0, collectedMonth: 0, critical: 0 }
    }
    acc[o.country].offices++
    acc[o.country].clients += o.clients
    acc[o.country].collectedToday += o.collectedToday
    acc[o.country].collectedMonth += o.collectedMonth
    acc[o.country].critical += o.critical
    return acc
  }, {})

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <PageHeader
        title="Monitor Global"
        backHref="/superadmin"
        backLabel="← Inicio"
      />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: 24,
            color: 'var(--text-primary)', marginBottom: 4,
          }}>Monitor Global</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Rendimiento en tiempo real de todas las oficinas
          </p>
        </div>

        {/* Por país */}
        <div style={{ marginBottom: 24 }}>
          <p style={{
            color: 'var(--text-muted)', fontSize: 11,
            fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: 12,
          }}>
            Resumen por país
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {Object.entries(byCountry).map(([country, stats]: [string, any]) => (
              <div key={country} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 20, padding: 16,
              }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{countryFlags[country]}</span>
                  <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                    {country === 'CO' ? 'Colombia' : country === 'PE' ? 'Perú' : country === 'EC' ? 'Ecuador' : 'Brasil'}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Oficinas</span>
                    <span style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 13, color: 'var(--neon-bright)' }}>{stats.offices}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Clientes activos</span>
                    <span style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{stats.clients}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Cobrado hoy</span>
                    <span style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 13, color: 'var(--success)' }}>{fmt(stats.collectedToday)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Cobrado mes</span>
                    <span style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 13, color: 'var(--neon-bright)' }}>{fmt(stats.collectedMonth)}</span>
                  </div>
                  {stats.critical > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--danger)', fontSize: 12 }}>Créditos críticos</span>
                      <span style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 13, color: 'var(--danger)' }}>{stats.critical}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking de oficinas */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: 20,
        }}>
          <p style={{
            color: 'var(--text-muted)', fontSize: 11,
            fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: 16,
          }}>
            Ranking de oficinas — cobrado hoy
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sorted.map((office, index) => (
              <div key={office.id} style={{
                background: 'var(--bg-secondary)',
                borderRadius: 16, padding: '14px 16px',
                border: index === 0 ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
              }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 28, height: 28, borderRadius: 10,
                      background: index === 0 ? 'var(--gradient-primary)' : 'var(--bg-card)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'DM Mono', fontWeight: 700, fontSize: 13,
                      color: index === 0 ? 'white' : 'var(--text-muted)',
                      boxShadow: index === 0 ? '0 0 10px var(--neon-glow)' : 'none',
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                        {countryFlags[office.country]} {office.name}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {office.routes} rutas · {office.clients} clientes
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{
                      fontFamily: 'DM Mono', fontWeight: 700,
                      fontSize: 16, color: 'var(--success)',
                    }}>
                      {fmt(office.collectedToday)}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>hoy</p>
                  </div>
                </div>

                {/* Barra de progreso relativa */}
                {sorted[0].collectedToday > 0 && (
                  <div style={{ background: 'var(--bg-card)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: 4, borderRadius: 99,
                      width: `${(office.collectedToday / sorted[0].collectedToday) * 100}%`,
                      background: index === 0 ? 'var(--gradient-primary)' : 'rgba(139,92,246,0.4)',
                      boxShadow: index === 0 ? '0 0 8px var(--neon-glow)' : 'none',
                    }} />
                  </div>
                )}

                {office.critical > 0 && (
                  <p style={{ color: 'var(--danger)', fontSize: 11, marginTop: 6 }}>
                    ⚠️ {office.critical} crédito{office.critical > 1 ? 's' : ''} crítico{office.critical > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            ))}

            {sorted.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                No hay oficinas registradas todavía.
              </p>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}
