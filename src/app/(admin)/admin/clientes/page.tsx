import { createClient } from '@/lib/supabase/server'
import { getClientsByOffice } from '@/modules/clients/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import RouteFilter from '@/components/shared/RouteFilter'

const creditStatusEmoji: Record<string, string> = {
  ACTIVE: '🟢', CURRENT: '🟢', WATCH: '🟡',
  WARNING: '🟠', CRITICAL: '🔴',
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { ruta?: string }
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!userData?.tenant_id) redirect('/admin')

  const { data: clients, error } = await getClientsByOffice(
    userData.tenant_id,
    searchParams.ruta
  )

  const { data: routes } = await supabase
    .from('routes')
    .select('id, name')
    .eq('tenant_id', userData.tenant_id)
    .is('deleted_at', null)
    .eq('status', 'active')

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <PageHeader
        title="Clientes"
        backHref="/admin"
        backLabel="← Inicio"
        action={{ label: '+ Nuevo', href: '/admin/clientes/nuevo' }}
      />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>

        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <div>
            <h1 style={{
              fontFamily: 'Syne', fontWeight: 800, fontSize: 24,
              color: 'var(--text-primary)', marginBottom: 4,
            }}>Clientes</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {clients?.length ?? 0} clientes encontrados
            </p>
          </div>
          <RouteFilter
            routes={routes ?? []}
            currentRoute={searchParams.ruta}
            basePath="/admin/clientes"
          />
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

        {clients && clients.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {clients.map((client: any) => {
              const activeCredit = client.credits?.find((c: any) =>
                ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'].includes(c.status)
              )
              return (
                <Link key={client.id} href={`/admin/clientes/${client.id}`}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 18, padding: 16,
                    textDecoration: 'none', display: 'block',
                    transition: 'all 0.2s',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                      background: 'var(--gradient-primary)',
                      boxShadow: '0 0 10px var(--neon-glow)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: 'white' }}>
                        {client.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2">
                        <p style={{
                          fontWeight: 700, fontSize: 15,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap', overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {client.full_name}
                        </p>
                        {activeCredit && (
                          <span style={{ fontSize: 14, flexShrink: 0 }}>
                            {creditStatusEmoji[activeCredit.status]}
                          </span>
                        )}
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        Doc: {client.document_number}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        📍 {client.route?.name}
                      </p>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      {activeCredit && (
                        <p style={{
                          fontFamily: 'DM Mono', fontWeight: 700,
                          fontSize: 14, color: 'var(--neon-bright)',
                        }}>
                          {Number(activeCredit.installment_amount).toFixed(0)}
                        </p>
                      )}
                      <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20, padding: 48, textAlign: 'center',
          }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>👥</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              No hay clientes registrados.
            </p>
            <Link href="/admin/clientes/nuevo" style={{
              background: 'var(--gradient-primary)',
              borderRadius: 14, padding: '12px 24px',
              color: 'white', fontSize: 14, fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 0 12px var(--neon-glow)',
            }}>
              Crear primer cliente
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
