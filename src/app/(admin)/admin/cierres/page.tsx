import { createClient } from '@/lib/supabase/server'
import { getCashClosings } from '@/modules/cash-closing/actions'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import RouteFilter from '@/components/shared/RouteFilter'

function fmt(n: number) {
  return Number(n).toLocaleString('es-CO')
}

export default async function CierresPage({
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
    .select('id, name')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('deleted_at', null)

  const { data: closings, error } = await getCashClosings(tenantId, searchParams.ruta)

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <PageHeader
        title="Cierres de caja"
        backHref="/admin"
        backLabel="← Inicio"
      />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>

        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <div>
            <h1 style={{
              fontFamily: 'Syne', fontWeight: 800, fontSize: 24,
              color: 'var(--text-primary)', marginBottom: 4,
            }}>Cierres de caja</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Últimos 60 cierres
            </p>
          </div>
          <RouteFilter
            routes={routes ?? []}
            currentRoute={searchParams.ruta}
            basePath="/admin/cierres"
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

        {closings && closings.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {closings.map((closing: any) => (
              <div key={closing.id} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 20, padding: 16,
              }}>
                {/* Header */}
                <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                      {new Date(closing.closing_date).toLocaleDateString('es-CO', {
                        weekday: 'long', day: '2-digit', month: 'long',
                      })}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                      📍 {closing.route?.name}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>Total a entregar</p>
                    <p style={{
                      fontFamily: 'DM Mono', fontWeight: 800, fontSize: 22,
                      color: Number(closing.total_to_deliver) >= 0
                        ? 'var(--success)' : 'var(--danger)',
                    }}>
                      {fmt(closing.total_to_deliver)}
                    </p>
                  </div>
                </div>

                {/* Detalle */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}>
                  {[
                    { label: 'Capital base', value: fmt(closing.base_amount), color: 'var(--text-primary)' },
                    { label: '+ Cobrado', value: `+${fmt(closing.collected_amount)}`, color: 'var(--success)' },
                    { label: '- Prestado', value: `-${fmt(closing.loaned_amount)}`, color: 'var(--danger)' },
                    { label: '- Gastos', value: `-${fmt(closing.expenses_amount)}`, color: 'var(--warning)' },
                  ].map((item) => (
                    <div key={item.label} style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: 12, padding: 10,
                    }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>
                        {item.label}
                      </p>
                      <p style={{
                        fontFamily: 'DM Mono', fontWeight: 700,
                        fontSize: 14, color: item.color,
                      }}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {closing.notes && (
                  <p style={{
                    color: 'var(--text-muted)', fontSize: 12,
                    marginTop: 10, padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 10,
                  }}>
                    📝 {closing.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20, padding: 48, textAlign: 'center',
          }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📊</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
              No hay cierres registrados todavía.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              Los cierres los realiza el cobrador al finalizar su jornada.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
