import { getAllRoutes } from '@/modules/routes/actions'
import { toggleRouteStatus, deleteRoute } from '@/modules/routes/actions'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'

const countryFlags: Record<string, string> = {
  CO: '🇨🇴', PE: '🇵🇪', EC: '🇪🇨', BR: '🇧🇷',
}

export default async function RutasPage() {
  const { data: routes, error } = await getAllRoutes()

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <PageHeader
        title="Rutas"
        backHref="/superadmin"
        backLabel="← Inicio"
        action={{ label: '+ Nueva', href: '/superadmin/rutas/nueva' }}
      />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: 24,
            color: 'var(--text-primary)', marginBottom: 4,
          }}>Rutas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {routes?.length ?? 0} rutas registradas
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-dim)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 14, padding: '12px 16px', marginBottom: 16,
          }}>
            <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>
          </div>
        )}

        {routes && routes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {routes.map((route: any) => (
              <div key={route.id} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 20, padding: 16,
              }}>
                {/* Info */}
                <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 22,
                  }}>
                    🗺️
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/superadmin/rutas/${route.id}`} style={{
                      fontWeight: 700, fontSize: 15,
                      color: 'var(--neon-bright)',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis', display: 'block',
                    }}>
                      {route.name}
                    </Link>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {countryFlags[route.tenant?.country]} {route.tenant?.name} · {route.tenant?.currency}
                    </p>
                  </div>
                  <span style={{
                    flexShrink: 0,
                    background: route.status === 'active'
                      ? 'rgba(16,185,129,0.15)'
                      : 'var(--bg-secondary)',
                    color: route.status === 'active' ? 'var(--success)' : 'var(--text-muted)',
                    border: `1px solid ${route.status === 'active'
                      ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                    borderRadius: 99, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {route.status === 'active' ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                {/* Botones */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link href={`/superadmin/rutas/${route.id}`} style={{
                    flex: 1,
                    background: 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: 12, padding: '10px 0',
                    color: 'var(--neon-bright)', fontSize: 13,
                    fontWeight: 600, textDecoration: 'none',
                    textAlign: 'center', display: 'block',
                  }}>
                    Ver detalle
                  </Link>

                  <form action={async () => {
                    'use server'
                    await toggleRouteStatus(route.id, route.status)
                  }} style={{ flex: 1 }}>
                    <button type="submit" style={{
                      width: '100%',
                      background: route.status === 'active'
                        ? 'var(--bg-secondary)'
                        : 'rgba(16,185,129,0.1)',
                      border: `1px solid ${route.status === 'active'
                        ? 'var(--border)' : 'rgba(16,185,129,0.2)'}`,
                      borderRadius: 12, padding: '10px 0',
                      color: route.status === 'active'
                        ? 'var(--text-muted)' : 'var(--success)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>
                      {route.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                  </form>

                  <form action={async () => {
                    'use server'
                    await deleteRoute(route.id)
                  }} style={{ flex: 1 }}>
                    <button type="submit" style={{
                      width: '100%',
                      background: 'var(--danger-dim)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 12, padding: '10px 0',
                      color: 'var(--danger)', fontSize: 13,
                      fontWeight: 600, cursor: 'pointer',
                    }}>
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20, padding: 48, textAlign: 'center',
          }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🗺️</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              No hay rutas registradas.
            </p>
            <Link href="/superadmin/rutas/nueva" style={{
              background: 'var(--gradient-primary)',
              borderRadius: 14, padding: '12px 24px',
              color: 'white', fontSize: 14, fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 0 12px var(--neon-glow)',
            }}>
              Crear primera ruta
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
