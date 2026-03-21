import { createClient } from '@/lib/supabase/server'
import { toggleRouteStatus, deleteRoute, regenerateRoutePassword } from '@/modules/routes/actions'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'

export default async function RutaDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const { data: route, error } = await supabase
    .from('routes')
    .select('*, tenant:tenants(id, name, country, currency)')
    .eq('id', params.id)
    .single()

  if (error || !route) redirect('/superadmin/rutas')

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <PageHeader
        title={route.name}
        backHref="/superadmin/rutas"
        backLabel="← Rutas"
      />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Info de la ruta */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: 20,
        }}>
          <h2 style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: 16,
            color: 'var(--text-primary)', marginBottom: 16,
          }}>
            Información
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Ruta', value: route.name },
              { label: 'Oficina', value: route.tenant?.name },
              { label: 'País', value: route.tenant?.country },
              { label: 'Moneda', value: route.tenant?.currency },
              { label: 'Estado', value: route.status === 'active' ? '● Activa' : '○ Inactiva' },
              { label: 'Capital', value: Number(route.capital_injected).toLocaleString() },
            ].map((item) => (
              <div key={item.label} style={{
                background: 'var(--bg-secondary)',
                borderRadius: 14, padding: 12,
              }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>{item.label}</p>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Credenciales */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--neon-primary)',
          borderRadius: 20, padding: 20,
          boxShadow: '0 0 20px var(--neon-glow)',
        }}>
          <h2 style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: 16,
            color: 'var(--text-primary)', marginBottom: 6,
          }}>
            🔐 Credenciales de acceso
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
            Entrega estas credenciales al cobrador de esta ruta.
          </p>

          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 16, padding: 16,
            display: 'flex', flexDirection: 'column', gap: 12,
            marginBottom: 16,
          }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>Usuario</p>
              <p style={{
                fontFamily: 'DM Mono', fontSize: 14,
                color: 'var(--neon-bright)', fontWeight: 500,
                wordBreak: 'break-all',
              }}>
                {route.access_email}
              </p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>Contraseña</p>
              <p style={{
                fontFamily: 'DM Mono', fontSize: 26,
                color: 'var(--success)', fontWeight: 700,
                letterSpacing: '0.15em',
              }}>
                {route.access_password}
              </p>
            </div>
          </div>

          <form action={async () => {
            'use server'
            await regenerateRoutePassword(params.id)
          }}>
            <button type="submit" style={{
              width: '100%',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 14, padding: '12px 0',
              color: 'var(--warning)', fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}>
              🔄 Regenerar contraseña
            </button>
          </form>
        </div>

        {/* Acciones */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: 20,
        }}>
          <h2 style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: 16,
            color: 'var(--text-primary)', marginBottom: 16,
          }}>
            Acciones
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <form action={async () => {
              'use server'
              await toggleRouteStatus(params.id, route.status)
            }}>
              <button type="submit" style={{
                width: '100%',
                background: route.status === 'active'
                  ? 'var(--bg-secondary)'
                  : 'rgba(16,185,129,0.1)',
                border: `1px solid ${route.status === 'active'
                  ? 'var(--border)' : 'rgba(16,185,129,0.2)'}`,
                borderRadius: 14, padding: '14px 0',
                color: route.status === 'active'
                  ? 'var(--text-muted)' : 'var(--success)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
                {route.status === 'active' ? 'Desactivar ruta' : '✅ Activar ruta'}
              </button>
            </form>

            <form action={async () => {
              'use server'
              await deleteRoute(params.id)
              redirect('/superadmin/rutas')
            }}>
              <button type="submit" style={{
                width: '100%',
                background: 'var(--danger-dim)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 14, padding: '14px 0',
                color: 'var(--danger)', fontSize: 14,
                fontWeight: 600, cursor: 'pointer',
              }}>
                🗑️ Eliminar ruta
              </button>
            </form>
          </div>
        </div>

      </div>
    </main>
  )
}
