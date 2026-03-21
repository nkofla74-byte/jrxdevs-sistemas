import { createClient } from '@/lib/supabase/server'
import { getCapitalMovements } from '@/modules/capital/actions'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import CapitalForm from '@/components/shared/CapitalForm'

const typeLabels: Record<string, string> = {
  INJECTION: '💰 Inyección',
  WITHDRAWAL: '💸 Retiro',
  TRANSFER: '↔️ Transferencia',
  REINFORCEMENT: '🔄 Refuerzo',
}

const typeColors: Record<string, string> = {
  INJECTION: 'var(--success)',
  WITHDRAWAL: 'var(--danger)',
  TRANSFER: 'var(--info)',
  REINFORCEMENT: 'var(--warning)',
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateString))
}

export default async function CapitalPage({
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

  const tenantId = userData.tenant_id

  const { data: routes } = await supabase
    .from('routes')
    .select('id, name, capital_injected, status')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  const { data: movements } = await getCapitalMovements(tenantId, searchParams.ruta)

  const totalCapital = routes?.reduce((sum, r) => sum + Number(r.capital_injected), 0) ?? 0

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <PageHeader
        title="Capital"
        backHref="/admin"
        backLabel="← Inicio"
      />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: 24,
            color: 'var(--text-primary)', marginBottom: 4,
          }}>Gestión de capital</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Total en circulación:{' '}
            <span style={{ color: 'var(--neon-bright)', fontWeight: 700 }}>
              {totalCapital.toLocaleString('es-CO')}
            </span>
          </p>
        </div>

        {/* Capital por ruta */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 10, marginBottom: 20,
        }}>
          {routes?.map((route) => (
            <div key={route.id} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16, padding: 14,
            }}>
              <p style={{
                fontWeight: 600, fontSize: 13,
                color: 'var(--text-primary)', marginBottom: 6,
                whiteSpace: 'nowrap', overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {route.name}
              </p>
              <p style={{
                fontFamily: 'DM Mono', fontWeight: 700,
                fontSize: 18, color: 'var(--neon-bright)',
              }}>
                {Number(route.capital_injected).toLocaleString('es-CO')}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                Capital inyectado
              </p>
            </div>
          ))}
        </div>

        {/* Formulario */}
        <CapitalForm routes={routes ?? []} />

        {/* Historial */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: 20, marginTop: 16,
        }}>
          <h2 style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: 16,
            color: 'var(--text-primary)', marginBottom: 16,
          }}>
            Historial de movimientos
          </h2>

          {movements && movements.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
              {movements.map((mov: any) => (
                <div key={mov.id} style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 14, padding: '12px 14px',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 12,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontWeight: 600, fontSize: 13,
                      color: typeColors[mov.type],
                    }}>
                      {typeLabels[mov.type]}
                    </p>
                    <p style={{
                      color: 'var(--text-muted)', fontSize: 12,
                      whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {mov.route?.name}
                      {mov.notes ? ` · ${mov.notes}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{
                      fontFamily: 'DM Mono', fontWeight: 700,
                      fontSize: 14, color: 'var(--text-primary)',
                    }}>
                      {Number(mov.amount).toLocaleString('es-CO')}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      {formatDate(mov.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
              No hay movimientos registrados.
            </p>
          )}
        </div>

      </div>
    </main>
  )
}
