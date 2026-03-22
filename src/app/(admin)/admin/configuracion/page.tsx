import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import ScheduleForm from '@/components/admin/ScheduleForm'

export default async function ConfiguracionPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, full_name')
    .eq('id', user.id)
    .single()

  if (!userData?.tenant_id) redirect('/admin')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', userData.tenant_id)
    .single()

  if (!tenant) redirect('/admin')

  const { data: routes } = await supabase
    .from('routes')
    .select('id, name, status, capital_injected, access_email')
    .eq('tenant_id', userData.tenant_id)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <PageHeader
        title="Configuración"
        backHref="/admin"
        backLabel="← Inicio"
      />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div>
          <h1 style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: 24,
            color: 'var(--text-primary)', marginBottom: 4,
          }}>Configuración</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Ajustes de tu oficina
          </p>
        </div>

        {/* Info de la oficina */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: 20,
        }}>
          <p style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: 15,
            color: 'var(--text-primary)', marginBottom: 16,
          }}>
            🏢 Información de la oficina
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Nombre', value: tenant.name },
              { label: 'País', value: tenant.country },
              { label: 'Moneda', value: tenant.currency },
              { label: 'Plan', value: tenant.plan === 'monthly' ? 'Mensual' : 'Trimestral' },
              { label: 'Estado', value: tenant.status === 'active' ? '✅ Activa' : '❄️ Congelada' },
            ].map((item) => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-secondary)',
                borderRadius: 12, padding: '10px 14px',
              }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.label}</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Horario de operación */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: 20,
        }}>
          <p style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: 15,
            color: 'var(--text-primary)', marginBottom: 8,
          }}>
            ⏰ Horario de operación
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
            Define el horario en el que los cobradores pueden registrar pagos y crear créditos.
            Fuera de este horario el cobrador queda en modo solo lectura.
          </p>
          <ScheduleForm
            currentOpenTime={tenant.open_time}
            currentCloseTime={tenant.close_time}
          />
        </div>

        {/* Rutas de la oficina */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: 20,
        }}>
          <p style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: 15,
            color: 'var(--text-primary)', marginBottom: 16,
          }}>
            🗺️ Rutas activas ({routes?.length ?? 0})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {routes?.map((route) => (
              <div key={route.id} style={{
                background: 'var(--bg-secondary)',
                borderRadius: 14, padding: '12px 14px',
              }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                      {route.name}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                      📧 {route.access_email}
                    </p>
                  </div>
                  <span style={{
                    background: route.status === 'active'
                      ? 'rgba(16,185,129,0.1)'
                      : 'var(--bg-card)',
                    color: route.status === 'active'
                      ? 'var(--success)'
                      : 'var(--text-muted)',
                    border: `1px solid ${route.status === 'active'
                      ? 'rgba(16,185,129,0.2)'
                      : 'var(--border)'}`,
                    borderRadius: 99, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {route.status === 'active' ? '✅ Activa' : '⏸️ Inactiva'}
                  </span>
                </div>
              </div>
            ))}
            {(!routes || routes.length === 0) && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                No hay rutas registradas.
              </p>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}
