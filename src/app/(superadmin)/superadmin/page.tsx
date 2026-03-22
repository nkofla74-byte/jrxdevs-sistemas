import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/shared/ThemeToggle'

function fmt(n: number) {
  return Number(n).toLocaleString('es-CO')
}

export default async function SuperAdminPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const today = new Date().toISOString().split('T')[0]
  const firstDayOfMonth = new Date(
    new Date().getFullYear(), new Date().getMonth(), 1
  ).toISOString().split('T')[0]

  // Métricas globales
  const { count: totalTenants } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  const { count: activeTenants } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .is('deleted_at', null)

  const { count: frozenTenants } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'frozen')
    .is('deleted_at', null)

  const { count: totalRoutes } = await supabase
    .from('routes')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ACTIVE')
    .is('deleted_at', null)

  const { count: criticalCredits } = await supabase
    .from('credits')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'CRITICAL')

  const { count: totalAdmins } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')
    .is('deleted_at', null)

  // Cobrado hoy
  const { data: todayPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('payment_date', today)
    .is('deleted_at', null)

  // Cobrado este mes
  const { data: monthPayments } = await supabase
    .from('payments')
    .select('amount')
    .gte('payment_date', firstDayOfMonth)
    .is('deleted_at', null)

  // Dinero en calle
  const { data: activeCredits } = await supabase
    .from('credits')
    .select('installment_amount, paid_installments, installments')
    .in('status', ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'])

  // Oficinas por país
  const { data: tenantsByCountry } = await supabase
    .from('tenants')
    .select('country, status')
    .is('deleted_at', null)

  // Alertas — oficinas congeladas
  const { data: frozenOffices } = await supabase
    .from('tenants')
    .select('id, name, country')
    .eq('status', 'frozen')
    .is('deleted_at', null)

  // Rutas sin cobrador
  const { data: routesWithoutCobrador } = await supabase
    .from('routes')
    .select('id, name, tenant:tenants(name)')
    .is('cobrador_id', null)
    .eq('status', 'active')
    .is('deleted_at', null)

  // Actividad reciente
  const { data: recentLogs } = await supabase
    .from('audit_logs')
    .select('action, entity, created_at, user:users(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const collectedToday = todayPayments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0
  const collectedMonth = monthPayments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0
  const totalInStreet = activeCredits?.reduce((s, c) => {
    return s + (c.installments - c.paid_installments) * Number(c.installment_amount)
  }, 0) ?? 0

  // Agrupar por país
  const countryStats = tenantsByCountry?.reduce((acc: Record<string, number>, t) => {
    acc[t.country] = (acc[t.country] ?? 0) + 1
    return acc
  }, {}) ?? {}

  const countryFlags: Record<string, string> = {
    CO: '🇨🇴', PE: '🇵🇪', EC: '🇪🇨', BR: '🇧🇷',
  }
  const countryNames: Record<string, string> = {
    CO: 'Colombia', PE: 'Perú', EC: 'Ecuador', BR: 'Brasil',
  }

  const hasAlerts = (frozenTenants ?? 0) > 0 ||
    (criticalCredits ?? 0) > 0 ||
    (routesWithoutCobrador?.length ?? 0) > 0

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      {/* Fondo decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute', top: '-10%', right: '-10%',
          width: '50%', height: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-10%',
          width: '40%', height: '40%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      {/* Header */}
      <header style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 16px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div style={{
              width: 40, height: 40, borderRadius: 14, flexShrink: 0,
              background: 'var(--gradient-primary)',
              boxShadow: '0 0 15px var(--neon-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: 'white' }}>J</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontFamily: 'Syne', fontWeight: 700, fontSize: 15,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                JRXDevs Sistemas
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'rgba(139,92,246,0.15)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: 99, padding: '2px 8px', marginTop: 2,
              }}>
                <span style={{ fontSize: 10 }}>👑</span>
                <span style={{ fontSize: 11, color: 'var(--neon-bright)', fontWeight: 700 }}>
                  Super Admin
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <p style={{
              color: 'var(--text-muted)', fontSize: 12,
              maxWidth: 100,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              display: 'none',
            }}
              className="sm:block"
            >
              {userData?.full_name}
            </p>
            <ThemeToggle />
            <form action="/api/auth/logout" method="POST">
              <button style={{
                background: 'var(--danger-dim)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10, padding: '6px 10px',
                color: 'var(--danger)', fontSize: 12,
                fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6" style={{ position: 'relative', zIndex: 1 }}>

        {/* Bienvenida */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: 26,
            color: 'var(--text-primary)', marginBottom: 4,
          }}>
            Bienvenido 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Alertas críticas */}
        {hasAlerts && (
          <div style={{
            background: 'var(--danger-dim)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 20, padding: 16,
            marginBottom: 20,
          }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--danger)', marginBottom: 12 }}>
              ⚠️ Alertas que requieren atención
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(frozenTenants ?? 0) > 0 && (
                <div className="flex items-center justify-between">
                  <p style={{ color: 'var(--danger)', fontSize: 13 }}>
                    ❄️ {frozenTenants} oficina{(frozenTenants ?? 0) > 1 ? 's' : ''} congelada{(frozenTenants ?? 0) > 1 ? 's' : ''}
                  </p>
                  <Link href="/superadmin/oficinas" style={{
                    color: 'var(--danger)', fontSize: 12,
                    fontWeight: 700, textDecoration: 'none',
                  }}>
                    Ver →
                  </Link>
                </div>
              )}
              {(criticalCredits ?? 0) > 0 && (
                <div className="flex items-center justify-between">
                  <p style={{ color: 'var(--danger)', fontSize: 13 }}>
                    🔴 {criticalCredits} crédito{(criticalCredits ?? 0) > 1 ? 's' : ''} crítico{(criticalCredits ?? 0) > 1 ? 's' : ''} en el sistema
                  </p>
                </div>
              )}
              {(routesWithoutCobrador?.length ?? 0) > 0 && (
                <div className="flex items-center justify-between">
                  <p style={{ color: 'var(--danger)', fontSize: 13 }}>
                    👤 {routesWithoutCobrador?.length} ruta{(routesWithoutCobrador?.length ?? 0) > 1 ? 's' : ''} sin cobrador asignado
                  </p>
                  <Link href="/superadmin/rutas" style={{
                    color: 'var(--danger)', fontSize: 12,
                    fontWeight: 700, textDecoration: 'none',
                  }}>
                    Ver →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Métricas financieras */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12, marginBottom: 20,
        }}>
          {[
            { label: 'Cobrado hoy', value: fmt(collectedToday), icon: '📥', color: 'var(--success)', sub: 'Todas las oficinas' },
            { label: 'Cobrado este mes', value: fmt(collectedMonth), icon: '📊', color: 'var(--neon-bright)', sub: 'Acumulado' },
            { label: 'Dinero en calle', value: fmt(totalInStreet), icon: '💰', color: 'var(--warning)', sub: 'Capital activo' },
            { label: 'Clientes activos', value: fmt(totalClients ?? 0), icon: '👥', color: 'var(--text-primary)', sub: 'Con crédito vigente' },
          ].map((metric) => (
            <div key={metric.label} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 18, padding: 16,
            }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{metric.label}</p>
                <span style={{ fontSize: 18 }}>{metric.icon}</span>
              </div>
              <p style={{
                fontFamily: 'DM Mono', fontWeight: 700,
                fontSize: 20, color: metric.color, marginBottom: 2,
              }}>
                {metric.value}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{metric.sub}</p>
            </div>
          ))}
        </div>

        {/* Métricas del sistema */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12, marginBottom: 20,
        }}>
          {[
            { label: 'Oficinas', value: totalTenants ?? 0, sub: `${activeTenants} activas`, icon: '🏢', color: 'var(--neon-bright)' },
            { label: 'Rutas', value: totalRoutes ?? 0, sub: 'Total', icon: '🗺️', color: 'var(--success)' },
            { label: 'Administradores', value: totalAdmins ?? 0, sub: 'Registrados', icon: '👨‍💼', color: 'var(--warning)' },
            { label: 'Créditos críticos', value: criticalCredits ?? 0, sub: '6+ días sin pagar', icon: '🔴', color: criticalCredits ? 'var(--danger)' : 'var(--text-muted)' },
          ].map((metric) => (
            <div key={metric.label} style={{
              background: 'var(--bg-card)',
              border: `1px solid ${metric.label === 'Créditos críticos' && criticalCredits ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
              borderRadius: 18, padding: 16, textAlign: 'center',
            }}>
              <p style={{ fontSize: 24, marginBottom: 6 }}>{metric.icon}</p>
              <p style={{
                fontFamily: 'DM Mono', fontWeight: 800,
                fontSize: 26, color: metric.color,
              }}>
                {metric.value}
              </p>
              <p style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {metric.label}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{metric.sub}</p>
            </div>
          ))}
        </div>

        {/* Monitor por país */}
        {Object.keys(countryStats).length > 0 && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20, padding: 20, marginBottom: 20,
          }}>
            <h2 style={{
              fontFamily: 'Syne', fontWeight: 700, fontSize: 16,
              color: 'var(--text-primary)', marginBottom: 16,
            }}>
              🌎 Monitor por país
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 10,
            }}>
              {Object.entries(countryStats).map(([country, count]) => (
                <div key={country} style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 14, padding: 14, textAlign: 'center',
                }}>
                  <p style={{ fontSize: 28, marginBottom: 4 }}>{countryFlags[country]}</p>
                  <p style={{
                    fontFamily: 'DM Mono', fontWeight: 700,
                    fontSize: 22, color: 'var(--neon-bright)',
                  }}>
                    {count}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
                    {countryNames[country]}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    {count === 1 ? 'oficina' : 'oficinas'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navegación principal */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: 20, marginBottom: 20,
        }}>
          <h2 style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: 16,
            color: 'var(--text-primary)', marginBottom: 16,
          }}>
            Gestión del sistema
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 10,
          }}>
            {[
              { icon: '🏢', label: 'Oficinas', href: '/superadmin/oficinas', count: totalTenants ?? 0 },
              { icon: '🗺️', label: 'Rutas', href: '/superadmin/rutas', count: totalRoutes ?? 0 },
              { icon: '👨‍💼', label: 'Admins', href: '/superadmin/administradores', count: totalAdmins ?? 0 },
              { icon: '📊', label: 'Monitor', href: '/superadmin/monitor', count: null },
              { icon: '💳', label: 'Facturación', href: '/superadmin/facturacion', count: null },
              { icon: '🔐', label: 'Seguridad', href: '/superadmin/seguridad', count: null },
              { icon: '📋', label: 'Reportes', href: '/superadmin/reportes', count: null },
              { icon: '📝', label: 'Auditoría', href: '/superadmin/auditoria', count: null },
            ].map((item) => (
              <Link key={item.label} href={item.href}
                className="action-card"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 16, padding: '16px 12px',
                  textAlign: 'center', textDecoration: 'none',
                  display: 'block', transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                <p style={{ fontSize: 26, marginBottom: 6 }}>{item.icon}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
                  {item.label}
                </p>
                {item.count !== null && (
                  <p style={{
                    fontFamily: 'DM Mono', fontWeight: 700,
                    fontSize: 14, color: 'var(--neon-bright)', marginTop: 2,
                  }}>
                    {item.count}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Actividad reciente */}
        {recentLogs && recentLogs.length > 0 && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20, padding: 20,
          }}>
            <h2 style={{
              fontFamily: 'Syne', fontWeight: 700, fontSize: 16,
              color: 'var(--text-primary)', marginBottom: 16,
            }}>
              Actividad reciente
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentLogs.map((log: any, i) => (
                <div key={i} style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 14, padding: '10px 14px',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 12,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--neon-bright)' }}>
                      {log.action}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {(log.user as any)?.full_name ?? 'Sistema'} · {log.entity}
                    </p>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>
                    {new Date(log.created_at).toLocaleTimeString('es-CO', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
            <Link href="/superadmin/auditoria" style={{
              display: 'block', textAlign: 'center',
              marginTop: 12, color: 'var(--neon-bright)',
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>
              Ver auditoría completa →
            </Link>
          </div>
        )}

      </div>
    </main>
  )
}
