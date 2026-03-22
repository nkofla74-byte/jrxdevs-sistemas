import { getRouteDashboard } from '@/modules/offices/admin-actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ResetDeviceButton from '@/components/shared/ResetDeviceButton'
import CobradorLocationButton from '@/components/admin/CobradorLocationButton'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export default async function AdminRouteDashboard({
  params,
}: {
  params: { id: string }
}) {
  const { data, error } = await getRouteDashboard(params.id)

  if (error || !data) redirect('/admin')

  const { route, currency, totalInStreet, collectedToday,
    collectedMonth, capitalInjected, totalClients,
    criticalClients, watchClients } = data

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <header style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 16px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12, padding: '8px 14px',
              color: 'var(--text-secondary)', fontSize: 13,
              fontWeight: 600, textDecoration: 'none',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              ← Inicio
            </Link>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontFamily: 'Syne', fontWeight: 700, fontSize: 15,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {route.name}
              </p>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: route.status === 'active'
                  ? 'rgba(16,185,129,0.15)'
                  : 'var(--bg-secondary)',
                border: `1px solid ${route.status === 'active'
                  ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                borderRadius: 99, padding: '2px 8px',
                fontSize: 11, fontWeight: 700,
                color: route.status === 'active' ? 'var(--success)' : 'var(--text-muted)',
              }}>
                {route.status === 'active' ? '● Activa' : '○ Inactiva'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {criticalClients > 0 && (
          <div style={{
            background: 'var(--danger-dim)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 16, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>🔴</span>
            <p style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>
              {criticalClients} cliente{criticalClients > 1 ? 's' : ''} en estado crítico — 6+ días sin pagar
            </p>
          </div>
        )}

        {watchClients > 0 && (
          <div style={{
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 16, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>🟡</span>
            <p style={{ color: 'var(--warning)', fontSize: 13, fontWeight: 600 }}>
              {watchClients} cliente{watchClients > 1 ? 's' : ''} con mora — requieren seguimiento
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Capital inyectado', value: formatCurrency(capitalInjected, currency), color: 'var(--text-primary)', icon: '🏦' },
            { label: 'Dinero en calle', value: formatCurrency(totalInStreet, currency), color: 'var(--neon-bright)', icon: '💰' },
            { label: 'Cobrado hoy', value: formatCurrency(collectedToday, currency), color: 'var(--success)', icon: '📥' },
            { label: 'Cobrado este mes', value: formatCurrency(collectedMonth, currency), color: 'var(--text-primary)', icon: '📊' },
            { label: 'Clientes activos', value: String(totalClients), color: 'var(--warning)', icon: '👥' },
            { label: 'Por cobrar hoy', value: formatCurrency(totalInStreet - collectedToday, currency), color: 'var(--warning)', icon: '⏳' },
          ].map((m) => (
            <div key={m.label} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16, padding: 14,
            }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{m.label}</p>
                <span style={{ fontSize: 16 }}>{m.icon}</span>
              </div>
              <p style={{
                fontFamily: 'DM Mono', fontWeight: 700,
                fontSize: 18, color: m.color,
              }}>
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Acciones de la ruta */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: 16,
        }}>
          <p style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: 15,
            color: 'var(--text-primary)', marginBottom: 14,
          }}>
            Acciones de la ruta
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[
              { icon: '👥', label: 'Ver clientes', href: `/admin/clientes?ruta=${route.id}` },
              { icon: '💳', label: 'Ver créditos', href: `/admin/creditos?ruta=${route.id}` },
              { icon: '💰', label: 'Capital', href: `/admin/capital?ruta=${route.id}` },
              { icon: '📊', label: 'Cierres', href: `/admin/cierres?ruta=${route.id}` },
            ].map((btn) => (
              <Link key={btn.label} href={btn.href}
                className="action-card"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 14, padding: '14px 12px',
                  textAlign: 'center', textDecoration: 'none',
                  display: 'block', transition: 'all 0.2s',
                }}
              >
                <p style={{ fontSize: 24, marginBottom: 6 }}>{btn.icon}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
                  {btn.label}
                </p>
              </Link>
            ))}
          </div>
          <ResetDeviceButton routeId={route.id} routeName={route.name} />
        </div>

        {/* Ubicación en tiempo real */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 20, padding: 20,
        }}>
          <p style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: 15,
            color: 'var(--text-primary)', marginBottom: 8,
          }}>
            📍 Ubicación en tiempo real
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
            Consulta dónde está el cobrador en este momento.
            La ubicación se actualiza cada 30 segundos automáticamente.
          </p>
          <CobradorLocationButton routeId={route.id} routeName={route.name} />
        </div>

      </div>
    </main>
  )
}
