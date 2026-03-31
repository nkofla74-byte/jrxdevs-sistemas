import { getOfficeDashboard } from '@/modules/offices/admin-actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/shared/ThemeToggle'
import TutorialModal from '@/components/shared/TutorialModal'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export default async function AdminDashboard() {
  const { data, error } = await getOfficeDashboard()

  if (error || !data) redirect('/login')

  const { tenant, adminName, routes, totalRoutes, totalInStreet,
    collectedToday, collectedMonth, activeClients, criticalCredits } = data

  const currency = tenant?.currency ?? 'COP'

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute', top: '-10%', right: '-10%',
          width: '50%', height: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

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
              <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, color: 'white' }}>
                {tenant?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontFamily: 'Syne', fontWeight: 700, fontSize: 15,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {tenant?.name}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: 99, padding: '2px 8px',
                }}>
                  <span style={{ fontSize: 10 }}>🖥️</span>
                  <span style={{ fontSize: 11, color: 'var(--info)', fontWeight: 700 }}>
                    Administrador
                  </span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {tenant?.country} · {currency}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <p style={{
              color: 'var(--text-muted)', fontSize: 12,
              maxWidth: 100,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {adminName}
            </p>
            <div className="flex items-center gap-2"><TutorialModal role="admin" /><ThemeToggle /></div>
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

      <div className="max-w-6xl mx-auto px-6 py-8">

        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: 26,
            color: 'var(--text-primary)', marginBottom: 4,
          }}>
            Dashboard 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Vista global de {tenant?.name}
          </p>
        </div>

        {criticalCredits > 0 && (
          <div style={{
            background: 'var(--danger-dim)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 16, padding: '14px 18px',
            marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>🔴</span>
            <div>
              <p style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 14 }}>
                {criticalCredits} crédito{criticalCredits > 1 ? 's' : ''} en estado crítico
              </p>
              <p style={{ color: 'rgba(239,68,68,0.7)', fontSize: 12 }}>
                6+ días sin pagar — requiere atención inmediata
              </p>
            </div>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14, marginBottom: 28,
        }}>
          {[
            { label: 'Dinero en calle', value: formatCurrency(totalInStreet, currency), icon: '💰', color: 'var(--neon-bright)', sub: 'Capital prestado activo' },
            { label: 'Cobrado hoy', value: formatCurrency(collectedToday, currency), icon: '📥', color: 'var(--success)', sub: 'Todas las rutas' },
            { label: 'Cobrado este mes', value: formatCurrency(collectedMonth, currency), icon: '📊', color: 'var(--text-primary)', sub: 'Acumulado del mes' },
            { label: 'Clientes activos', value: String(activeClients), icon: '👥', color: 'var(--warning)', sub: 'Con crédito vigente' },
          ].map((metric) => (
            <div key={metric.label} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 20, padding: 18,
            }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{metric.label}</p>
                <span style={{ fontSize: 20 }}>{metric.icon}</span>
              </div>
              <p style={{
                fontFamily: 'DM Mono', fontWeight: 700, fontSize: 22,
                color: metric.color, marginBottom: 4,
              }}>
                {metric.value}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{metric.sub}</p>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 28 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h2 style={{
              fontFamily: 'Syne', fontWeight: 700, fontSize: 18,
              color: 'var(--text-primary)',
            }}>
              Rutas activas ({totalRoutes})
            </h2>
          </div>

          {routes.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}>
              {routes.map((route: any) => (
                <Link key={route.id} href={`/admin/rutas/${route.id}`}
                  className="action-card"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 20, padding: 20,
                    textDecoration: 'none', display: 'block',
                    transition: 'all 0.2s',
                  }}
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: 40, height: 40, borderRadius: 14,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 20,
                      }}>
                        🗺️
                      </div>
                      <p style={{
                        fontFamily: 'Syne', fontWeight: 700, fontSize: 15,
                        color: 'var(--text-primary)',
                      }}>
                        {route.name}
                      </p>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 12 }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>Capital inyectado</p>
                      <p style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                        {formatCurrency(Number(route.capital_injected), currency)}
                      </p>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 12 }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>Estado</p>
                      <p style={{
                        fontWeight: 700, fontSize: 14,
                        color: route.status === 'active' ? 'var(--success)' : 'var(--text-muted)',
                      }}>
                        {route.status === 'active' ? '● Activa' : '○ Inactiva'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 20, padding: 40, textAlign: 'center',
            }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🗺️</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No hay rutas activas.</p>
            </div>
          )}
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 24, padding: 24,
        }}>
          <h2 style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: 18,
            color: 'var(--text-primary)', marginBottom: 20,
          }}>
            Acciones rápidas
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 12,
          }}>
            {[
              { icon: '👥', label: 'Clientes', href: '/admin/clientes' },
              { icon: '💳', label: 'Créditos', href: '/admin/creditos' },
              { icon: '💰', label: 'Capital', href: '/admin/capital' },
              { icon: '📊', label: 'Cierres', href: '/admin/cierres' },
              { icon: '⚙️', label: 'Configuración', href: '/admin/configuracion' },

            ].map((action) => (
              <Link key={action.label} href={action.href}
                className="action-card"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 18, padding: '20px 16px',
                  textAlign: 'center', textDecoration: 'none',
                  display: 'block', transition: 'all 0.2s',
                }}
              >
                <p style={{ fontSize: 30, marginBottom: 10 }}>{action.icon}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
                  {action.label}
                </p>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
